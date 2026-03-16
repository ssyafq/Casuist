"""Casuist API — serves real clinical cases and RAG feedback to the web frontend."""

import json
import random
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Casuist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CASES_DIR = Path(__file__).resolve().parent.parent / "data" / "cases"

# Maps UI specialty slug → list of condition keywords found in case JSON "specialty" field.
# Mirrors src/bot.py SPECIALTY_MAP (lines 44-50).
SPECIALTY_MAP: dict[str, list[str]] = {
    "cardiology": ["chest pain", "myocardial infarction", "acute coronary syndrome", "cardiology"],
    "respiratory": ["pulmonary embolism", "pneumonia", "copd"],
    "neurology": ["seizure", "stroke", "meningitis", "neurology"],
    "endocrinology": ["diabetic ketoacidosis", "thyroid storm", "endocrinology"],
    "gastroenterology": [
        "pancreatitis",
        "gastrointestinal bleed",
        "gastroenterology",
        "gastrointestinal oncology",
    ],
}

SPECIALTY_LABELS: dict[str, str] = {
    "cardiology": "Cardiology",
    "respiratory": "Respiratory",
    "neurology": "Neurology",
    "endocrinology": "Endocrinology",
    "gastroenterology": "Gastroenterology",
}

SPECIALTY_EMOJIS: dict[str, str] = {
    "cardiology": "\U0001fac0",
    "respiratory": "\U0001fac1",
    "neurology": "\U0001f9e0",
    "endocrinology": "\u2697\ufe0f",
    "gastroenterology": "\U0001f52c",
}

all_cases: list[dict] = []

# ---------------------------------------------------------------------------
# RAG state — initialized at startup, used by /api/feedback
# ---------------------------------------------------------------------------
_rag_index = None
_rag_llm = None
_rag_ready: bool = False


def _load_cases() -> None:
    """Load all case JSONs into memory."""
    for path in CASES_DIR.glob("*.json"):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            if all(k in data for k in ("case_id", "specialty", "chief_complaint", "differentials", "correct_ranking")):
                all_cases.append(data)
        except Exception:
            pass
    print(f"[Casuist API] Loaded {len(all_cases)} cases from {CASES_DIR}")


_rag_init_error: str = ""


def _init_rag() -> None:
    """Initialize RAG pipeline (ChromaDB + embeddings + Groq LLM). Fails gracefully."""
    global _rag_index, _rag_llm, _rag_ready, _rag_init_error
    try:
        from llama_index.core import Settings

        from src.chunker import get_chroma_collection
        from src.rag import build_embed_model, build_index, build_llm

        collection = get_chroma_collection()
        if collection.count() == 0:
            print("[Casuist API] WARNING: ChromaDB empty — feedback endpoint unavailable")
            return

        embed_model = build_embed_model()
        llm = build_llm()
        Settings.embed_model = embed_model
        Settings.llm = llm

        _rag_index = build_index(collection, embed_model)
        _rag_llm = llm
        _rag_ready = True
        print(f"[Casuist API] RAG ready. {collection.count()} chunks indexed.")
    except Exception as e:
        _rag_init_error = str(e)
        print(f"[Casuist API] WARNING: RAG init failed: {e}. Feedback will be unavailable.")


@app.get("/api/status")
def get_status() -> dict:
    """Diagnostic endpoint — shows RAG initialization state."""
    return {"rag_ready": _rag_ready, "rag_error": _rag_init_error, "cases_loaded": len(all_cases)}


@app.on_event("startup")
def startup() -> None:
    _load_cases()
    _init_rag()


# ---------------------------------------------------------------------------
# Case endpoints
# ---------------------------------------------------------------------------

def _cases_for_specialty(specialty: str) -> list[dict]:
    """Filter cases matching a UI specialty slug."""
    allowed = [v.lower() for v in SPECIALTY_MAP.get(specialty.lower(), [])]
    if not allowed:
        return []
    return [c for c in all_cases if c.get("specialty", "").lower() in allowed]


@app.get("/api/specialties")
def get_specialties() -> list[dict]:
    """Return available specialties with case counts."""
    return [
        {
            "slug": slug,
            "name": SPECIALTY_LABELS.get(slug, slug.capitalize()),
            "emoji": SPECIALTY_EMOJIS.get(slug, ""),
            "case_count": len(_cases_for_specialty(slug)),
        }
        for slug in SPECIALTY_MAP
    ]


@app.get("/api/case/random")
def get_random_case(specialty: str = Query(..., description="Specialty slug")) -> dict:
    """Return a random case for the given specialty."""
    cases = _cases_for_specialty(specialty)
    if not cases:
        raise HTTPException(status_code=404, detail=f"No cases found for specialty: {specialty}")
    return random.choice(cases)


# ---------------------------------------------------------------------------
# Feedback endpoint
# ---------------------------------------------------------------------------

class FeedbackRequest(BaseModel):
    specialty: str
    correct_diagnosis: str
    student_top_diagnosis: str
    chief_complaint: str
    history: str | None = None
    exam: str | None = None
    labs: str | None = None


class FeedbackResponse(BaseModel):
    feedback_text: str
    citations: list[dict]
    disclaimer: str = "Educational purposes only \u2014 not a substitute for clinical training."


def _build_feedback_query(req: FeedbackRequest) -> str:
    """Build the RAG prompt from student attempt data. Mirrors case_engine.build_rag_query."""
    parts = ""
    if req.history:
        parts += f"History: {req.history}\n"
    if req.exam:
        parts += f"Examination: {req.exam}\n"
    if req.labs:
        parts += f"Investigations: {req.labs}\n"
    if not parts:
        parts = f"Chief complaint: {req.chief_complaint}"

    return (
        f"A medical student reviewed the following case:\n\n"
        f"{parts}\n"
        f"The student ranked '{req.student_top_diagnosis}' as their most likely diagnosis. "
        f"The correct diagnosis is '{req.correct_diagnosis}'.\n\n"
        f"Please explain why '{req.correct_diagnosis}' is the correct diagnosis for this case, "
        f"what key clinical and investigation findings support it, "
        f"and what distinguishes it from the other differentials. "
        f"Cite relevant published case reports where possible."
    )


@app.post("/api/feedback", response_model=FeedbackResponse)
def get_feedback(req: FeedbackRequest):
    """Generate RAG-grounded AI feedback for a completed case attempt."""
    if not _rag_ready:
        raise HTTPException(status_code=503, detail="Feedback service unavailable — RAG pipeline not initialized.")

    from tenacity import RetryError

    from src.rag import build_query_engine, query_structured

    prompt = _build_feedback_query(req)

    try:
        engine = build_query_engine(_rag_index, _rag_llm, specialty=req.specialty)
        answer_text, citations = query_structured(prompt, engine)
    except RetryError:
        raise HTTPException(status_code=429, detail="AI feedback unavailable due to rate limiting. Please wait 60 seconds and try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback generation failed: {e}")

    return FeedbackResponse(
        feedback_text=answer_text,
        citations=[
            {"pmid": c["pmid"], "title": c.get("title", ""), "authors": c.get("authors", "")}
            for c in citations
        ],
    )
