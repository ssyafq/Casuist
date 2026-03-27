# Casuist

Biomedical case-based learning platform — "LeetCode for medical students." Users pick a medical specialty, work through real PubMed case reports with progressive reveal, rank differential diagnoses, and receive AI feedback with citations and a scored result.

## ⚠️ Project Status: PARKED (March 2026)

Core concept validated. Tech stack proven. Reddit beta showed real interest.
Parked to focus on **Soma (Human Digital Twin)** and SGEndoscopy internship.

**Live URLs:**
- Frontend (Vercel): https://casuist-yujs.vercel.app
- Backend (Railway): https://casuist-production.up.railway.app
- Telegram Bot: t.me/CasuistBetaBot
- API Status: https://casuist-production.up.railway.app/api/status

**Remaining tasks before full park:**
- [ ] Fix citation title mismatch — `_parse_citations()` in `api/main.py` leaves `title: ""`, need to call NCBI esummary to fetch real titles
- [ ] Navbar cleanup/polish
- [ ] Write public-facing README (project story, screenshots, tech stack, live links)

**NOT being built (intentionally parked):**
- Auth / user accounts
- Progress tracking / case history
- Leaderboard
- Freemium / payments
- Custom domain
- RAG grounding restoration (rag_ready: false — citations come from Groq training knowledge, not actual PubMed chunk retrieval)

---

## Current State

- ✅ CLI prototype — fully complete (all 5 pieces)
- ✅ Telegram bot — fully complete, live on Railway
- ✅ FastAPI backend — serving 607 real cases + AI feedback endpoint
- ✅ Web UI — 4 pages fully wired, real cases, real scoring, real AI feedback
- ✅ Deployment — Railway (FastAPI) + Vercel (Next.js) both live and stable

### What Works
- **Navigation**: Landing → Specialties → Case → Scorecard, all wired with `useRouter`
- **Real cases**: FastAPI serves 607 cases across 5 specialties (not mock data)
- **Case flow**: 5-second countdown → timer → progressive section reveal (exam -2pts, labs -3pts) → inline diagnosis ranking
- **Inline ranking**: Right panel toggles between info gathering and diagnosis ranking; rankings persist when switching back and forth
- **Scoring**: Deterministic TypeScript — accuracy (40), ranking (30), efficiency (20), speed (10)
- **AI feedback**: Via Groq `llama-3.3-70b-versatile`. Opt-in (click to load), returns LLM narrative + PMID citations. `rag_ready: false` — citations from model training knowledge, not ChromaDB retrieval
- **IEEE citations**: Numbered citations with clickable PubMed titles (title fetch via NCBI esummary — fix in progress)
- **Telegram bot**: Full case flow + scorecard, all 5 specialties

### Known Issues
- **Citation title mismatch** — `_parse_citations()` extracts PMIDs but never fetches titles (left as `""`). Fix: call NCBI esummary after extracting PMIDs
- **Diagnosis button truncation** — long diagnosis names clip on mobile. Deferred — not worth fixing before park
- **rag_ready: false** — ChromaDB not on Railway (local-only). Feedback uses Groq direct call, not RAG retrieval. Accepted limitation for parked state

---

## Project Structure

```
Casuist/                          # Root — Python backend + FastAPI
├── CLAUDE.md
├── requirements-full.txt         # Full Python dependencies
├── requirements-railway.txt      # Stripped deps for Railway (no ML libs)
├── requirements-bot.txt          # Telegram bot dependencies
├── Dockerfile.api                # Railway deployment (FastAPI backend)
├── .env                          # GROQ_API_KEY, NCBI_EMAIL, NCBI_API_KEY, TELEGRAM_BOT_TOKEN
├── bot.py                        # Telegram bot entry point
├── api/
│   ├── __init__.py
│   └── main.py                   # FastAPI app — case endpoints + feedback endpoint
├── src/
│   ├── __init__.py
│   ├── fetcher.py                # PubMed search + BioC full-text retrieval
│   ├── processor.py              # BioC JSON parsing, section extraction, metadata
│   ├── chunker.py                # Document chunking + ChromaDB indexing
│   ├── rag.py                    # LlamaIndex query engine + citation extraction
│   ├── config.py                 # API keys, paths, SPECIALTY_MAP, RAG settings
│   ├── case_engine.py            # CLI interactive case loop (reference implementation)
│   ├── scorer.py                 # MCQ scoring, efficiency tracking, score cards
│   ├── case_generator.py         # Batch case generation via Groq
│   └── models.py                 # Dataclasses: CaseReport, CaseSection, ScoreCard
├── prompts/
│   └── clinical_feedback.txt     # System prompt for Groq feedback call
├── data/
│   ├── raw/                      # Fetched BioC JSON files — 660 files
│   ├── processed/                # Structured case JSON files — 616 files
│   ├── cases/                    # AI-generated structured cases — 607 files
│   └── results/                  # Student attempt results
├── chroma_db/                    # ChromaDB persistent storage — 949 chunks (gitignored, local only)
└── casuist-web/                  # Next.js frontend
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx              # Landing page
    │   ├── specialties/page.tsx  # Specialty selection
    │   ├── case/page.tsx         # Case view — two-panel, inline ranking, timer
    │   └── scorecard/page.tsx    # Scorecard — 2x2 grid, AI feedback + citations
    ├── components/
    │   ├── Navbar.tsx            # Landing page navbar (scroll hide/show)
    │   ├── InnerNavbar.tsx       # Inner pages (collapsible pill, top-left)
    │   ├── rotating-tagline.tsx
    │   └── product-mockup.tsx
    └── lib/
        ├── scoring.ts            # Deterministic scoring (TypeScript port)
        ├── session.ts            # sessionStorage helpers
        └── mock-case.ts          # CaseData interface + API_BASE constant
```

