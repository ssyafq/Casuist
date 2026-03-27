"""Casuist API — serves real clinical cases and AI feedback to the web frontend."""

import json
import os
import random
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Casuist API")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

CASES_DIR = Path(__file__).resolve().parent.parent / "data" / "cases"
PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

# Maps UI specialty slug → list of condition keywords found in case JSON "specialty" field.
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
# Groq client — initialized at startup
# ---------------------------------------------------------------------------
_groq_client = None
_groq_ready: bool = False
_groq_init_error: str = ""

GROQ_MODEL = "llama-3.3-70b-versatile"


def _load_system_prompt() -> str:
    path = PROMPTS_DIR / "clinical_feedback.txt"
    try:
        return path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return "You are a clinical education assistant. Educational purposes only — not a substitute for clinical training."


def _load_cases() -> None:
    for path in CASES_DIR.glob("*.json"):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            if all(k in data for k in ("case_id", "specialty", "chief_complaint", "differentials", "correct_ranking")):
                all_cases.append(data)
        except Exception:
            pass
    print(f"[Casuist API] Loaded {len(all_cases)} cases from {CASES_DIR}")


def _init_groq() -> None:
    global _groq_client, _groq_ready, _groq_init_error
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        _groq_init_error = "GROQ_API_KEY not set"
        print(f"[Casuist API] WARNING: {_groq_init_error}. Feedback will be unavailable.")
        return
    try:
        from groq import Groq
        _groq_client = Groq(api_key=api_key)
        _groq_ready = True
        print("[Casuist API] Groq client ready.")
    except Exception as e:
        _groq_init_error = str(e)
        print(f"[Casuist API] WARNING: Groq init failed: {e}. Feedback will be unavailable.")


@app.on_event("startup")
def startup() -> None:
    _load_cases()
    _init_groq()


@app.get("/api/status")
def get_status() -> dict:
    return {"rag_ready": _groq_ready, "rag_error": _groq_init_error, "cases_loaded": len(all_cases)}


# ---------------------------------------------------------------------------
# Case endpoints
# ---------------------------------------------------------------------------

def _cases_for_specialty(specialty: str) -> list[dict]:
    allowed = [v.lower() for v in SPECIALTY_MAP.get(specialty.lower(), [])]
    if not allowed:
        return []
    return [c for c in all_cases if c.get("specialty", "").lower() in allowed]


@app.get("/api/specialties")
def get_specialties() -> list[dict]:
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


def _build_feedback_prompt(req: FeedbackRequest) -> str:
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
        f"Cite relevant published case reports where possible using [PMID: XXXXXXXX] format."
    )


def _fetch_pubmed_titles(pmids: list[str]) -> dict[str, str]:
    if not pmids:
        return {}
    try:
        import httpx
        url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "json",
            "api_key": os.getenv("NCBI_API_KEY", ""),
        }
        resp = httpx.get(url, params=params, timeout=10)
        data = resp.json()
        result = {}
        for pmid in pmids:
            try:
                result[pmid] = data["result"][pmid]["title"]
            except (KeyError, TypeError):
                result[pmid] = f"PMID {pmid}"
        return result
    except Exception as e:
        print(f"[Casuist API] esummary fetch failed: {e}")
        return {pmid: f"PMID {pmid}" for pmid in pmids}


def _parse_citations(text: str) -> list[dict]:
    """Extract [PMID: XXXXXXXX] citations from response text."""
    import re
    pmids = re.findall(r"\[PMID:\s*(\d+)\]", text)
    seen: set[str] = set()
    unique_pmids = []
    for pmid in pmids:
        if pmid not in seen:
            seen.add(pmid)
            unique_pmids.append(pmid)
    titles = _fetch_pubmed_titles(unique_pmids)
    return [
        {"pmid": pmid, "title": titles.get(pmid, f"PMID {pmid}"), "authors": ""}
        for pmid in unique_pmids
    ]


@app.post("/api/feedback", response_model=FeedbackResponse)
def get_feedback(req: FeedbackRequest):
    if not _groq_ready:
        raise HTTPException(status_code=503, detail="Feedback service unavailable — Groq not initialized.")

    from tenacity import RetryError, retry, retry_if_exception_type, stop_after_attempt, wait_exponential

    system_prompt = _load_system_prompt()
    user_prompt = _build_feedback_prompt(req)

    @retry(
        retry=retry_if_exception_type(Exception),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=30),
        reraise=True,
    )
    def _call_groq() -> str:
        response = _groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=1024,
        )
        return response.choices[0].message.content

    try:
        answer_text = _call_groq()
    except RetryError:
        raise HTTPException(status_code=429, detail="AI feedback unavailable due to rate limiting. Please wait 60 seconds and try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback generation failed: {e}")

    return FeedbackResponse(
        feedback_text=answer_text,
        citations=_parse_citations(answer_text),
    )
