def normalize_ext(name):
    if not name:
        return None
    lower = name.lower()
    if lower.endswith(".pdf"):
        return "pdf"
    if lower.endswith(".docx"):
        return "docx"
    if lower.endswith(".doc"):
        return "doc"
    return None


def chunk_text(text, chunk_words=200, overlap=50):
    words = (text or "").split()
    if not words:
        return []
    if len(words) <= chunk_words:
        return [" ".join(words)]

    step = max(1, chunk_words - overlap)
    chunks = []
    for i in range(0, len(words), step):
        chunk = words[i : i + chunk_words]
        if chunk:
            chunks.append(" ".join(chunk))
        if i + chunk_words >= len(words):
            break
    return chunks
