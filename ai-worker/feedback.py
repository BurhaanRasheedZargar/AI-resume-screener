import logging

from models import chat_generate

log = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an expert technical recruiter and resume coach. "
    "You give concise, specific, actionable feedback grounded only in the "
    "resume provided. Never invent experience that is not present."
)


def _build_prompt(resume_text, job_text, score):
    job_block = f"\n\nTarget job description:\n{job_text[:1500]}" if job_text else ""
    against = " against the target job" if job_text else ""
    return (
        f"Analyze this resume{against}.\n\n"
        f"Resume:\n{resume_text[:4000]}{job_block}\n\n"
        f"Semantic match score: {score}%\n\n"
        "Respond in markdown with exactly these three sections:\n"
        "## Strengths\n"
        "- three specific strengths grounded in the resume\n"
        "## Gaps\n"
        "- two concrete gaps or missing skills relative to the job\n"
        "## Recommendation\n"
        "- one prioritized, actionable next step"
    )


def _fallback(score):
    return (
        "## Strengths\n"
        "- Relevant professional experience is present\n"
        "- Document structure is clear and readable\n"
        "- Demonstrates applicable technical skills\n\n"
        "## Gaps\n"
        "- Add more specific, in-demand technical skills\n"
        "- Quantify achievements with measurable impact\n\n"
        "## Recommendation\n"
        f"- Tailor the resume to better match the target role (current match: {score}%)."
    )


def generate_feedback(resume_text, job_text, score):
    try:
        output = chat_generate(SYSTEM_PROMPT, _build_prompt(resume_text, job_text, score))
    except Exception:
        log.exception("LLM generation failed; using fallback feedback")
        output = ""

    if not output or len(output) < 40:
        return _fallback(score)
    return output
