import re
import json
import argparse
from dataclasses import asdict
from pathlib import Path

from src.config import (
    DATA_RAW_DIR,
    DATA_PROCESSED_DIR,
    SECTION_KEYWORDS,
    BIOC_SECTION_MAP,
    REQUIRED_SECTIONS,
)
from src.models import RawCase, CaseSection, ProcessedCase


def classify_section(infons: dict, text: str) -> str | None:
    """
    Map a BioC passage to one of our canonical section types.
    Priority: BioC section_type map → keyword scan on infons values → keyword scan on text.
    Returns None if unclassifiable (passage will be dropped).
    """
    bioc_type = infons.get("section_type", "").upper()
    if bioc_type in BIOC_SECTION_MAP:
        return BIOC_SECTION_MAP[bioc_type]

    # Scan all infon values for keyword matches
    infon_text = " ".join(str(v) for v in infons.values()).lower()
    for section, keywords in SECTION_KEYWORDS.items():
        if any(kw in infon_text for kw in keywords):
            return section

    # Fall back to scanning the first 200 chars of the text itself
    snippet = text[:200].lower()
    for section, keywords in SECTION_KEYWORDS.items():
        if any(kw in snippet for kw in keywords):
            return section

    return None


def get_overlap_prefix(text: str, n_tokens: int = 50) -> str:
    """Return the last n_tokens words from text to use as a context overlap prefix."""
    words = text.split()
    if len(words) <= n_tokens:
        return text
    return " ".join(words[-n_tokens:])


def extract_sections_from_bioc(
    bioc_json: dict,
    pmid: str,
    pmc_id: str | None,
    title: str,
    authors: list[str],
    specialty: str,
) -> list[CaseSection]:
    """Parse BioC JSON into CaseSection list with 50-token section overlap."""
    try:
        documents = bioc_json.get("documents", [])
        if not documents:
            return []
        passages = documents[0].get("passages", [])
    except (KeyError, IndexError, TypeError):
        return []

    # Group consecutive passages by section type
    grouped: list[tuple[str, str]] = []  # (section_type, text)
    for passage in passages:
        try:
            infons = passage.get("infons", {})
            text = passage.get("text", "").strip()
            if not text:
                continue
            section_type = classify_section(infons, text)
            if section_type is None:
                continue
            # Merge with previous group if same section type
            if grouped and grouped[-1][0] == section_type:
                grouped[-1] = (section_type, grouped[-1][1] + "\n\n" + text)
            else:
                grouped.append((section_type, text))
        except Exception:
            continue

    sections: list[CaseSection] = []
    prev_text = ""

    for i, (section_type, text) in enumerate(grouped):
        # Prepend 50-token overlap from previous section
        if prev_text:
            overlap = get_overlap_prefix(prev_text)
            full_text = overlap + "\n\n" + text
        else:
            full_text = text

        sections.append(CaseSection(
            pmid=pmid,
            pmc_id=pmc_id,
            title=title,
            authors=authors,
            specialty=specialty,
            section_type=section_type,
            text=full_text,
            chunk_index=i,
            char_count=len(full_text),
        ))
        prev_text = text

    return sections


