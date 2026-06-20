import logging
import threading

import config
import models
import handlers
import messaging


def _warmup(log):
    try:
        log.info("Loading models in background (first run downloads weights)...")
        models.warmup()
        log.info("Models ready.")
    except Exception:
        log.exception("Background model load failed; will retry on first use")


def main():
    config.configure_logging()
    log = logging.getLogger("worker")

    log.info("Starting AI worker")
    log.info(
        "embedding=%s | llm=%s | device=%s",
        config.EMBEDDING_MODEL,
        config.LLM_MODEL,
        models.DEVICE,
    )

    threading.Thread(target=_warmup, args=(log,), name="model-warmup", daemon=True).start()

    consumers = {
        config.QUEUE_PARSE: handlers.process_parse,
        config.QUEUE_MATCH: handlers.process_match,
        config.QUEUE_SUGGEST: handlers.process_suggest,
    }
    messaging.consume_forever(consumers)
    log.info("Worker stopped.")


if __name__ == "__main__":
    main()
