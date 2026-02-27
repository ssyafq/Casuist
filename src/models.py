from dataclasses import dataclass, field


@dataclass
class RawCase:
    pmid: str
    pmc_id: str | None
    title: str
    authors: list[str]
    abstract: str
    bioc_json: dict
    specialty: str
    fetch_timestamp: str
    subspecialty: str = ""


@dataclass
class CaseSection:
    pmid: str
    pmc_id: str | None
    title: str
    authors: list[str]
    specialty: str
    section_type: str  # "history" | "exam" | "labs" | "diagnosis" | "discussion"
    text: str
    chunk_index: int
    char_count: int
    subspecialty: str = ""


@dataclass
class ProcessedCase:
    pmid: str
    pmc_id: str | None
    title: str
    authors: list[str]
    specialty: str
    sections: list[CaseSection] = field(default_factory=list)
    skipped_reason: str | None = None
    subspecialty: str = ""
