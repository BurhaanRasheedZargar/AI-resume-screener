import json
import time
import logging
from datetime import datetime, timezone

import pika

import config

log = logging.getLogger(__name__)

_connection = None
_channel = None
RECONNECT_DELAY = 5


def _declare_topology(channel):
    channel.exchange_declare(exchange=config.EXCHANGE_NAME, exchange_type="topic", durable=True)
    channel.queue_declare(queue=config.DLQ_NAME, durable=True)

    bindings = {
        config.QUEUE_PARSE: "resume.uploaded",
        config.QUEUE_MATCH: "resume.match_requested",
        config.QUEUE_SUGGEST: "resume.matched",
    }
    for queue, routing_key in bindings.items():
        channel.queue_declare(queue=queue, durable=True)
        channel.queue_bind(exchange=config.EXCHANGE_NAME, queue=queue, routing_key=routing_key)


def connect():
    global _connection, _channel
    params = pika.URLParameters(config.RABBITMQ_URL)
    params.heartbeat = 600
    params.blocked_connection_timeout = 300

    _connection = pika.BlockingConnection(params)
    _channel = _connection.channel()
    _declare_topology(_channel)
    return _channel


def publish(routing_key, message):
    _channel.basic_publish(
        exchange=config.EXCHANGE_NAME,
        routing_key=routing_key,
        body=json.dumps(message),
        properties=pika.BasicProperties(delivery_mode=2),
    )
    log.debug("Published %s", routing_key)


def dead_letter(original_routing_key, body, error):
    if isinstance(body, (bytes, bytearray)):
        raw = body.decode("utf-8", "replace")
    else:
        raw = str(body)

    payload = {
        "originalRoutingKey": original_routing_key,
        "error": str(error),
        "failedAt": datetime.now(timezone.utc).isoformat(),
        "body": raw,
    }
    try:
        _channel.basic_publish(
            exchange="",
            routing_key=config.DLQ_NAME,
            body=json.dumps(payload),
            properties=pika.BasicProperties(delivery_mode=2),
        )
        log.warning("Dead-lettered message from '%s': %s", original_routing_key, error)
    except Exception:
        log.exception("Failed to publish to dead-letter queue")


def consume_forever(consumers):
    global _connection
    while True:
        try:
            channel = connect()
            channel.basic_qos(prefetch_count=config.PREFETCH)
            for queue, callback in consumers.items():
                channel.basic_consume(queue=queue, on_message_callback=callback)
            log.info("Connected to RabbitMQ. Waiting for events...")
            channel.start_consuming()
        except (
            pika.exceptions.AMQPConnectionError,
            pika.exceptions.StreamLostError,
            pika.exceptions.ChannelClosedByBroker,
        ) as exc:
            log.error("RabbitMQ connection lost: %s. Reconnecting in %ss...", exc, RECONNECT_DELAY)
            time.sleep(RECONNECT_DELAY)
        except KeyboardInterrupt:
            log.info("Shutdown requested")
            try:
                if _connection and _connection.is_open:
                    _connection.close()
            except Exception:
                pass
            break
