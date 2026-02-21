import json
import random
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from llama_index.core import Settings

from src.chunker import get_chroma_collection
from src.rag import build_embed_model, build_index, build_llm, build_query_engine, query
from src.scoring import calculate_score, generate_scorecard, save_result

CASES_DIR = Path("data/cases")
RESULTS_FILE = Path("data/results.json")

SECTION_LABELS = {
    "history": "History",
    "exam": "Examine Patient",
    "labs": "Order Labs",
}

MENU_TO_SECTION = {
    "1": "history",
    "2": "exam",
    "3": "labs",
}

SEPARATOR = "=" * 60
THIN_SEP = "-" * 60


@dataclass
class CaseFile:
    case_id: str
    specialty: str
    chief_complaint: str
    history: str
    exam: str
    labs: str
    correct_diagnosis: str
    differentials: list[str]


@dataclass
class SessionState:
    case: CaseFile
    sections_viewed: list[str] = field(default_factory=list)
    shuffled_options: list[str] = field(default_factory=list)
    correct_index: int = 0          # index of correct diagnosis in shuffled_options
    student_ranking: list[str] = field(default_factory=list)
    start_time: float = field(default_factory=time.time)


def load_cases() -> list[CaseFile]:
    """Load all case JSON files from CASES_DIR."""
    cases = []
    for path in CASES_DIR.glob("*.json"):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            cases.append(CaseFile(**data))
        except Exception as e:
            print(f"  [WARN] Could not load {path.name}: {e}")
    return cases


def pick_random_case(cases: list[CaseFile]) -> CaseFile:
    return random.choice(cases)


def print_header() -> None:
    print(f"\n{SEPARATOR}")
    print("  CASUIST — Case Based Learning")
    print(f"{SEPARATOR}\n")


def show_chief_complaint(case: CaseFile) -> None:
    print(f"CHIEF COMPLAINT\n{THIN_SEP}")
    print(case.chief_complaint)
    print()


def show_section(case: CaseFile, section_key: str) -> None:
    """Display the content of a section, with a fallback message if empty."""
    label = SECTION_LABELS[section_key]
    content = getattr(case, section_key, "").strip()
    print(f"\n{label.upper()}\n{THIN_SEP}")
    if content:
        print(content)
    else:
        print(f"No {label.lower()} data available for this case.")
    print()


def information_gathering_loop(state: SessionState) -> None:
    """Step 2: Let the student request sections until ready to diagnose."""
    while True:
        print(f"INFORMATION GATHERING\n{THIN_SEP}")
        print("[1] Take History")
        print("[2] Examine Patient")
        print("[3] Order Labs")
        print("[4] I'm ready to diagnose")
        print()

        choice = input("Your choice: ").strip()

        if choice == "4":
            break
        elif choice in MENU_TO_SECTION:
            section_key = MENU_TO_SECTION[choice]
            if section_key in state.sections_viewed:
                print(f"\nAlready reviewed — choose another.\n")
            else:
                show_section(state.case, section_key)
                state.sections_viewed.append(section_key)
        else:
            print("\nInvalid choice. Please enter 1, 2, 3, or 4.\n")


def mcq_diagnosis(state: SessionState) -> None:
    """Step 3: Shuffle differentials, show MCQ, capture and validate student ranking."""
    options = state.case.differentials[:]
    random.shuffle(options)
    state.shuffled_options = options
    state.correct_index = options.index(state.case.correct_diagnosis)

    labels = "ABCDE"
    print(f"\nDIFFERENTIAL DIAGNOSIS\n{THIN_SEP}")
    print("Rank the following diagnoses from most to least likely.\n")
    for i, opt in enumerate(options):
        print(f"  {labels[i]}. {opt}")

    print()
    while True:
        raw = input("Your ranking (e.g. A,C,B,E,D): ").strip().upper().replace(" ", "")
        parts = [p.strip() for p in raw.split(",")]

        valid_labels = set(labels[:len(options)])
        if (
            len(parts) == len(options)
            and set(parts) == valid_labels
            and all(p in valid_labels for p in parts)
        ):
            state.student_ranking = [options[labels.index(p)] for p in parts]
            break
        else:
            print(
                f"Invalid format. Enter all {len(options)} letters separated by commas "
                f"(e.g. A,C,B,E,D). No duplicates.\n"
            )


def build_rag_query(state: SessionState) -> str:
    """Construct the prompt to send to the RAG engine."""
    student_top = state.student_ranking[0] if state.student_ranking else "unknown"
    correct = state.case.correct_diagnosis

    sections_text = ""
    if "history" in state.sections_viewed:
        sections_text += f"History: {state.case.history}\n"
    if "exam" in state.sections_viewed:
        sections_text += f"Examination: {state.case.exam}\n"
    if "labs" in state.sections_viewed:
        sections_text += f"Investigations: {state.case.labs}\n"

    if not sections_text:
        sections_text = f"Chief complaint: {state.case.chief_complaint}"

    return (
        f"A medical student reviewed the following case:\n\n"
        f"{sections_text}\n"
        f"The student ranked '{student_top}' as their most likely diagnosis. "
        f"The correct diagnosis is '{correct}'.\n\n"
        f"Please explain why '{correct}' is the correct diagnosis for this case, "
        f"what key clinical and investigation findings support it, "
        f"and what distinguishes it from the other differentials. "
        f"Cite relevant published case reports where possible."
    )


