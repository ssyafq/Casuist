import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    from Bio import Entrez
except ImportError as e:
    raise ImportError(
        f"Missing dependency: {e}. "
        "Run: .venv\\Scripts\\activate && pip install -r requirements.txt"
    ) from e

load_dotenv()

# API credentials
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
NCBI_EMAIL: str = os.getenv("NCBI_EMAIL", "")
NCBI_API_KEY: str = os.getenv("NCBI_API_KEY", "")

# Set Entrez email for all modules that import config
Entrez.email = NCBI_EMAIL
if NCBI_API_KEY and NCBI_API_KEY != "placeholder_replace_me":
    Entrez.api_key = NCBI_API_KEY

# Paths
DATA_RAW_DIR: Path = Path("data/raw")
DATA_PROCESSED_DIR: Path = Path("data/processed")
CHROMA_DB_PATH: str = "./chroma_db"

# ChromaDB
CHROMA_COLLECTION: str = "medical_cases"

# LLM
GROQ_MODEL: str = "llama-3.3-70b-versatile"

# Embeddings
EMBED_MODEL: str = "BAAI/bge-small-en-v1.5"

# RAG query settings
SIMILARITY_TOP_K: int = 5
RESPONSE_MODE: str = "compact"

# Section detection — canonical section names and their keyword triggers
SECTION_KEYWORDS: dict[str, list[str]] = {
    "history": [
        "history", "chief complaint", "presenting complaint", "presenting",
        "hpi", "history of present", "past medical", "social history",
        "case presentation", "case report", "clinical history",
        "background", "introduction", "patient", "admitted",
        "clinical presentation", "presenting illness",
    ],
    "exam": [
        "examination", "physical exam", "physical examination", "vital signs",
        "on examination", "findings", "auscultation", "palpation",
        "clinical findings", "clinical examination", "general examination",
        "systemic examination", "inspection",
    ],
    "labs": [
        "laboratory", "investigations", "blood test", "imaging",
        "ecg", "ekg", "results", "culture", "biopsy", "pathology",
        "radiology", "ct scan", "mri", "ultrasound", "lab results",
        "diagnostic workup", "workup", "test results", "x-ray",
        "haematology", "hematology", "biochemistry", "serology",
    ],
    "diagnosis": [
        "diagnosis", "impression", "assessment", "differential",
        "conclusion", "final diagnosis", "working diagnosis",
        "diagnostic", "confirmed diagnosis", "clinical diagnosis",
        "discharge diagnosis", "primary diagnosis", "definitive",
    ],
    "discussion": [
        "discussion", "comment", "learning point", "teaching",
        "management", "treatment", "outcome", "follow-up",
        "follow up", "prognosis", "intervention", "therapy",
        "surgical", "procedure", "operated", "discharged",
    ],
}

# BioC section_type → our canonical type (checked before keyword scan)
BIOC_SECTION_MAP: dict[str, str] = {
    "CASE": "history",
    "INTRO": "history",
    "ABSTRACT": "history",
    "DISCUSS": "discussion",
    "CONCL": "discussion",
    "METHODS": "labs",
    "RESULTS": "labs",
    "TITLE": None,
    "REF": None,
    "AUTH_CONT": None,
    "COMP_INT": None,
    "ACK_FUND": None,
    "APPENDIX": None,
    "SUPPL": None,
}

# Minimum required sections for a case to be indexed
# Only one recognisable section needed — PubMed abstracts often lack explicit headers
REQUIRED_SECTIONS: set[str] = {"history"}

# Specialty map: fetch term → (parent specialty, subspecialty)
# Keys are the exact strings passed to --specialty or used as fetch terms.
SPECIALTY_MAP: dict[str, tuple[str, str]] = {
    # Cardiology
    "cardiology": ("cardiology", "cardiology"),
    "chest pain": ("cardiology", "chest pain"),
    "myocardial infarction": ("cardiology", "myocardial infarction"),
    "acute coronary syndrome": ("cardiology", "acute coronary syndrome"),
    # Respiratory
    "respiratory": ("respiratory", "respiratory"),
    "pneumonia": ("respiratory", "pneumonia"),
    "pulmonary embolism": ("respiratory", "pulmonary embolism"),
    "copd": ("respiratory", "COPD"),
    "chronic obstructive pulmonary disease": ("respiratory", "chronic obstructive pulmonary disease"),
    # Neurology
    "neurology": ("neurology", "neurology"),
    "stroke": ("neurology", "stroke"),
    "seizure": ("neurology", "seizure"),
    "meningitis": ("neurology", "meningitis"),
    # Endocrinology
    "endocrinology": ("endocrinology", "endocrinology"),
    "diabetic ketoacidosis": ("endocrinology", "diabetic ketoacidosis"),
    "thyroid storm": ("endocrinology", "thyroid storm"),
    # Gastroenterology
    "gastroenterology": ("gastroenterology", "gastroenterology"),
    "pancreatitis": ("gastroenterology", "pancreatitis"),
    "gastrointestinal hemorrhage": ("gastroenterology", "gastrointestinal hemorrhage"),
    "liver failure": ("gastroenterology", "liver failure"),
}


def resolve_specialty(fetch_term: str) -> tuple[str, str]:
    """
    Resolve a fetch term to (parent_specialty, subspecialty).
    Lookup is case-insensitive. Falls back to ("general", fetch_term) if not found.
    """
    key = fetch_term.strip().lower()
    if key in SPECIALTY_MAP:
        return SPECIALTY_MAP[key]
    return ("general", fetch_term)


# Rate limiting (seconds between NCBI requests)
NCBI_RATE_DELAY: float = 0.11 if (NCBI_API_KEY and NCBI_API_KEY != "placeholder_replace_me") else 0.34

# Groq retry settings
GROQ_MAX_RETRIES: int = 4
GROQ_RETRY_WAIT_MIN: float = 1.0
GROQ_RETRY_WAIT_MAX: float = 30.0
