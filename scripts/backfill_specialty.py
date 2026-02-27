"""
One-time backfill script.
For every JSON in data/raw/ missing a subspecialty field,
looks up the specialty value in SPECIALTY_MAP and stamps subspecialty in-place.
"""
import json
import sys
from pathlib import Path

# Allow importing from src/ without installing the package
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import SPECIALTY_MAP


def resolve_subspecialty(specialty: str) -> str:
    """Return the subspecialty for a known specialty, or the specialty itself as fallback."""
    key = specialty.strip().lower()
    if key in SPECIALTY_MAP:
        return SPECIALTY_MAP[key][1]
    return specialty


def backfill(raw_dir: Path) -> None:
    files = list(raw_dir.glob("*.json"))
    if not files:
        print(f"No JSON files found in {raw_dir}")
        return

    updated = 0
    already_set = 0

    for path in files:
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)

            if data.get("subspecialty"):
                already_set += 1
                continue

            subspecialty = resolve_subspecialty(data.get("specialty", ""))
            data["subspecialty"] = subspecialty

            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

            print(f"  [UPDATED] {path.name}: specialty={data['specialty']!r} → subspecialty={subspecialty!r}")
            updated += 1

        except Exception as e:
            print(f"  [ERROR] {path.name}: {e}")

    print(f"\nDone. Updated: {updated}, Already set: {already_set}")


if __name__ == "__main__":
    raw_dir = Path(__file__).resolve().parents[1] / "data" / "raw"
    backfill(raw_dir)
