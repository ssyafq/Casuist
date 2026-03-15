# Casuist

Biomedical case-based learning platform — "LeetCode for medical students." Users pick a medical specialty, work through real PubMed case reports with progressive reveal, rank differential diagnoses, and receive RAG-grounded AI feedback with citations and a scored result.

## Current State (March 2026)

- ✅ CLI prototype — fully complete (all 5 pieces)
- ✅ Telegram bot — fully complete (all 4 pieces), live on Railway
- 🔄 Web UI — in progress (Next.js scaffolded, 4 pages rendering at localhost:3000, navigation wiring next)
- 📋 FastAPI backend — not yet started (comes after navigation is wired)

## Project Structure

```
Casuist/                          # Root — Python backend
├── CLAUDE.md
├── requirements-full.txt         # Full Python dependencies
├── requirements-bot.txt          # Telegram bot dependencies
├── Dockerfile                    # Railway deployment
├── .env                          # GROQ_API_KEY, NCBI_EMAIL, NCBI_API_KEY, TELEGRAM_BOT_TOKEN
├── bot.py                        # Telegram bot entry point
├── src/
│   ├── __init__.py
│   ├── fetcher.py                # PubMed search + BioC full-text retrieval
│   ├── processor.py              # BioC JSON parsing, section extraction, metadata
│   ├── chunker.py                # Document chunking + ChromaDB indexing
│   ├── rag.py                    # LlamaIndex query engine + citation extraction
│   ├── case_engine.py            # CLI interactive case loop (reference implementation)
│   ├── scorer.py                 # MCQ scoring, efficiency tracking, score cards
│   ├── case_generator.py         # Batch case generation via Groq
│   └── models.py                 # Dataclasses: CaseReport, CaseSection, ScoreCard
├── data/
│   ├── raw/                      # Fetched BioC JSON files ({pmid}.json) — 660 files
│   ├── processed/                # Structured case JSON files — 616 files
│   ├── cases/                    # AI-generated structured cases — 607 files
│   └── results/                  # Student attempt results (results.json)
├── chroma_db/                    # ChromaDB persistent storage — 949 chunks, 5 specialties
└── casuist-web/                  # Next.js frontend (SEPARATE from Python backend)
    ├── src/
    │   └── app/
    │       ├── layout.tsx         # Root layout — DM Sans + DM Mono fonts
    │       ├── globals.css        # Light mode only, #F8FAFC background
    │       ├── page.tsx           # Landing page
    │       ├── specialties/
    │       │   └── page.tsx       # Specialty selection (5 specialty cards)
    │       ├── case/
    │       │   └── page.tsx       # Case view (two-panel: info left, actions right)
    │       └── scorecard/
    │           └── page.tsx       # Scorecard (score breakdown + AI feedback toggle)
    └── src/components/
        └── Navbar.tsx             # Shared navbar — used on all 4 pages
```

## Two Separate Apps — Important

**Python backend** lives at `Casuist/` root. All Python work goes here.
**Next.js frontend** lives at `Casuist/casuist-web/`. All frontend work goes here.
Never mix them up. When doing frontend work, always `cd casuist-web` first.

## Tech Stack

### Backend (Python)
- Python 3.10+ with venv
- LlamaIndex for RAG orchestration
- Groq API — `llama-3.3-70b-versatile` for clinical reasoning, `llama-3.1-8b-instant` for batch/classification
- HuggingFace `BAAI/bge-small-en-v1.5` for local embeddings (free, no API key)
- ChromaDB (PersistentClient, local) for vector store
- Biopython for PubMed/NCBI API access
- python-telegram-bot for Telegram bot
- Deployed on Railway via Dockerfile

### Frontend (Next.js)
- Next.js 14 with TypeScript
- Tailwind CSS with custom medical blue palette
- DM Sans + DM Mono (Google Fonts via next/font)
- Lucide React for icons
- No auth yet — not needed during development

## Data State

| Metric | Value |
|--------|-------|
| Raw case JSONs | 660 |
| Processed cases | 616 |
| ChromaDB chunks | 949 |
| Specialties | 5 (Cardiology, Respiratory, Neurology, Gastroenterology, Endocrinology) |
| AI-generated structured cases | 607 |

## Design System (Frontend)

| Role | Color |
|------|-------|
| Primary | `#2E86C1` |
| Dark navy | `#1A5276` |
| Background | `#F8FAFC` |
| Cards | `#FFFFFF` |
| Border | `#E2E8F0` |
| Text | `#0F172A` |
| Text secondary | `#64748B` |

- **Light mode only** — no dark mode, no dark: Tailwind variants
- **Fonts:** DM Sans (body/headings), DM Mono (labels, scores, IDs)

## Frontend Commands

```bash
cd casuist-web
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # Lint check
```

## Backend Commands

```bash
# Activate venv
source .venv/bin/activate  # Mac/Linux
.venv\Scripts\activate     # Windows

# Run Telegram bot locally
python bot.py

# Fetch cases from PubMed
python -m src.fetcher --specialty cardiology --max 50

# Process and index fetched cases
python -m src.chunker --input data/raw/ --output data/processed/

# Test RAG queries
python -m src.rag --query "differential diagnoses for chest pain with elevated troponin"

# Run CLI case engine (reference implementation)
python -m src.case_engine
```

## Architecture Decisions

- **Every AI response must include citations.** Format: `[PMID: 12345678]`. Core differentiator.
- **Scoring is deterministic Python, not LLM.** No hallucination risk in grading. LLM only used for feedback narrative.
- **AI feedback is opt-in.** User must click "See AI Feedback" — not auto-loaded. Prevents UX where user taps "Next Case" before feedback loads.
- **Section-based chunking.** Each case section = one chunk. 50-token overlap. Metadata: pmid, specialty, section_type, authors.
- **ChromaDB collection:** `medical_cases`. PersistentClient at `./chroma_db/`.
- **Case data model:** `chief_complaint`, `demographics`, `revealable_sections`, `correct_diagnosis`, `differential_options` (list of 5), `correct_ranking`.

## Scoring System

| Component | Points |
|-----------|--------|
| Diagnosis accuracy (correct #1 dx) | 40 |
| Ranking quality (positional scoring) | 30 |
| Info efficiency (targeted gathering) | 20 |
| Speed bonus (under 3 minutes) | 10 |

Grades: A (90-100), B (75-89), C (60-74), D (<60)

## Next Steps (In Order)

1. **Wire frontend navigation** — clicking specialty card → case view, scorecard → back to specialties, landing CTA → specialties
2. **Build FastAPI backend** — expose Python case engine as REST API endpoints
3. **Connect frontend to backend** — replace mock data with real API calls
4. **Deploy web UI** — Railway or Vercel

## Important Warnings

- **Two app folders** — always double check you're editing the right one
- **Tailwind custom colors** — `bg-background-light`, `text-text-main`, `bg-primary` etc must be in `tailwind.config.ts` or they won't render
- **No dark: variants** — frontend is light mode only, remove all dark: classes
- **Groq rate limits** — free tier has limits, add retry logic for batch processing
- **ChromaDB gitignored** — chroma_db/ is large and machine-specific, never commit it
- **Medical disclaimer** — all AI output must include "Educational purposes only — not a substitute for clinical training"

@AGENTS.md

## Frontend Rules
- Always read node_modules/next/dist/docs/ before writing Next.js code
- Light mode only, no dark: variants
- Follow gemini.md design system