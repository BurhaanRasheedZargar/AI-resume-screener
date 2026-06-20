import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from textutils import normalize_ext, chunk_text  # noqa: E402


def test_normalize_ext_is_case_insensitive():
    assert normalize_ext("Resume.PDF") == "pdf"
    assert normalize_ext("CV.DocX") == "docx"
    assert normalize_ext("old.DOC") == "doc"


def test_normalize_ext_unknown_and_empty():
    assert normalize_ext("notes.txt") is None
    assert normalize_ext("") is None
    assert normalize_ext(None) is None


def test_chunk_short_text_single_chunk():
    assert chunk_text("a b c", chunk_words=200) == ["a b c"]


def test_chunk_empty():
    assert chunk_text("") == []


def test_chunk_long_text_overlaps_and_respects_size():
    text = " ".join(str(i) for i in range(500))
    chunks = chunk_text(text, chunk_words=200, overlap=50)
    assert len(chunks) >= 3
    assert all(len(c.split()) <= 200 for c in chunks)
    # consecutive chunks should overlap (step = 150)
    assert chunks[0].split()[150] == chunks[1].split()[0]
