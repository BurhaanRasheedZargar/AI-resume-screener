import json

import redis

import config

if config.REDIS_URL:
    redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
else:
    redis_client = redis.Redis(host=config.REDIS_HOST, port=config.REDIS_PORT, decode_responses=True)


def set_status(rid, status, ttl=None):
    if ttl:
        redis_client.setex(config.k_status(rid), ttl, status)
    else:
        redis_client.set(config.k_status(rid), status)


def get_json(key):
    raw = redis_client.get(key)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return None


def set_json(key, value, ttl):
    redis_client.setex(key, ttl, json.dumps(value))


def set_text(key, value, ttl):
    redis_client.setex(key, ttl, value)
