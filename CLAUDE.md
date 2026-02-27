# Casuist

Biomedical case-based learning platform. Students work through clinical cases with progressive reveal, get RAG-grounded AI feedback with PubMed citations, and receive scored results.

## Current State (as of Feb 27, 2026)

- **CLI prototype:** Fully complete across all 5 pieces
- **Raw files:** 660 in `data/raw/`
- **Processed cases:** 616 (44 skipped — insufficient sections)
- **ChromaDB chunks:** 949 chunks across 5 parent specialties
- **Structured cases in `data/cases/`:** 3 (all cardiology — needs expansion)
- **Specialty menu:** Working — shows all 5 specialties + Random at launch
- **Difficulty tagging:** NOT YET IMPLEMENTED

## Tech Stack

- Python 3.10+ with venv (no conda, no poetry — just venv + pip)
- LlamaIndex for RAG orchestration
- Groq API — Llama 3.3 70B for clinical reasoning, Llama 3.1 8B for classification tasks
- HuggingFace `BAAI/bge-small-en-v1.5` for local embeddings (free, no API key)
- ChromaDB (PersistentClient, local file storage) for vector store
- Biopython for PubMed/NCBI API access
- `python-telegram-bot` v21 — next interface milestone (Weeks 7-8)

## Project Structure

```
casuist/
├── CLAUDE.md
├── requirements.txt
├── .env                  # GROQ_API_KEY, NCBI_EMAIL, NCBI_API_KEY, TELEGRAM_BOT_TOKEN
├── src/
│   ├── __init__.py
│   ├── config.py         # SPECIALTY_MAP + resolve_specialty() helper
│   ├── fetcher.py        # PubMed search + BioC full-text retrieval
│   ├── processor.py      # BioC JSON parsing, section extraction, metadata
│   ├── chunker.py        # Document chunking + ChromaDB indexing
│   ├── rag.py            # LlamaIndex query engine + citation extraction
│   ├── case_engine.py    # Interactive progressive case reveal loop + specialty menu
│   ├── scoring.py        # MCQ scoring, efficiency tracking, score cards
│   ├── bot.py            # Telegram bot (Weeks 7-8 — not yet built)
│   └── models.py         # Dataclasses: CaseReport, CaseSection, ScoreCard
├── data/
│   ├── raw/              # Fetched BioC JSON files ({pmid}.json) — 660 files
│   ├── processed/        # Structured case JSON files — 616 cases
│   └── results/          # Student attempt results (results.json)
├── chroma_db/            # ChromaDB persistent storage (gitignored) — 949 chunks
├── data/cases/           # Manually curated case files for case engine — 3 cases (cardiology only)
└── tests/
    ├── test_fetcher.py
    ├── test_processor.py
    ├── test_rag.py
    └── test_scorer.py
```

## Specialty Taxonomy (Two-Level System)

Fetching uses specific disease names, not parent specialty names. `SPECIALTY_MAP` in `src/config.py` handles the mapping.

| Parent Specialty | Fetch Terms Used |
|---|---|
| Cardiology | cardiology, chest pain, myocardial infarction, acute coronary syndrome |
| Respiratory | pneumonia, pulmonary embolism, COPD, chronic obstructive pulmonary disease |
| Neurology | stroke, seizure, meningitis |
| Endocrinology | diabetic ketoacidosis, thyroid storm |
| Gastroenterology | pancreatitis, gastrointestinal hemorrhage, liver failure |

**Rule:** Always fetch by specific disease name, never by parent specialty name. `--specialty "respiratory"` returns 0 PMIDs. Use `--specialty "pneumonia"` instead.

**To add a new disease:** Add one line to `SPECIALTY_MAP` in `src/config.py`:
```python
"new disease name": ("parent specialty", "subspecialty label"),
```

## Case JSON Schema

Each file in `data/cases/` must have these exact fields:

```json
{
  "case_id": "unique_id",
  "specialty": "cardiology",
  "subspecialty": "myocardial infarction",
  "difficulty": "medium",
  "chief_complaint": "...",
  "demographics": "...",
  "history": "...",
  "exam": "...",
  "labs": "...",
  "diagnosis": "...",
  "differential_options": ["dx1", "dx2", "dx3", "dx4", "dx5"],
  "correct_ranking": ["dx1", "dx3", "dx2", "dx5", "dx4"]
}
```

**Note:** `difficulty` field is in schema but LLM classifier not yet implemented. Manually tag for now.

## Difficulty Rubric (defined, classifier not yet built)

| Level | Criteria |
|---|---|
| Easy | Classic textbook presentation, 1-2 obvious differentials, common diagnosis |
| Medium | Atypical presentation OR multiple plausible differentials, requires investigation reasoning |
| Hard | Rare diagnosis, misleading presentation, overlapping differentials, uncommon specialty knowledge |

## Commands

