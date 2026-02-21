import json
from pathlib import Path


def calculate_score(
    correct_ranking: list[str],
    student_ranking: list[str],
    sections_viewed: list[str],
    time_taken_seconds: int | float,
) -> dict:
    """
    Score a student's case attempt. Returns a dict with component scores and grade.
    All inputs are validated for edge cases (empty lists, short rankings, etc).
    """

    # --- Component 1: Diagnosis Accuracy (40 pts) ---
    student_top = student_ranking[0] if student_ranking else ""
    correct_top = correct_ranking[0] if correct_ranking else ""

    if student_top == correct_top:
        accuracy_score = 40
    elif correct_top in student_ranking[:3]:
        accuracy_score = 15
    else:
        accuracy_score = 0

    # --- Component 2: Ranking Quality (30 pts) ---
    # 6 pts for exact position, 3 pts for off-by-one, 0 pts for off-by-2+
    pts_per_item = 6
    n = min(len(correct_ranking), len(student_ranking), 5)
    ranking_score = 0

    for i in range(n):
        correct_dx = correct_ranking[i]
        # Find where the student placed this diagnosis
        try:
            student_pos = student_ranking.index(correct_dx)
        except ValueError:
            # Diagnosis not in student ranking at all
            continue
        offset = abs(i - student_pos)
        if offset == 0:
            ranking_score += pts_per_item
        elif offset == 1:
            ranking_score += 3

    ranking_score = min(ranking_score, 30)

    # --- Component 3: Information Efficiency (20 pts) ---
    n_viewed = len(sections_viewed)
    if n_viewed == 0:
        efficiency_score = 5     # guessed without any sections
    elif n_viewed == 1:
        efficiency_score = 20
    elif n_viewed == 2:
        efficiency_score = 15
    else:
        efficiency_score = 10   # viewed all 3

    # --- Component 4: Speed Bonus (10 pts) ---
    t = float(time_taken_seconds)
    if t < 180:
        speed_score = 10
    elif t < 300:
        speed_score = 7
    elif t < 480:
        speed_score = 4
    else:
        speed_score = 0

    total = accuracy_score + ranking_score + efficiency_score + speed_score

    # --- Grade ---
    if total >= 90:
        grade = "A"
    elif total >= 75:
        grade = "B"
    elif total >= 60:
        grade = "C"
    else:
        grade = "D"

    return {
        "accuracy_score": accuracy_score,
        "ranking_score": ranking_score,
        "efficiency_score": efficiency_score,
        "speed_score": speed_score,
        "total": total,
        "grade": grade,
    }


def generate_scorecard(
    score_dict: dict,
    case_id: str,
    specialty: str,
    correct_ranking: list[str],
) -> None:
    """Print a formatted scorecard to stdout."""

    W = 42  # inner width of the box

    def row(text: str) -> str:
        return f"| {text:<{W - 2}} |"

    def divider() -> str:
        return "+" + "-" * W + "+"

    accuracy   = score_dict["accuracy_score"]
    ranking    = score_dict["ranking_score"]
    efficiency = score_dict["efficiency_score"]
    speed      = score_dict["speed_score"]
    total      = score_dict["total"]
    grade      = score_dict["grade"]

    correct_top = correct_ranking[0] if correct_ranking else "unknown"

    print()
    print("+" + "=" * W + "+")
    print(row("CASUIST SCORECARD"))
    print(divider())
    print(row(f"Case:      {case_id}"))
    print(row(f"Specialty: {specialty.title()}"))
    print(divider())
    print(row(f"Diagnosis Accuracy      {accuracy:>3}/40"))
    print(row(f"Ranking Quality         {ranking:>3}/30"))
    print(row(f"Information Efficiency  {efficiency:>3}/20"))
    print(row(f"Speed Bonus             {speed:>3}/10"))
    print(divider())
    print(row(f"TOTAL                   {total:>3}/100"))
    print(row(f"Grade: {grade}"))
    print("+" + "=" * W + "+")

    # Improvement tips
    tips: list[str] = []

    if accuracy < 40:
        tips.append(f"Review: '{correct_top}' was the primary diagnosis.")
    if ranking < 20:
        tips.append("Work on ranking differentials by clinical likelihood.")
    if efficiency < 15:
        tips.append(
            "Try to diagnose with fewer sections. "
            "Good clinicians order targeted investigations."
        )
    if speed < 7:
        tips.append("Try to move faster through cases.")
    if total >= 90:
        tips.append("Excellent clinical reasoning!")

    if tips:
        print()
        for tip in tips:
            print(f"  * {tip}")


def save_result(
    results_json_path: Path,
    session_data: dict,
    score_dict: dict,
) -> None:
    """
    Load results.json, find the matching session by timestamp + case_id,
    merge in the score fields, and write back.
    If the entry isn't found (e.g. first run), append it fresh.
    """
    results_json_path.parent.mkdir(parents=True, exist_ok=True)

    existing: list[dict] = []
    if results_json_path.exists():
        try:
            with open(results_json_path, encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    score_fields = {
        "accuracy_score": score_dict["accuracy_score"],
        "ranking_score": score_dict["ranking_score"],
        "efficiency_score": score_dict["efficiency_score"],
        "speed_score": score_dict["speed_score"],
        "total": score_dict["total"],
        "grade": score_dict["grade"],
    }

    # Try to update the most-recent matching entry (same case_id and timestamp)
    matched = False
    for entry in reversed(existing):
        if (
            entry.get("case_id") == session_data.get("case_id")
            and entry.get("timestamp") == session_data.get("timestamp")
        ):
            entry.update(score_fields)
            matched = True
            break

    if not matched:
        # No match — merge score into session_data and append
        merged = {**session_data, **score_fields}
        existing.append(merged)

    with open(results_json_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)