## Two Separate Apps — Important

**Python backend** lives at `Casuist/` root.
**Next.js frontend** lives at `Casuist/casuist-web/`.
When doing frontend work, always `cd casuist-web` first.

---

## Tech Stack

### Backend (Python)
- Python 3.10+ with venv
- FastAPI + Uvicorn
- Groq API — `llama-3.3-70b-versatile` (feedback), `llama-3.1-8b-instant` (case generation)
- LlamaIndex + ChromaDB (local only — not on Railway)
- HuggingFace `BAAI/bge-small-en-v1.5` embeddings (local only)
- Biopython for PubMed/NCBI API
- python-telegram-bot

### Frontend (Next.js)
- Next.js 14 + TypeScript, App Router
- Tailwind CSS
- Lucide React icons
- DM Sans + DM Mono fonts
- Primary blue: `#2E86C1`, warm background: `#f8f8f6`

### Deployment
- **Railway** (FastAPI backend) — `Dockerfile.api`, `requirements-railway.txt` (stripped ML deps)
- **Vercel** (Next.js frontend)

## Railway Config
- Dockerfile: `Dockerfile.api`
- Start command: `sh -c "uvicorn api.main:app --host 0.0.0.0 --port 8000"`
- Port: 8000
- `requirements-railway.txt`: `fastapi, uvicorn, groq==0.9.0, httpx==0.27.0, tenacity, python-dotenv`

## Environment Variables

**Railway:**
- `GROQ_API_KEY`
- `NCBI_EMAIL`
- `NCBI_API_KEY`
- `CORS_ORIGINS` = https://casuist-yujs.vercel.app (no trailing slash)

**Vercel:**
- `NEXT_PUBLIC_API_URL` = https://casuist-production.up.railway.app (no trailing slash!)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/specialties` | List specialties with real case counts |
| `GET` | `/api/case/random?specialty=X` | Random case for a specialty |
| `POST` | `/api/feedback` | AI feedback + citations |
| `GET` | `/api/status` | Shows RAG init state + cases loaded |

## Scoring System

| Component | Points |
|-----------|--------|
| Diagnosis accuracy (correct #1 dx) | 40 |
| Ranking quality (positional scoring) | 30 |
| Info efficiency (targeted gathering) | 20 |
| Speed bonus (10/10 under 60s, -1 per 30s after) | 10 |

Grades: A (90-100), B (75-89), C (60-74), D (<60)

## Data

| Metric | Value |
|--------|-------|
| Raw PubMed JSONs | 660 |
| Processed cases | 616 |
| ChromaDB chunks | 949 |
| AI-generated structured cases | 607 |
| Specialties | 5 (Cardiology, Respiratory, Neurology, Gastroenterology, Endocrinology) |

---

## Running Locally

```bash
# Terminal 1 — API
cd Casuist
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # Mac/Linux
uvicorn api.main:app --reload --port 8000

# Terminal 2 — Frontend
cd Casuist/casuist-web
npm run dev                       # localhost:3000
```

---

## Important Warnings

- **ChromaDB is local-only.** Not viable on Railway — stripped from `requirements-railway.txt`. `rag_ready: false` in production is expected and accepted.
- **Two terminals needed.** API on :8000, frontend on :3000, both must be running locally.
- **Venv required for API locally.** `uvicorn api.main:app` must run inside `.venv` for RAG imports.
- **Light mode only.** No dark mode, no `dark:` Tailwind variants.
- **NEXT_PUBLIC_API_URL must have no trailing slash.** Double-slash bug will break all API calls.
- **SPECIALTY_MAP** exists in both `api/main.py` and `src/config.py` — keep in sync if ever editing.
- **Medical disclaimer** — all AI output must include "Educational purposes only — not a substitute for clinical training."
- **ChromaDB gitignored** — never commit `chroma_db/`.

## Frontend Rules
- Light mode only
- Lucide React for icons (not Material Symbols)
- Tailwind semantic tokens: `text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`
- Primary blue: `#2E86C1`, dark navy: `#1A5276`

---

## Key Lessons Learned

- ChromaDB is local-only — not viable on Railway. Direct Groq API calls are the right pattern for deployed environments.
- Railway does repo-level security scan before Docker build — keep root clean.
- Strip ML deps (LlamaIndex, HuggingFace, torch) for Railway deployment — use `requirements-railway.txt`.
- `NEXT_PUBLIC_API_URL` must have no trailing slash.
- Railway start command needs `sh -c` wrapper for `$PORT` expansion.
- `next.config.ts` not supported in Next.js 14 — use `next.config.mjs`.
- Opt-in > automatic for slow operations (AI feedback is opt-in to prevent UX friction from Groq latency).

---

## Reddit Beta Results

- r/NursingStudents: 744 views, 5 upvotes, 5 comments, multiple DMs
- r/premed: blocked by karma wall
- Telegram bot used as primary entry point (t.me links banned in Reddit DMs)