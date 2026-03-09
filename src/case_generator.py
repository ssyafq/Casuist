"""
Generate structured case JSON files from processed PubMed data using Groq.

Usage:
    python -m src.case_generator
    python -m src.case_generator --max 20
"""

import json
import random
import time
import argparse
from pathlib import Path
from groq import Groq, RateLimitError, APIConnectionError
from dotenv import load_dotenv

from src.config import GROQ_API_KEY

load_dotenv()

PROCESSED_DIR = Path("data/processed")
CASES_DIR = Path("data/cases")

PROMPT_TEMPLATE = """You are a medical education case writer. Given a processed clinical case report, generate a structured teaching case.

INPUT CASE DATA:
Title: {title}
Specialty: {specialty}
Sections:
{sections_text}

OUTPUT INSTRUCTIONS:
Return ONLY a valid JSON object with exactly these fields:

{{
  "case_id": "{pmid}",
  "specialty": "{specialty}",
  "chief_complaint": "<1-2 sentences: age, sex, presenting complaint>",
  "history": "<cleaned narrative history of present illness, past history, medications, social history>",
  "exam": "<vital signs and physical examination findings>",
  "labs": "<investigations: ECG, bloods, imaging, other tests and their results>",
  "correct_diagnosis": "<the single correct diagnosis as a concise string>",
  "differentials": ["<correct_diagnosis>", "<dx2>", "<dx3>", "<dx4>", "<dx5>"],
  "correct_ranking": ["<most likely>", "<2nd>", "<3rd>", "<4th>", "<least likely>"]
}}

Rules:
- differentials must be a shuffled list of 5 diagnoses; the correct_diagnosis must be one of them
- correct_ranking must contain the same 5 diagnoses ordered most-to-least likely
- Extract content faithfully from the source — do not invent clinical details
- Keep each section concise but clinically complete
- Return ONLY the JSON object, no markdown, no explanation"""


def _extract_sections_text(processed: dict) -> str:
    sections = processed.get("sections", [])
    parts = []
    for s in sections:
        stype = s.get("section_type", "unknown")
        text = s.get("text", "").strip()
        if text:
            parts.append(f"[{stype.upper()}]\n{text}")
    return "\n\n".join(parts) if parts else processed.get("title", "")


def _call_groq_with_retry(client: Groq, prompt: str, pmid: str) -> dict | None:
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1500,
            )
            raw = response.choices[0].message.content.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except (RateLimitError, APIConnectionError) as e:
            wait = 2 ** (attempt + 1)
            print(f"  [rate limit] {pmid} attempt {attempt + 1}/3 — waiting {wait}s: {e}")
            time.sleep(wait)
        except json.JSONDecodeError as e:
            print(f"  [json error] {pmid}: {e}")
            return None
        except Exception as e:
            print(f"  [error] {pmid}: {e}")
            return None
    print(f"  [failed] {pmid}: all 3 attempts exhausted")
    return None


def _validate_case(case: dict) -> bool:
    required = ["case_id", "specialty", "chief_complaint", "history", "exam",
                 "labs", "correct_diagnosis", "differentials", "correct_ranking"]
    for field in required:
        if field not in case:
            return False
    if len(case["differentials"]) != 5:
        return False
    if len(case["correct_ranking"]) != 5:
        return False
    if case["correct_diagnosis"] not in case["differentials"]:
        return False
    return True


def generate_cases(max_cases: int | None = None) -> None:
    CASES_DIR.mkdir(parents=True, exist_ok=True)

    processed_files = list(PROCESSED_DIR.glob("*.json"))
    if not processed_files:
        print("No processed files found in data/processed/")
        return

    existing_ids = {f.stem for f in CASES_DIR.glob("*.json")}
    to_process = [f for f in processed_files if f.stem.replace("_processed", "") not in existing_ids]

    if not to_process:
        print("All cases already generated. Nothing to do.")
        return

    if max_cases:
        to_process = to_process[:max_cases]

    print(f"Generating {len(to_process)} cases (skipping {len(existing_ids)} existing)...")

    client = Groq(api_key=GROQ_API_KEY)
    success = 0
    failures = 0

    for i, fpath in enumerate(to_process, 1):
        with open(fpath, encoding="utf-8") as f:
            processed = json.load(f)

        pmid = processed.get("pmid", fpath.stem.replace("_processed", ""))
        specialty = processed.get("specialty", "unknown")
        title = processed.get("title", "")
        sections_text = _extract_sections_text(processed)

        print(f"[{i}/{len(to_process)}] {pmid} — {title[:60]}...")

        prompt = PROMPT_TEMPLATE.format(
            pmid=pmid,
            specialty=specialty,
            title=title,
            sections_text=sections_text,
        )

        case = _call_groq_with_retry(client, prompt, pmid)

        if case is None:
            failures += 1
            continue

        if not _validate_case(case):
            print(f"  [invalid] {pmid}: failed validation — skipping")
            failures += 1
            continue

        out_path = CASES_DIR / f"{pmid}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(case, f, indent=2, ensure_ascii=False)

        print(f"  [ok] saved {out_path}")
        success += 1

        # Avoid rate limiting — 2s delay between calls
        if i < len(to_process):
            time.sleep(2)

    print(f"\nDone. {success} generated, {failures} failed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate case JSON files from processed data")
    parser.add_argument("--max", type=int, default=None, help="Max number of cases to generate")
    args = parser.parse_args()
    generate_cases(max_cases=args.max)
