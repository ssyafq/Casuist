import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.fetcher import (
    fetch_abstract,
    fetch_bioc_fulltext,
    fetch_and_save_case,
    pmid_to_pmc_id,
    search_pubmed,
)


@pytest.fixture
def tmp_output(tmp_path):
    return tmp_path / "raw"


class TestSearchPubmed:
    @patch("src.fetcher.Entrez.esearch")
    @patch("src.fetcher.Entrez.read")
    def test_returns_pmid_list(self, mock_read, mock_esearch):
        mock_read.return_value = {"IdList": ["12345678", "87654321"]}
        mock_esearch.return_value = MagicMock()
        result = search_pubmed("cardiology", 10)
        assert result == ["12345678", "87654321"]

    @patch("src.fetcher.Entrez.esearch")
    @patch("src.fetcher.Entrez.read")
    def test_empty_result(self, mock_read, mock_esearch):
        mock_read.return_value = {"IdList": []}
        mock_esearch.return_value = MagicMock()
        result = search_pubmed("cardiology", 10)
        assert result == []


class TestFetchAbstract:
    @patch("src.fetcher.Medline.parse")
    @patch("src.fetcher.Entrez.efetch")
    def test_returns_metadata(self, mock_efetch, mock_parse):
        mock_efetch.return_value = MagicMock()
        mock_parse.return_value = iter([{
            "TI": "Test Case Report",
            "AU": ["Smith J", "Jones A"],
            "AB": "A 45-year-old patient presented with chest pain.",
        }])
        result = fetch_abstract("12345678")
        assert result["title"] == "Test Case Report"
        assert result["authors"] == ["Smith J", "Jones A"]
        assert "chest pain" in result["abstract"]

    @patch("src.fetcher.Entrez.efetch")
    def test_returns_none_on_error(self, mock_efetch):
        mock_efetch.side_effect = Exception("Network error")
        result = fetch_abstract("12345678")
        assert result is None

    @patch("src.fetcher.Medline.parse")
    @patch("src.fetcher.Entrez.efetch")
    def test_returns_none_on_empty_records(self, mock_efetch, mock_parse):
        mock_efetch.return_value = MagicMock()
        mock_parse.return_value = iter([])
        result = fetch_abstract("12345678")
        assert result is None


class TestPmidToPmcId:
    @patch("src.fetcher.Entrez.elink")
    @patch("src.fetcher.Entrez.read")
    def test_returns_pmc_id(self, mock_read, mock_elink):
        mock_elink.return_value = MagicMock()
        mock_read.return_value = [{
            "LinkSetDb": [{"Link": [{"Id": "1234567"}]}]
        }]
        result = pmid_to_pmc_id("12345678")
        assert result == "PMC1234567"

    @patch("src.fetcher.Entrez.elink")
    @patch("src.fetcher.Entrez.read")
    def test_returns_none_when_no_links(self, mock_read, mock_elink):
        mock_elink.return_value = MagicMock()
        mock_read.return_value = [{"LinkSetDb": []}]
        result = pmid_to_pmc_id("12345678")
        assert result is None

    @patch("src.fetcher.Entrez.elink")
    def test_returns_none_on_error(self, mock_elink):
        mock_elink.side_effect = Exception("API error")
        result = pmid_to_pmc_id("12345678")
        assert result is None


class TestFetchBiocFulltext:
    @patch("src.fetcher.requests.get")
    def test_returns_json_on_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"documents": []}
        mock_get.return_value = mock_response
        result = fetch_bioc_fulltext("PMC1234567")
        assert result == {"documents": []}

    @patch("src.fetcher.requests.get")
    def test_returns_none_on_404(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response
        result = fetch_bioc_fulltext("PMC9999999")
        assert result is None

    @patch("src.fetcher.requests.get")
    def test_returns_none_on_exception(self, mock_get):
        mock_get.side_effect = Exception("Timeout")
        result = fetch_bioc_fulltext("PMC1234567")
        assert result is None


class TestFetchAndSaveCase:
    @patch("src.fetcher.fetch_bioc_fulltext")
    @patch("src.fetcher.pmid_to_pmc_id")
    @patch("src.fetcher.fetch_abstract")
    def test_saves_json_and_returns_true(
        self, mock_abstract, mock_pmc, mock_bioc, tmp_output
    ):
        mock_abstract.return_value = {
            "title": "Test Case",
            "authors": ["Smith J"],
            "abstract": "Patient presented with fever.",
        }
        mock_pmc.return_value = "PMC1234567"
        mock_bioc.return_value = {"documents": []}

        result = fetch_and_save_case("12345678", "cardiology", tmp_output)

        assert result is True
        saved = tmp_output / "12345678.json"
        assert saved.exists()
        data = json.loads(saved.read_text())
        assert data["pmid"] == "12345678"
        assert data["specialty"] == "cardiology"

    @patch("src.fetcher.fetch_abstract")
    def test_returns_false_on_no_abstract(self, mock_abstract, tmp_output):
        mock_abstract.return_value = None
        result = fetch_and_save_case("99999999", "cardiology", tmp_output)
        assert result is False

    @patch("src.fetcher.fetch_bioc_fulltext")
    @patch("src.fetcher.pmid_to_pmc_id")
    @patch("src.fetcher.fetch_abstract")
    def test_saves_abstract_only_when_no_pmc(
        self, mock_abstract, mock_pmc, mock_bioc, tmp_output
    ):
        mock_abstract.return_value = {
            "title": "Abstract Only Case",
            "authors": [],
            "abstract": "A patient with chest pain.",
        }
        mock_pmc.return_value = None
        result = fetch_and_save_case("11111111", "cardiology", tmp_output)
        assert result is True
        data = json.loads((tmp_output / "11111111.json").read_text())
        assert data["pmc_id"] is None
        assert data["bioc_json"] == {}
        mock_bioc.assert_not_called()
