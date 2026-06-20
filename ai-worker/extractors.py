import logging

import pdfplumber
import docx

from textutils import normalize_ext

log = logging.getLogger(__name__)


def _from_pdf(filepath):
    text = ""
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception:
        log.exception("PDF extraction failed for %s", filepath)
    return text


def _from_docx(filepath):
    try:
        document = docx.Document(filepath)
        return "\n".join(p.text for p in document.paragraphs)
    except Exception:
        log.exception("DOCX extraction failed for %s", filepath)
        return ""


def extract_text(filepath, filename=None):
    kind = normalize_ext(filename) or normalize_ext(filepath)
    if kind == "pdf":
        return _from_pdf(filepath)
    if kind == "docx":
        return _from_docx(filepath)
    log.warning("Unsupported file type for %s", filename or filepath)
    return ""
