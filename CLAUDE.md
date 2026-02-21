# Casuist

Biomedical case-based learning CLI prototype. Students work through clinical cases with progressive reveal, get RAG-grounded AI feedback with PubMed citations, and receive scored results.

## Tech Stack

- Python 3.10+ with venv (no conda, no poetry — just venv + pip)
- LlamaIndex for RAG orchestration
- Groq API (Llama 3.3 70B) for LLM inference
- HuggingFace `BAAI/bge-small-en-v1.5` for local embeddings (free, no API key)
- ChromaDB (PersistentClient, local file storage) for vector store
- Biopython for PubMed/NCBI API access
- No web framework yet — this is a CLI prototype only

## Project Structure

```
casuist/
├── CLAUDE.md
├── requirements.txt
├── .env                  # GROQ_API_KEY, NCBI_EMAIL, NCBI_API_KEY
├── src/
│   ├── __init__.py
│   ├── fetcher.py        # PubMed search + BioC full-text retrieval
│   ├── processor.py      # BioC JSON parsing, section extraction, metadata
│   ├── chunker.py        # Document chunking + ChromaDB indexing
│   ├── rag.py            # LlamaIndex query engine + citation extraction
│   ├── case_engine.py    # Interactive progressive case reveal loop
│   ├── scorer.py         # MCQ scoring, efficiency tracking, score cards
│   └── models.py         # Dataclasses: CaseReport, CaseSection, ScoreCard
├── data/
│   ├── raw/              # Fetched BioC JSON files ({pmid}.json)
│   ├── processed/        # Structured case JSON files
│   └── results/          # Student attempt results (results.json)
├── chroma_db/            # ChromaDB persistent storage (gitignored)
├── cases/                # Manually curated case files for case engine
└── tests/
    ├── test_fetcher.py
    ├── test_processor.py
    ├── test_rag.py
    └── test_scorer.py
```

## Commands

```bash
# Environment
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run the CLI prototype
python -m src.case_engine

# Run tests
pytest tests/ -v

# Fetch cases from PubMed (example: 50 cardiology case reports)
python -m src.fetcher --specialty cardiology --max 50

# Process and index fetched cases into ChromaDB
python -m src.chunker --input data/raw/ --output data/processed/

# Test RAG queries directly
python -m src.rag --query "differential diagnoses for chest pain with elevated troponin"
```

## Build Sequence

This prototype is built in 5 sequential pieces. **Do not skip ahead.** Each piece has a validation checkpoint — if it fails, iterate on that piece before moving forward.

1. **Fetcher** → PubMed search via Entrez + BioC full-text retrieval → saves raw JSON to `data/raw/`. Checkpoint: 30+ usable case JSONs saved.
2. **Processor + Chunker** → Parse BioC JSON into sections (History, Exam, Labs, Diagnosis, Discussion), add metadata (PMID, title, authors, specialty), chunk by section, embed with bge-small, store in ChromaDB. Checkpoint: `collection.query("chest pain diagnosis", n_results=3)` returns sensible results.
3. **RAG Pipeline** → LlamaIndex VectorStoreIndex over ChromaDB, Groq LLM, CitationQueryEngine that extracts PMID/title/authors from node metadata. Checkpoint: 5+ clinical queries return grounded, cited responses.
4. **Case Engine** → CLI interaction loop: show chief complaint → student requests info sections → student ranks differential diagnoses → RAG generates cited feedback. Checkpoint: 3+ full case loops feel natural and feedback is useful.
5. **Scorer** → Score student responses (diagnosis accuracy 40pts, ranking 30pts, info efficiency 20pts, speed 10pts), generate score card, store results to `data/results/results.json`. Checkpoint: 5 end-to-end cases feel like a real learning experience.

## Architecture Decisions

- **Every AI response must include citations.** Format: `[PMID: 12345678]`. This is the core differentiator — never generate feedback without source references from retrieved nodes.
- **Section-based chunking, not fixed-size.** Each case report section (History, Exam, Labs, etc.) becomes one chunk. Add 50-token overlap between adjacent sections. Attach metadata: pmid, pmc_id, title, authors, section_type, specialty.
- **ChromaDB collection name:** `medical_cases`. Use PersistentClient with path `./chroma_db/`.
- **Groq model:** `llama-3.3-70b-versatile`. Use free tier for development.
- **Embedding model:** `BAAI/bge-small-en-v1.5` via HuggingFace (runs locally, no API cost).
- **LlamaIndex query:** `similarity_top_k=5`, `response_mode="compact"`.
- **Case data model:** Each case has `chief_complaint`, `demographics`, `revealable_sections` (dict of section_name → content), `correct_diagnosis`, `differential_options` (list of 5), `correct_ranking` (ordered list).
- **Config via .env file.** Load with `python-dotenv`. Never hardcode API keys.

## Important Warnings

- **NCBI requires an email for Entrez API access.** Set `Entrez.email` before any call. Also register for an NCBI API key for higher rate limits (10 req/sec vs 3 req/sec).
- **Not all PMIDs have PMC full text.** The PMID→PMC ID conversion via `Entrez.elink()` will fail for many articles. Expect ~60-70% hit rate. Log and skip unavailable ones — this is normal.
- **BioC JSON structure varies wildly across papers.** The processor must handle missing sections gracefully. If key sections (History, Diagnosis) can't be found, skip that case rather than indexing garbage.
- **Medical content disclaimer.** All AI output is educational only. Include "Educational purposes only — not a substitute for clinical training" in every feedback response.
- **ChromaDB `chroma_db/` directory must be gitignored.** It's large and machine-specific.
- **Groq free tier has rate limits.** Add retry logic with exponential backoff. Don't burst requests during batch processing.

## Coding Conventions

- Type hints on all function signatures. Use `str | None` not `Optional[str]`.
- Dataclasses for all data models (in `models.py`).
- Functions over classes unless state management is genuinely needed.
- Print statements for CLI output — no logging framework needed at prototype stage.
- Handle errors with try/except and clear error messages, not silent failures.
- Keep files under 300 lines. If a file grows past that, split it.

## What This Prototype Is NOT

This is a CLI tool. No web UI, no Telegram bot, no authentication, no database (just JSON files), no deployment. Those come after the prototype validates the core learning loop. Focus on making the case interaction + RAG feedback + scoring actually work well.
