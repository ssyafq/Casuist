import json
import argparse
from pathlib import Path
from typing import Callable

import chromadb
from sentence_transformers import SentenceTransformer

from src.config import (
    DATA_PROCESSED_DIR,
    CHROMA_DB_PATH,
    CHROMA_COLLECTION,
    EMBED_MODEL,
)
from src.models import CaseSection, ProcessedCase


# Module-level cache so the model is loaded only once
_embed_model: SentenceTransformer | None = None


def _get_embed_model() -> SentenceTransformer:
    global _embed_model
    if _embed_model is None:
        print(f"Loading embedding model '{EMBED_MODEL}' (first load may take ~30s)...")
        _embed_model = SentenceTransformer(EMBED_MODEL)
    return _embed_model


class LocalEmbeddingFunction(chromadb.EmbeddingFunction):
    """ChromaDB-compatible embedding function backed by a local SentenceTransformer."""

    def __call__(self, input: list[str]) -> list[list[float]]:
        model = _get_embed_model()
        embeddings = model.encode(input, show_progress_bar=False)
        return embeddings.tolist()


def get_chroma_collection() -> chromadb.Collection:
    """Get or create the ChromaDB collection with the local embedding function."""
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    embed_fn = LocalEmbeddingFunction()
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        embedding_function=embed_fn,
    )
    return collection


def section_to_chroma_document(section: CaseSection) -> dict:
    """Convert a CaseSection to a ChromaDB-compatible document dict."""
    doc_id = f"{section.pmid}_{section.section_type}_{section.chunk_index}"
    metadata = {
        "pmid": section.pmid,
        "pmc_id": section.pmc_id if section.pmc_id is not None else "",
        "title": section.title,
        "authors": "; ".join(section.authors),
        "specialty": section.specialty,
        "section_type": section.section_type,
        "chunk_index": section.chunk_index,
        "char_count": section.char_count,
    }
    return {
        "id": doc_id,
        "document": section.text,
        "metadata": metadata,
    }


def index_processed_case(
    processed_case: ProcessedCase,
    collection: chromadb.Collection,
) -> int:
    """Index all sections of a ProcessedCase into ChromaDB. Returns number of sections added."""
    if processed_case.skipped_reason or not processed_case.sections:
        return 0

    docs = [section_to_chroma_document(s) for s in processed_case.sections]
    if not docs:
        return 0

    collection.upsert(
        ids=[d["id"] for d in docs],
        documents=[d["document"] for d in docs],
        metadatas=[d["metadata"] for d in docs],
    )
    return len(docs)


def run_index_pipeline(processed_dir: Path, collection: chromadb.Collection) -> None:
    """CLI entry point: index all processed case JSONs into ChromaDB."""
    processed_files = list(processed_dir.glob("*_processed.json"))
    if not processed_files:
        print(f"No processed case files found in {processed_dir}")
        return

    total_chunks = 0
    total_cases = 0

    for path in processed_files:
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)

            # Reconstruct ProcessedCase (sections are dicts, convert to CaseSection)
            sections = [CaseSection(**s) for s in data.get("sections", [])]
            case = ProcessedCase(
                pmid=data["pmid"],
                pmc_id=data.get("pmc_id"),
                title=data["title"],
                authors=data["authors"],
                specialty=data["specialty"],
                sections=sections,
                skipped_reason=data.get("skipped_reason"),
            )

            n = index_processed_case(case, collection)
            if n > 0:
                print(f"  [OK]   {case.pmid} — {n} chunks indexed")
                total_chunks += n
                total_cases += 1
            else:
                print(f"  [SKIP] {case.pmid} — no indexable sections")

        except Exception as e:
            print(f"  [ERROR] {path.name}: {e}")

    print(f"\nDone. Cases indexed: {total_cases}, Total chunks: {total_chunks}")
    print(f"ChromaDB collection '{CHROMA_COLLECTION}' now has {collection.count()} documents.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index processed cases into ChromaDB")
    parser.add_argument("--input", default=str(DATA_PROCESSED_DIR), help="Processed JSON directory")
    args = parser.parse_args()
    collection = get_chroma_collection()
    run_index_pipeline(Path(args.input), collection)
