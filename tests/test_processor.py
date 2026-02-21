import pytest

from src.models import RawCase, CaseSection
from src.processor import (
    classify_section,
    extract_sections_from_abstract,
    extract_sections_from_bioc,
    get_overlap_prefix,
    is_case_viable,
    process_raw_case,
)

SAMPLE_BIOC = {
    "documents": [{
        "id": "PMC1234567",
        "passages": [
            {
                "infons": {"section_type": "CASE", "type": "paragraph"},
                "text": "A 65-year-old man presented with chest pain and shortness of breath.",
                "offset": 0,
            },
            {
                "infons": {"section_type": "RESULTS", "type": "paragraph"},
                "text": "Troponin was elevated at 2.5 ng/mL. ECG showed ST-elevation.",
                "offset": 100,
            },
            {
                "infons": {"section_type": "DISCUSS", "type": "paragraph"},
                "text": "This case demonstrates classic STEMI presentation.",
                "offset": 200,
            },
            {
                "infons": {"section_type": "REF", "type": "ref"},
                "text": "Smith J. Some Journal. 2020.",
                "offset": 300,
            },
        ],
    }]
}

COMMON_ARGS = dict(
    pmid="12345678",
    pmc_id="PMC1234567",
    title="Test Case",
    authors=["Smith J"],
    specialty="cardiology",
)


class TestClassifySection:
    def test_maps_case_to_history(self):
        assert classify_section({"section_type": "CASE"}, "") == "history"

    def test_maps_discuss_to_discussion(self):
        assert classify_section({"section_type": "DISCUSS"}, "") == "discussion"

    def test_maps_concl_to_discussion(self):
        assert classify_section({"section_type": "CONCL"}, "") == "discussion"

    def test_maps_results_to_labs(self):
        assert classify_section({"section_type": "RESULTS"}, "") == "labs"

    def test_ref_returns_none(self):
        assert classify_section({"section_type": "REF"}, "") is None

    def test_falls_back_to_text_scan(self):
        result = classify_section({}, "The diagnosis was confirmed by biopsy.")
        assert result == "diagnosis"

    def test_unknown_returns_none(self):
        result = classify_section({}, "")
        assert result is None


class TestGetOverlapPrefix:
    def test_returns_last_n_words(self):
        text = " ".join([f"word{i}" for i in range(100)])
        result = get_overlap_prefix(text, n_tokens=50)
        words = result.split()
        assert len(words) == 50
        assert words[-1] == "word99"

    def test_returns_whole_text_if_short(self):
        text = "short text here"
        assert get_overlap_prefix(text, n_tokens=50) == text


class TestExtractSectionsFromBioc:
    def test_extracts_known_sections(self):
        sections = extract_sections_from_bioc(SAMPLE_BIOC, **COMMON_ARGS)
        types = [s.section_type for s in sections]
        assert "history" in types
        assert "labs" in types
        assert "discussion" in types

    def test_drops_ref_section(self):
        sections = extract_sections_from_bioc(SAMPLE_BIOC, **COMMON_ARGS)
        types = [s.section_type for s in sections]
        assert "ref" not in types

    def test_applies_overlap(self):
        sections = extract_sections_from_bioc(SAMPLE_BIOC, **COMMON_ARGS)
        # Second section should contain words from the first
        if len(sections) >= 2:
            first_words = set(sections[0].text.split()[-10:])
            second_text = sections[1].text
            assert any(w in second_text for w in first_words)

    def test_empty_bioc_returns_empty(self):
        assert extract_sections_from_bioc({}, **COMMON_ARGS) == []

    def test_handles_missing_documents_key(self):
        assert extract_sections_from_bioc({"foo": "bar"}, **COMMON_ARGS) == []

    def test_chunk_index_is_sequential(self):
        sections = extract_sections_from_bioc(SAMPLE_BIOC, **COMMON_ARGS)
        for i, s in enumerate(sections):
            assert s.chunk_index == i


class TestExtractSectionsFromAbstract:
    def test_single_section_fallback(self):
        abstract = "A patient came in with fever and was diagnosed with pneumonia."
        sections = extract_sections_from_abstract(abstract, **COMMON_ARGS)
        assert len(sections) == 1
        assert sections[0].section_type == "history"
        assert sections[0].text == abstract

    def test_structured_abstract_split(self):
        abstract = (
            "BACKGROUND: A rare case of DRESS syndrome. "
            "CASE PRESENTATION: Patient presented with rash and fever. "
            "CONCLUSION: Early recognition is key."
        )
        sections = extract_sections_from_abstract(abstract, **COMMON_ARGS)
        assert len(sections) >= 2

    def test_empty_abstract_returns_empty(self):
        sections = extract_sections_from_abstract("", **COMMON_ARGS)
        assert sections == []


class TestIsCaseViable:
    def test_viable_with_history_section(self):
        sections = [
            CaseSection(**COMMON_ARGS, section_type="history", text="...", chunk_index=0, char_count=3),
        ]
        viable, reason = is_case_viable(sections)
        assert viable is True
        assert reason == ""

    def test_viable_with_history_and_diagnosis(self):
        sections = [
            CaseSection(**COMMON_ARGS, section_type="history", text="...", chunk_index=0, char_count=3),
            CaseSection(**COMMON_ARGS, section_type="diagnosis", text="...", chunk_index=1, char_count=3),
        ]
        viable, reason = is_case_viable(sections)
        assert viable is True

    def test_viable_with_two_substantial_sections_no_history(self):
        long_text = "x" * 200
        sections = [
            CaseSection(**COMMON_ARGS, section_type="labs", text=long_text, chunk_index=0, char_count=200),
            CaseSection(**COMMON_ARGS, section_type="discussion", text=long_text, chunk_index=1, char_count=200),
        ]
        viable, reason = is_case_viable(sections)
        assert viable is True

    def test_not_viable_single_unrecognised_short_section(self):
        sections = [
            CaseSection(**COMMON_ARGS, section_type="discussion", text="short", chunk_index=0, char_count=5),
        ]
        viable, reason = is_case_viable(sections)
        assert viable is False

    def test_not_viable_empty_list(self):
        viable, reason = is_case_viable([])
        assert viable is False


class TestProcessRawCase:
    def _make_raw(self, bioc_json=None) -> RawCase:
        return RawCase(
            pmid="12345678",
            pmc_id="PMC1234567",
            title="Test Case",
            authors=["Smith J"],
            abstract=(
                "CASE PRESENTATION: Patient presented with chest pain. "
                "CONCLUSION: Diagnosis was STEMI."
            ),
            bioc_json=bioc_json or {},
            specialty="cardiology",
            fetch_timestamp="2024-01-01T00:00:00+00:00",
        )

    def test_uses_abstract_fallback_when_no_bioc(self):
        raw = self._make_raw(bioc_json={})
        result = process_raw_case(raw)
        # Should attempt abstract parsing
        assert result.pmid == "12345678"

    def test_skips_non_viable_case(self):
        raw = RawCase(
            pmid="99999999",
            pmc_id=None,
            title="Incomplete Case",
            authors=[],
            abstract="",
            bioc_json={},
            specialty="cardiology",
            fetch_timestamp="2024-01-01T00:00:00+00:00",
        )
        result = process_raw_case(raw)
        assert result.skipped_reason is not None
        assert result.sections == []

    def test_uses_bioc_when_available(self):
        raw = self._make_raw(bioc_json=SAMPLE_BIOC)
        result = process_raw_case(raw)
        assert result.pmid == "12345678"
