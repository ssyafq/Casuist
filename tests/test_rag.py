import pytest
from unittest.mock import MagicMock, patch

import groq as groq_module

from src.rag import (
    extract_citations,
    format_response_with_citations,
)


def _make_node(pmid: str, title: str = "Test Paper", specialty: str = "cardiology") -> MagicMock:
    node = MagicMock()
    node.node.metadata = {
        "pmid": pmid,
        "title": title,
        "authors": "Smith J; Jones A",
        "pmc_id": f"PMC{pmid}",
        "section_type": "history",
        "specialty": specialty,
    }
    return node


class TestExtractCitations:
    def test_extracts_unique_pmids(self):
        response = MagicMock()
        response.source_nodes = [
            _make_node("11111111"),
            _make_node("22222222"),
            _make_node("11111111"),  # duplicate
        ]
        citations = extract_citations(response)
        pmids = [c["pmid"] for c in citations]
        assert pmids == ["11111111", "22222222"]
        assert len(citations) == 2

    def test_empty_source_nodes(self):
        response = MagicMock()
        response.source_nodes = []
        citations = extract_citations(response)
        assert citations == []

    def test_no_source_nodes_attr(self):
        response = MagicMock(spec=[])
        citations = extract_citations(response)
        assert citations == []

    def test_citation_fields_populated(self):
        response = MagicMock()
        response.source_nodes = [_make_node("12345678", title="DRESS Syndrome Case")]
        citations = extract_citations(response)
        assert citations[0]["pmid"] == "12345678"
        assert citations[0]["title"] == "DRESS Syndrome Case"
        assert citations[0]["specialty"] == "cardiology"


class TestFormatResponseWithCitations:
    def test_always_includes_disclaimer(self):
        result = format_response_with_citations("Some answer.", [])
        assert "Educational purposes only" in result

    def test_includes_sources_section_when_citations_present(self):
        citations = [{
            "pmid": "12345678",
            "title": "A case of DRESS",
            "authors": "Smith J",
            "pmc_id": "PMC12345678",
            "section_type": "history",
            "specialty": "dermatology",
        }]
        result = format_response_with_citations("The patient had rash.", citations)
        assert "Sources:" in result
        assert "[PMID: 12345678]" in result
        assert "Smith J" in result

    def test_no_sources_section_when_no_citations(self):
        result = format_response_with_citations("Some answer.", [])
        assert "Sources:" not in result

    def test_answer_text_preserved(self):
        answer = "The diagnosis was confirmed by biopsy."
        result = format_response_with_citations(answer, [])
        assert answer in result

    def test_multiple_citations_all_listed(self):
        citations = [
            {"pmid": "11111111", "title": "Paper A", "authors": "Author A",
             "pmc_id": "", "section_type": "history", "specialty": "cardiology"},
            {"pmid": "22222222", "title": "Paper B", "authors": "Author B",
             "pmc_id": "", "section_type": "diagnosis", "specialty": "cardiology"},
        ]
        result = format_response_with_citations("Answer.", citations)
        assert "[PMID: 11111111]" in result
        assert "[PMID: 22222222]" in result
