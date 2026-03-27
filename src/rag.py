import argparse
from pathlib import Path

import chromadb
import groq as groq_module
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    RetryError,
)

from llama_index.core import VectorStoreIndex, StorageContext, Settings
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.groq import Groq
from llama_index.vector_stores.chroma import ChromaVectorStore

from src.config import (
    GROQ_API_KEY,
    GROQ_MODEL,
    EMBED_MODEL,
    SIMILARITY_TOP_K,
    RESPONSE_MODE,
    GROQ_MAX_RETRIES,
    GROQ_RETRY_WAIT_MIN,
    GROQ_RETRY_WAIT_MAX,
    expand_specialty,
)
from src.chunker import get_chroma_collection

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
SYSTEM_PROMPT_PATH = PROMPTS_DIR / "clinical_feedback.txt"


def _load_system_prompt() -> str:
    try:
        return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return "You are a clinical education assistant. Educational purposes only — not a substitute for clinical training."


def build_llm() -> Groq:
    """Return a configured LlamaIndex Groq LLM instance."""
    return Groq(
        model=GROQ_MODEL,
        api_key=GROQ_API_KEY,
        temperature=0.1,
        system_prompt=_load_system_prompt(),
    )


def build_embed_model() -> HuggingFaceEmbedding:
    """Return a LlamaIndex HuggingFace embedding model for query-time use."""
    return HuggingFaceEmbedding(model_name=EMBED_MODEL)


def build_index(
    collection: chromadb.Collection,
    embed_model: HuggingFaceEmbedding,
) -> VectorStoreIndex:
    """Wrap an existing ChromaDB collection as a LlamaIndex VectorStoreIndex."""
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_vector_store(
        vector_store,
        storage_context=storage_context,
        embed_model=embed_model,
    )
    return index


def build_query_engine(index: VectorStoreIndex, llm: Groq, specialty: str | None = None):
    """Create the query engine with the Groq LLM and retrieval settings.
    If specialty is provided, results are filtered to that specialty only.
    """
    kwargs = {
        "llm": llm,
        "similarity_top_k": SIMILARITY_TOP_K,
        "response_mode": RESPONSE_MODE,
    }
    if specialty:
        subs = expand_specialty(specialty)
        if len(subs) == 1:
            kwargs["vector_store_kwargs"] = {"where": {"specialty": subs[0]}}
        else:
            kwargs["vector_store_kwargs"] = {"where": {"specialty": {"$in": subs}}}
    return index.as_query_engine(**kwargs)


def extract_citations(response) -> list[dict]:
    """Extract and deduplicate citation metadata from LlamaIndex source nodes."""
    seen_pmids: set[str] = set()
    citations: list[dict] = []

    for node_with_score in getattr(response, "source_nodes", []):
        meta = node_with_score.node.metadata
        pmid = meta.get("pmid", "")
        if not pmid or pmid in seen_pmids:
            continue
        seen_pmids.add(pmid)
        citations.append({
            "pmid": pmid,
            "title": meta.get("title", "Unknown title"),
            "authors": meta.get("authors", ""),
            "pmc_id": meta.get("pmc_id", ""),
            "section_type": meta.get("section_type", ""),
            "specialty": meta.get("specialty", ""),
        })

    return citations


def format_response_with_citations(answer_text: str, citations: list[dict]) -> str:
    """Append formatted citation list and disclaimer to the answer."""
    output = answer_text.strip()

    if citations:
        output += "\n\nSources:"
        for c in citations:
            authors = c["authors"] if c["authors"] else "Unknown authors"
            output += f"\n[PMID: {c['pmid']}] {authors}. \"{c['title']}\" ({c['specialty']})"

    output += "\n\nEducational purposes only — not a substitute for clinical training."
    return output


def query(question: str, query_engine) -> str:
    """Run a query with automatic retry on Groq rate limits."""

    @retry(
        stop=stop_after_attempt(GROQ_MAX_RETRIES),
        wait=wait_exponential(multiplier=2, min=GROQ_RETRY_WAIT_MIN, max=GROQ_RETRY_WAIT_MAX),
        retry=retry_if_exception_type((
            groq_module.RateLimitError,
            groq_module.APIConnectionError,
        )),
        before_sleep=lambda retry_state: print(
            f"  [RETRY] Rate limited. Retrying in ~{retry_state.next_action.sleep:.0f}s "
            f"(attempt {retry_state.attempt_number}/{GROQ_MAX_RETRIES})..."
        ),
    )
    def _execute():
        return query_engine.query(question)

    try:
        response = _execute()
        citations = extract_citations(response)
        return format_response_with_citations(str(response), citations)
    except RetryError:
        return (
            "Query failed after maximum retries due to API rate limiting. "
            "Please wait 60 seconds and try again.\n\n"
            "Educational purposes only — not a substitute for clinical training."
        )
    except Exception as e:
        return (
            f"Query failed: {e}\n\n"
            "Educational purposes only — not a substitute for clinical training."
        )


def query_structured(question: str, query_engine) -> tuple[str, list[dict]]:
    """Run RAG query, return (answer_text, citations) separately for API use.

    Unlike query(), this lets RetryError propagate so the caller can handle it
    (e.g. return HTTP 429).
    """

    @retry(
        stop=stop_after_attempt(GROQ_MAX_RETRIES),
        wait=wait_exponential(multiplier=2, min=GROQ_RETRY_WAIT_MIN, max=GROQ_RETRY_WAIT_MAX),
        retry=retry_if_exception_type((
            groq_module.RateLimitError,
            groq_module.APIConnectionError,
        )),
        before_sleep=lambda retry_state: print(
            f"  [RETRY] Rate limited. Retrying in ~{retry_state.next_action.sleep:.0f}s "
            f"(attempt {retry_state.attempt_number}/{GROQ_MAX_RETRIES})..."
        ),
    )
    def _execute():
        return query_engine.query(question)

    response = _execute()
    citations = extract_citations(response)
    return str(response), citations


def run_rag_pipeline() -> None:
    """CLI entry point: single-query mode (--query) or interactive REPL."""
    parser = argparse.ArgumentParser(description="Query the Casuist RAG pipeline")
    parser.add_argument("--query", help="Single query to run (omit for interactive REPL)")
    parser.add_argument("--specialty", help="Filter results to a specific specialty (e.g. cardiology)")
    args = parser.parse_args()

    specialty: str | None = args.specialty.lower().strip() if args.specialty else None

    print("Initialising Casuist RAG pipeline...")
    collection = get_chroma_collection()

    if collection.count() == 0:
        print("WARNING: ChromaDB collection is empty. Run the fetcher and chunker first.")
        return

    embed_model = build_embed_model()
    llm = build_llm()

    # Configure LlamaIndex global settings
    Settings.embed_model = embed_model
    Settings.llm = llm

    index = build_index(collection, embed_model)
    query_engine = build_query_engine(index, llm, specialty=specialty)

    scope = f"specialty={specialty}" if specialty else "all specialties"
    print(f"Ready. Collection has {collection.count()} chunks. Scope: {scope}\n")

    if args.query:
        print(f"Query: {args.query}\n")
        result = query(args.query, query_engine)
        print(result)
    else:
        print("Interactive mode. Type 'exit' or 'quit' to stop.\n")
        while True:
            try:
                question = input("Casuist RAG > ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nExiting.")
                break
            if not question:
                continue
            if question.lower() in ("exit", "quit"):
                print("Exiting.")
                break
            result = query(question, query_engine)
            print(f"\n{result}\n")


if __name__ == "__main__":
    run_rag_pipeline()