```bash
# Environment (Windows)
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt

# Run the CLI prototype
python -m src.case_engine

# Run tests
pytest tests/ -v

# Fetch cases — use DISEASE NAME not specialty name
python -m src.fetcher --specialty "pneumonia" --max 50
python -m src.fetcher --specialty "stroke" --max 50

# Process all raw JSONs
python -m src.processor

# Chunk and index into ChromaDB (wipe and rebuild)
python -m src.chunker

# Test RAG queries directly
python -m src.rag --query "differential diagnoses for chest pain with elevated troponin"
```

## Build Sequence

All 5 CLI pieces complete. Current phase is Weeks 7-8: Telegram Bot MVP.

1. ✅ **Fetcher** → 660 raw JSONs in `data/raw/`
2. ✅ **Processor + Chunker** → 616 processed cases, 949 chunks in ChromaDB
3. ✅ **RAG Pipeline** → LlamaIndex + Groq + ChromaDB, citations working
4. ✅ **Case Engine** → Full CLI loop with specialty menu
5. ✅ **Scorer** → 4-component scoring, scorecard, results saved to `data/results.json`
6. 🔲 **Telegram Bot** → Port CLI flow to `src/bot.py` using `python-telegram-bot` v21

## Scoring System (deterministic Python — no LLM)

Four components, 100 points total:

| Component | Points | Logic |
|---|---|---|
| Diagnosis Accuracy | 40 | Correct #1 = 40pts, correct in top 3 = 15pts, else 0 |
| Ranking Quality | 30 | 6pts exact position, 3pts off-by-one, per differential |
| Information Efficiency | 20 | 1 section viewed = 20pts, 2 = 15pts, 3 = 10pts, 0 = 5pts |
| Speed Bonus | 10 | <3min = 10pts, <5min = 7pts, <8min = 4pts, else 0 |

Grade boundaries: A (90-100), B (75-89), C (60-74), D (<60)

## Architecture Decisions

- **Every AI response must include citations.** Format: `[PMID: 12345678]`. Never generate feedback without source references from retrieved nodes.
- **Two-level specialty taxonomy.** `specialty` = parent (cardiology), `subspecialty` = disease (myocardial infarction). Both stamped on every chunk's metadata.
- **Section-based chunking, not fixed-size.** Each case report section becomes one chunk with 50-token overlap. Metadata: pmid, pmc_id, title, authors, section_type, specialty.
- **ChromaDB collection name:** `medical_cases`. PersistentClient at `./chroma_db/`.
- **Groq model split:** Llama 3.3 70B for clinical reasoning feedback only. Llama 3.1 8B for all classification tasks (difficulty tagging, specialty tagging). Never use 70B for batch classification — too expensive.
- **Embedding model:** `BAAI/bge-small-en-v1.5` via HuggingFace (local, free).
- **LlamaIndex query:** `similarity_top_k=5`, `response_mode="compact"`.
- **Scoring is deterministic Python — no LLM.** LLM only used for educational feedback narrative, never for numerical score.
- **In-memory state for Telegram bot.** `user_sessions: dict[int, SessionState]` keyed by `chat_id`. No database until beta has paying users.
- **Config via .env file.** Load with `python-dotenv`. Never hardcode API keys.
- **All storage is local.** Migration to Qdrant Cloud planned when Telegram bot goes live with real users.

## Important Warnings

- **NCBI requires an email for Entrez API access.** Set `Entrez.email` before any call.
- **Fetch by disease name, not specialty.** `--specialty "respiratory"` returns 0 PMIDs.
- **Not all PMIDs have PMC full text.** Expect ~83% hit rate. Log and skip unavailable ones — normal behaviour.
- **BioC JSON structure varies wildly.** Processor uses alias-based section matching — do not revert to exact string matching.
- **Medical content disclaimer.** Include "Educational purposes only — not a substitute for clinical training" in every AI feedback response.
- **ChromaDB `chroma_db/` directory must be gitignored.** Large and machine-specific.
- **Groq free tier has rate limits.** Add retry logic with exponential backoff. Don't burst during batch processing.
- **Windows:** Use `.venv\Scripts\activate` not `source .venv/bin/activate`. Use `Select-String` not `grep`.

## Coding Conventions

- Type hints on all function signatures. Use `str | None` not `Optional[str]`.
- Dataclasses for all data models (in `models.py`).
- Functions over classes unless state management is genuinely needed.
- Print statements for CLI output — no logging framework at prototype stage.
- Handle errors with try/except with clear error messages, not silent failures.
- Keep files under 300 lines. Split if exceeded.

## Immediate Next Priorities

1. **Telegram Bot MVP** (`src/bot.py`) — port CLI flow using `python-telegram-bot` v21, in-memory state, deploy to Railway free tier
2. **Expand `data/cases/`** — manually structure 7+ more cases across all 5 specialties (currently only 3 cardiology cases)
3. **Difficulty classifier** — LLM classifier using Llama 3.1 8B, tag all cases, add difficulty selection menu after specialty menu
4. **End-to-end test** — run 5 full cases across different specialties once cases/ is populateds