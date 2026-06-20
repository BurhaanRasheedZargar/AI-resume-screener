import os
import logging

from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
REDIS_URL = os.getenv("REDIS_URL")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "../backend/uploads")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
LLM_MODEL = os.getenv("LLM_MODEL", "Qwen/Qwen2.5-1.5B-Instruct")
DEVICE = os.getenv("DEVICE")
MODEL_DTYPE = os.getenv("MODEL_DTYPE")
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "320"))
GEN_TEMPERATURE = float(os.getenv("GEN_TEMPERATURE", "0.7"))

CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))
PREFETCH = int(os.getenv("PREFETCH", "1"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

EXCHANGE_NAME = "resume.events"
DLQ_NAME = "queue.resume.dlq"
QUEUE_PARSE = "queue.resume.parse"
QUEUE_MATCH = "queue.resume.match"
QUEUE_SUGGEST = "queue.resume.suggest"


def k_status(rid):
    return f"resume:status:{rid}"


def k_parsed(rid):
    return f"resume:parsed:{rid}"


def k_score(rid):
    return f"resume:score:{rid}"


def k_feedback(rid):
    return f"resume:feedback:{rid}"


def configure_logging():
    logging.basicConfig(
        level=LOG_LEVEL,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