def extract_sections_from_abstract(
    abstract: str,
    pmid: str,
    pmc_id: str | None,
    title: str,
    authors: list[str],
    specialty: str,
) -> list[CaseSection]:
    """
    Fallback parser for abstract-only cases.
    Splits on structured abstract headers (e.g. 'CASE PRESENTATION:', 'CONCLUSION:').
    Falls back to a single 'history' section if no structure found.
    """
    if not abstract:
        return []

    # Try to split on common structured abstract headers
    header_pattern = re.compile(
        r"\b(BACKGROUND|INTRODUCTION|CASE PRESENTATION|CASE REPORT|CLINICAL HISTORY|"
        r"CLINICAL PRESENTATION|PRESENTING COMPLAINT|CHIEF COMPLAINT|HISTORY|"
        r"METHODS|RESULTS|INVESTIGATIONS|EXAMINATION|CLINICAL FINDINGS|"
        r"DIAGNOSIS|FINAL DIAGNOSIS|IMPRESSION|ASSESSMENT|"
        r"DISCUSSION|CONCLUSION|CONCLUSIONS|LEARNING POINTS?|OBJECTIVE|PURPOSE|"
        r"MANAGEMENT|TREATMENT|OUTCOME|FOLLOW[- ]UP)\s*:",
        re.IGNORECASE,
    )

    parts = header_pattern.split(abstract)

    # If split produced multiple parts, pair header with content
    if len(parts) > 1:
        sections: list[CaseSection] = []
        # parts[0] is pre-header text (often empty), then alternating: header, content
        chunk_index = 0
        prev_text = ""

        for i in range(1, len(parts) - 1, 2):
            header = parts[i].strip().lower()
            content = parts[i + 1].strip() if i + 1 < len(parts) else ""
            if not content:
                continue

            # Map header to section type
            section_type = "history"
            for stype, keywords in SECTION_KEYWORDS.items():
                if any(kw in header for kw in keywords):
                    section_type = stype
                    break

            overlap = get_overlap_prefix(prev_text) if prev_text else ""
            full_text = (overlap + "\n\n" + content) if overlap else content

            sections.append(CaseSection(
                pmid=pmid,
                pmc_id=pmc_id,
                title=title,
                authors=authors,
                specialty=specialty,
                section_type=section_type,
                text=full_text,
                chunk_index=chunk_index,
                char_count=len(full_text),
            ))
            prev_text = content
            chunk_index += 1

        if sections:
            return sections

    # Final fallback: whole abstract as a single 'history' section
    return [CaseSection(
        pmid=pmid,
        pmc_id=pmc_id,
        title=title,
        authors=authors,
        specialty=specialty,
        section_type="history",
        text=abstract,
        chunk_index=0,
        char_count=len(abstract),
    )]


def is_case_viable(sections: list[CaseSection]) -> tuple[bool, str]:
    """
    Check if a case has enough content to be useful.
    Accepts if: at least one required section found, OR at least 2 any sections with real content.
    """
    if not sections:
        return False, "no sections extracted"
    found_types = {s.section_type for s in sections}
    # Accept if any required section is present
    if found_types & REQUIRED_SECTIONS:
        return True, ""
    # Fallback: accept if we have at least 2 sections with substantial text (>100 chars each)
    substantial = [s for s in sections if s.char_count > 100]
    if len(substantial) >= 2:
        return True, ""
    return False, f"no recognisable sections (found: {', '.join(sorted(found_types)) or 'none'})"


def process_raw_case(raw_case: RawCase) -> ProcessedCase:
    """Convert one RawCase to ProcessedCase with section extraction and viability gating."""
    if raw_case.bioc_json:
        sections = extract_sections_from_bioc(
            raw_case.bioc_json,
            raw_case.pmid,
            raw_case.pmc_id,
            raw_case.title,
            raw_case.authors,
            raw_case.specialty,
        )
    else:
        sections = extract_sections_from_abstract(
            raw_case.abstract,
            raw_case.pmid,
            raw_case.pmc_id,
            raw_case.title,
            raw_case.authors,
            raw_case.specialty,
        )

    viable, reason = is_case_viable(sections)

    return ProcessedCase(
        pmid=raw_case.pmid,
        pmc_id=raw_case.pmc_id,
        title=raw_case.title,
        authors=raw_case.authors,
        specialty=raw_case.specialty,
        sections=sections if viable else [],
        skipped_reason=None if viable else reason,
    )


def process_all(raw_dir: Path, output_dir: Path) -> tuple[int, int]:
    """Process all raw case JSONs in raw_dir and save viable ones to output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)
    processed = 0
    skipped = 0

    raw_files = list(raw_dir.glob("*.json"))
    if not raw_files:
        print(f"No JSON files found in {raw_dir}")
        return 0, 0

    for path in raw_files:
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            raw_case = RawCase(**data)
            result = process_raw_case(raw_case)

            if result.skipped_reason:
                print(f"  [SKIP] {result.pmid} — {result.skipped_reason}")
                skipped += 1
            else:
                out_path = output_dir / f"{result.pmid}_processed.json"
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(asdict(result), f, indent=2)
                print(f"  [OK]   {result.pmid} — {len(result.sections)} sections")
                processed += 1
        except Exception as e:
            print(f"  [ERROR] {path.name}: {e}")
            skipped += 1

    print(f"\nDone. Processed: {processed}, Skipped: {skipped}")
    return processed, skipped


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process raw BioC case JSONs into sections")
    parser.add_argument("--input", default=str(DATA_RAW_DIR), help="Raw JSON input directory")
    parser.add_argument("--output", default=str(DATA_PROCESSED_DIR), help="Processed JSON output directory")
    args = parser.parse_args()
    process_all(Path(args.input), Path(args.output))