def get_rag_feedback(state: SessionState) -> str:
    """Step 4: Initialise RAG and return cited feedback."""
    print(f"\nGenerating feedback from medical literature...")
    try:
        collection = get_chroma_collection()
        if collection.count() == 0:
            return (
                "RAG feedback unavailable — ChromaDB collection is empty. "
                "Run the fetcher and chunker first to populate the knowledge base.\n\n"
                "Educational purposes only — not a substitute for clinical training."
            )

        embed_model = build_embed_model()
        llm = build_llm()
        Settings.embed_model = embed_model
        Settings.llm = llm

        index = build_index(collection, embed_model)
        query_engine = build_query_engine(index, llm, specialty=state.case.specialty)

        rag_query = build_rag_query(state)
        return query(rag_query, query_engine)

    except Exception as e:
        return (
            f"RAG feedback unavailable: {e}\n\n"
            "Educational purposes only — not a substitute for clinical training."
        )


def show_feedback(feedback: str) -> None:
    print(f"\nRAG FEEDBACK\n{THIN_SEP}")
    print(feedback)


def show_session_summary(state: SessionState, score_dict: dict) -> None:
    """Step 5: Print session summary and scorecard."""
    elapsed = time.time() - state.start_time
    all_sections = list(MENU_TO_SECTION.values())

    correct_ranking = [state.case.correct_diagnosis] + [
        d for d in state.case.differentials if d != state.case.correct_diagnosis
    ]

    print(f"\n{SEPARATOR}")
    print("  SESSION SUMMARY")
    print(f"{SEPARATOR}\n")

    print("Sections reviewed:")
    for s in all_sections:
        status = "✓ Viewed" if s in state.sections_viewed else "✗ Skipped"
        print(f"  {SECTION_LABELS[s]}: {status}")

    print(f"\nYour ranking:")
    for i, diagnosis in enumerate(state.student_ranking, 1):
        marker = " ← correct" if diagnosis == state.case.correct_diagnosis else ""
        print(f"  {i}. {diagnosis}{marker}")

    print(f"\nCorrect answer: {state.case.correct_diagnosis}")
    student_top_correct = (
        state.student_ranking[0] == state.case.correct_diagnosis
        if state.student_ranking else False
    )
    print(f"Top pick correct: {'Yes' if student_top_correct else 'No'}")
    print(f"Time taken:       {elapsed:.0f} seconds")

    generate_scorecard(
        score_dict,
        state.case.case_id,
        state.case.specialty,
        correct_ranking,
    )

    print(f"\n{THIN_SEP}")
    print("Educational purposes only — not a substitute for clinical training.")
    print(THIN_SEP)


def save_results(state: SessionState, score_dict: dict) -> None:
    """Append session data (including score) to data/results.json."""
    elapsed = time.time() - state.start_time

    session_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "case_id": state.case.case_id,
        "specialty": state.case.specialty,
        "sections_viewed": state.sections_viewed,
        "student_ranking": state.student_ranking,
        "correct_ranking": [state.case.correct_diagnosis] + [
            d for d in state.case.differentials if d != state.case.correct_diagnosis
        ],
        "time_taken_seconds": round(elapsed),
    }

    save_result(RESULTS_FILE, session_data, score_dict)
    print(f"\nSession saved to {RESULTS_FILE}")


def run_case_engine() -> None:
    """Main entry point for the interactive case engine."""
    print_header()

    cases = load_cases()
    if not cases:
        print(f"No case files found in {CASES_DIR}/")
        print("Add case JSON files to that directory and try again.")
        return

    case = pick_random_case(cases)
    state = SessionState(case=case)

    # Step 1 — Introduction
    print(f"Specialty: {case.specialty.title()}")
    print()
    show_chief_complaint(case)

    input("Press Enter to begin information gathering...")
    print()

    # Step 2 — Information gathering
    information_gathering_loop(state)

    # Step 3 — MCQ diagnosis
    mcq_diagnosis(state)

    # Step 4 — RAG feedback
    feedback = get_rag_feedback(state)
    show_feedback(feedback)

    # Step 5 — Score, summary, save
    elapsed = time.time() - state.start_time
    correct_ranking = [state.case.correct_diagnosis] + [
        d for d in state.case.differentials if d != state.case.correct_diagnosis
    ]
    score_dict = calculate_score(
        correct_ranking=correct_ranking,
        student_ranking=state.student_ranking,
        sections_viewed=state.sections_viewed,
        time_taken_seconds=elapsed,
    )
    show_session_summary(state, score_dict)
    save_results(state, score_dict)


if __name__ == "__main__":
    run_case_engine()
