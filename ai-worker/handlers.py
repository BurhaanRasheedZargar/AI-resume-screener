import os
import json
import logging

import config
import cache
import messaging
from extractors import extract_text
from matching import compute_score
from feedback import generate_feedback

log = logging.getLogger(__name__)


def _resolve_path(path):
    if path and os.path.exists(path):
        return path
    if path:
        alt = os.path.join(config.UPLOAD_FOLDER, os.path.basename(path))
        if os.path.exists(alt):
            return alt
    return None


def process_parse(ch, method, properties, body):
    try:
        data = json.loads(body)
        rid = data["id"]
        filename = data.get("filename", "")
        log.info("[PARSE] %s", filename)
        cache.set_status(rid, "PARSING")

        path = _resolve_path(data.get("path"))
        if not path:
            log.warning("[PARSE] file not found for %s", rid)
            cache.set_status(rid, "FAILED")
            ch.basic_ack(method.delivery_tag)
            return

        text = extract_text(path, filename)
        if not text.strip():
            log.warning("[PARSE] no text extracted for %s", rid)
            cache.set_status(rid, "FAILED")
            ch.basic_ack(method.delivery_tag)
            return

        cache.set_json(config.k_parsed(rid), {"id": rid, "text": text}, config.CACHE_TTL)
        cache.set_status(rid, "PARSED")
        messaging.publish("resume.parsed", {"id": rid})
        log.info("[PARSE] done %s (%d chars)", rid, len(text))
        ch.basic_ack(method.delivery_tag)
    except Exception as exc:
        log.exception("[PARSE] error")
        messaging.dead_letter(method.routing_key, body, exc)
        ch.basic_ack(method.delivery_tag)


def process_match(ch, method, properties, body):
    try:
        data = json.loads(body)
        rid = data["resumeId"]
        job_id = data.get("jobId")
        job_text = data.get("jobDescription", "")

        resume_text = data.get("resumeText")
        if not resume_text:
            parsed = cache.get_json(config.k_parsed(rid))
            resume_text = parsed["text"] if parsed else None
        if not resume_text:
            log.warning("[MATCH] no resume text available for %s", rid)
            ch.basic_ack(method.delivery_tag)
            return

        cache.set_json(config.k_parsed(rid), {"id": rid, "text": resume_text}, config.CACHE_TTL)

        score = compute_score(resume_text, job_text)
        result = {"resumeId": rid, "jobId": job_id, "score": score, "status": "MATCHED"}
        cache.set_json(config.k_score(rid), result, config.CACHE_TTL)
        cache.set_status(rid, "MATCHED")

        messaging.publish("resume.matched", {**result, "jobDescription": job_text})
        log.info("[MATCH] %s -> %.2f%%", rid, score)
        ch.basic_ack(method.delivery_tag)
    except Exception as exc:
        log.exception("[MATCH] error")
        messaging.dead_letter(method.routing_key, body, exc)
        ch.basic_ack(method.delivery_tag)


def process_suggest(ch, method, properties, body):
    try:
        data = json.loads(body)
        rid = data["resumeId"]

        parsed = cache.get_json(config.k_parsed(rid))
        if not parsed:
            log.warning("[COACH] no parsed text for %s", rid)
            ch.basic_ack(method.delivery_tag)
            return
        resume_text = parsed["text"]

        score_obj = cache.get_json(config.k_score(rid)) or {}
        score = score_obj.get("score", 0)
        job_text = data.get("jobDescription", "")

        log.info("[COACH] generating feedback for %s", rid)
        feedback = generate_feedback(resume_text, job_text, score)

        cache.set_text(config.k_feedback(rid), feedback, config.CACHE_TTL)
        cache.set_status(rid, "COMPLETED")
        messaging.publish("resume.feedback_generated", {"resumeId": rid, "feedback": feedback})
        log.info("[COACH] done %s", rid)
        ch.basic_ack(method.delivery_tag)
    except Exception as exc:
        log.exception("[COACH] error")
        messaging.dead_letter(method.routing_key, body, exc)
        ch.basic_ack(method.delivery_tag)
