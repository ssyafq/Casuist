import json
import time
import argparse
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

import requests
from Bio import Entrez, Medline

from src.config import (
    DATA_RAW_DIR,
    NCBI_API_KEY,
    NCBI_RATE_DELAY,
)
from src.models import RawCase


def search_pubmed(specialty: str, max_results: int, min_year: int = 2015) -> list[str]:
    """Search PubMed for case reports in the given specialty. Returns list of PMIDs."""
    query = f"{specialty}[MeSH Terms] AND case reports[pt] AND {min_year}:{datetime.now().year}[dp]"
    handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
    record = Entrez.read(handle)
    handle.close()
    time.sleep(NCBI_RATE_DELAY)
    return list(record.get("IdList", []))


def fetch_abstract(pmid: str) -> dict | None:
    """Fetch title, authors, abstract for one PMID. Returns None on error."""
    try:
        handle = Entrez.efetch(db="pubmed", id=pmid, rettype="medline", retmode="text")
        records = list(Medline.parse(handle))
        handle.close()
        time.sleep(NCBI_RATE_DELAY)
        if not records:
            return None
        rec = records[0]
        return {
            "title": rec.get("TI", ""),
            "authors": list(rec.get("AU", [])),
            "abstract": rec.get("AB", ""),
        }
    except Exception as e:
        print(f"  [ERROR] fetch_abstract({pmid}): {e}")
        return None


def pmid_to_pmc_id(pmid: str) -> str | None:
    """Convert PMID to PMC ID via Entrez elink. Returns None if no link found (~30-40% miss rate)."""
    try:
        handle = Entrez.elink(dbfrom="pubmed", db="pmc", id=pmid)
        record = Entrez.read(handle)
        handle.close()
        time.sleep(NCBI_RATE_DELAY)
        link_sets = record[0].get("LinkSetDb", [])
        if not link_sets:
            return None
        links = link_sets[0].get("Link", [])
        if not links:
            return None
        return f"PMC{links[0]['Id']}"
    except Exception as e:
        print(f"  [WARN] pmid_to_pmc_id({pmid}): {e}")
        return None


def fetch_bioc_fulltext(pmc_id: str) -> dict | None:
    """Fetch BioC JSON full text for a PMC article. Returns None on error."""
    numeric_id = pmc_id.replace("PMC", "")
    url = (
        "https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi"
        f"?BioC_format=JSON&id={numeric_id}"
    )
    try:
        response = requests.get(url, timeout=30)
        time.sleep(NCBI_RATE_DELAY)
        if response.status_code != 200:
            return None
        return response.json()
    except Exception as e:
        print(f"  [WARN] fetch_bioc_fulltext({pmc_id}): {e}")
        return None


def fetch_and_save_case(pmid: str, specialty: str, output_dir: Path) -> bool:
    """
    Orchestrate fetch for one PMID: abstract → PMC ID → BioC full text.
    Saves RawCase as JSON. Returns True if saved, False if skipped.
    """
    output_path = output_dir / f"{pmid}.json"
    if output_path.exists():
        print(f"  [SKIP] {pmid} already fetched")
        return True

    meta = fetch_abstract(pmid)
    if not meta or not meta["title"]:
        print(f"  [SKIP] {pmid} — no abstract/title")
        return False

    pmc_id = pmid_to_pmc_id(pmid)
    bioc_json: dict = {}

    if pmc_id:
        bioc_data = fetch_bioc_fulltext(pmc_id)
        if bioc_data:
            bioc_json = bioc_data
            print(f"  [SAVED] {pmid} — full text via {pmc_id}")
        else:
            print(f"  [SAVED] {pmid} — abstract only (BioC fetch failed for {pmc_id})")
    else:
        print(f"  [SAVED] {pmid} — abstract only (no PMC ID)")

    raw_case = RawCase(
        pmid=pmid,
        pmc_id=pmc_id,
        title=meta["title"],
        authors=meta["authors"],
        abstract=meta["abstract"],
        bioc_json=bioc_json,
        specialty=specialty,
        fetch_timestamp=datetime.now(timezone.utc).isoformat(),
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(asdict(raw_case), f, indent=2)

    return True


def run_fetch_pipeline(specialty: str, max_results: int, output_dir: Path) -> None:
    """CLI entry point: search PubMed and fetch cases for a specialty."""
    print(f"Searching PubMed for {max_results} '{specialty}' case reports...")
    pmids = search_pubmed(specialty, max_results)
    print(f"Found {len(pmids)} PMIDs. Fetching...")

    saved = 0
    skipped = 0

    for i, pmid in enumerate(pmids, 1):
        print(f"Fetching {i}/{len(pmids)}: PMID {pmid}...")
        result = fetch_and_save_case(pmid, specialty, output_dir)
        if result:
            saved += 1
        else:
            skipped += 1

    print(f"\nDone. Saved: {saved}, Skipped: {skipped}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch PubMed case reports")
    parser.add_argument("--specialty", required=True, help="Medical specialty (e.g. cardiology)")
    parser.add_argument("--max", type=int, default=50, help="Max results to fetch")
    args = parser.parse_args()
    run_fetch_pipeline(args.specialty, args.max, DATA_RAW_DIR)
