import logging

import numpy as np

from models import get_embedder
from textutils import chunk_text

log = logging.getLogger(__name__)


def compute_score(resume_text, job_text):
    embedder = get_embedder()
    resume_text = resume_text or ""
    job_text = job_text or ""

    chunks = chunk_text(resume_text) or [resume_text]

    chunk_emb = np.asarray(embedder.encode(chunks, normalize_embeddings=True))
    job_emb = np.asarray(embedder.encode([job_text], normalize_embeddings=True))[0]
    full_emb = np.asarray(embedder.encode([resume_text], normalize_embeddings=True))[0]

    sims = chunk_emb @ job_emb
    max_sim = float(sims.max())
    mean_sim = float(sims.mean())
    full_sim = float(full_emb @ job_emb)

    blended = 0.5 * max_sim + 0.3 * full_sim + 0.2 * mean_sim
    blended = max(0.0, min(1.0, blended))
    return round(blended * 100, 2)
