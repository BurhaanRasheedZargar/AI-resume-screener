import os
import json
import pika
import redis
import pdfplumber
import docx
from dotenv import load_dotenv

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM
)

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./uploads")

EXCHANGE_NAME = "resume.events"
QUEUE_PARSE = "queue.resume.parse"
QUEUE_MATCH = "queue.resume.match"
QUEUE_SUGGEST = "queue.resume.suggest"

print("[INFO] Connecting to Infrastructure...")

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True
)

params = pika.URLParameters(RABBITMQ_URL)
connection = pika.BlockingConnection(params)
channel = connection.channel()

channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type="topic", durable=True)
channel.queue_declare(queue=QUEUE_PARSE, durable=True)
channel.queue_declare(queue=QUEUE_MATCH, durable=True)
channel.queue_declare(queue=QUEUE_SUGGEST, durable=True)

channel.queue_bind(exchange=EXCHANGE_NAME, queue=QUEUE_PARSE, routing_key="resume.uploaded")
channel.queue_bind(exchange=EXCHANGE_NAME, queue=QUEUE_MATCH, routing_key="resume.match_requested")
channel.queue_bind(exchange=EXCHANGE_NAME, queue=QUEUE_SUGGEST, routing_key="resume.matched")

print("[INFO] Loading Embedding Model (all-MiniLM-L6-v2)...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

print("[INFO] Loading FLAN-T5 Model...")
try:
    t5_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
    t5_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")
    print("[INFO] FLAN-T5 loaded successfully")
except Exception as e:
    print(f"[ERROR] Failed to load FLAN-T5: {e}")
    raise

def t5_generate(prompt: str, max_tokens=200) -> str:
    inputs = t5_tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True
    )

    outputs = t5_model.generate(
        input_ids=inputs["input_ids"],
        attention_mask=inputs["attention_mask"],
        max_new_tokens=max_tokens,
        min_new_tokens=50,
        do_sample=True,
        temperature=0.7,
        eos_token_id=t5_tokenizer.eos_token_id,
        pad_token_id=t5_tokenizer.pad_token_id
    )

    text = t5_tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
    return text if text else "Unable to generate feedback at this time."

def extract_text_from_pdf(filepath: str) -> str:
    text = ""
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        print(f"[ERROR] PDF extraction error: {e}")
    return text

def extract_text_from_docx(filepath: str) -> str:
    try:
        doc = docx.Document(filepath)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        print(f"[ERROR] DOCX extraction error: {e}")
        return ""

def process_parse(ch, method, properties, body):
    try:
        data = json.loads(body)
        resume_id = data["id"]
        filename = data["filename"]
        path = data.get("path")

        print(f"[INFO] [PARSER] Parsing {filename}")
        redis_client.set(f"resume:status:{resume_id}", "PARSING")

        if not os.path.exists(path):
            path = os.path.join(UPLOAD_FOLDER, os.path.basename(path))

        if not os.path.exists(path):
            redis_client.set(f"resume:status:{resume_id}", "FAILED")
            ch.basic_ack(method.delivery_tag)
            return

        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(path)
        elif filename.endswith(".docx"):
            text = extract_text_from_docx(path)
        else:
            text = ""

        if not text.strip():
            redis_client.set(f"resume:status:{resume_id}", "FAILED")
            ch.basic_ack(method.delivery_tag)
            return

        redis_client.setex(
            f"resume:parsed:{resume_id}",
            3600,
            json.dumps({"id": resume_id, "text": text})
        )
        redis_client.set(f"resume:status:{resume_id}", "PARSED")

        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key="resume.parsed",
            body=json.dumps({"id": resume_id})
        )

        print("[INFO] Resume parsed successfully")
        ch.basic_ack(method.delivery_tag)

    except Exception as e:
        print(f"[ERROR] Parser error: {e}")
        ch.basic_nack(method.delivery_tag, requeue=False)

def process_match(ch, method, properties, body):
    try:
        data = json.loads(body)
        resume_id = data["resumeId"]
        job_id = data["jobId"]
        job_text = data["jobDescription"]

        print(f"[INFO] [MATCHER] Matching resume {resume_id[:8]}")

        parsed = redis_client.get(f"resume:parsed:{resume_id}")
        if not parsed:
            ch.basic_ack(method.delivery_tag)
            return

        resume_text = json.loads(parsed)["text"]

        embeddings = embedder.encode([resume_text, job_text])
        score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        percentage = round(float(score) * 100, 2)

        result = {
            "resumeId": resume_id,
            "jobId": job_id,
            "score": percentage,
            "status": "MATCHED"
        }

        redis_client.setex(f"resume:score:{resume_id}", 3600, json.dumps(result))
        redis_client.set(f"resume:status:{resume_id}", "MATCHED")

        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key="resume.matched",
            body=json.dumps(result)
        )

        print(f"[INFO] Match score: {percentage}%")
        ch.basic_ack(method.delivery_tag)

    except Exception as e:
        print(f"[ERROR] Matcher error: {e}")
        ch.basic_nack(method.delivery_tag, requeue=False)

def process_suggest(ch, method, properties, body):
    try:
        data = json.loads(body)
        resume_id = data["resumeId"]
        job_id = data.get("jobId", "")

        print(f"[INFO] [COACH] Generating feedback for resume {resume_id[:8]}")

        parsed = redis_client.get(f"resume:parsed:{resume_id}")
        if not parsed:
            ch.basic_ack(method.delivery_tag)
            return

        resume_data = json.loads(parsed)
        resume_text = resume_data["text"][:800]

        score_data = redis_client.get(f"resume:score:{resume_id}")
        match_score = 0
        if score_data:
            score_obj = json.loads(score_data)
            match_score = score_obj.get("score", 0)

        prompt = (
            f"Resume Analysis Report\n\n"
            f"Resume Content (excerpt):\n{resume_text}\n\n"
            f"Match Score: {match_score}%\n\n"
            f"Provide a professional resume analysis with:\n"
            f"1. Three key strengths (specific skills, experiences, or achievements)\n"
            f"2. Two areas for improvement (missing skills, formatting, or content gaps)\n"
            f"3. One actionable recommendation\n\n"
            f"Format as clear, concise bullet points. Be specific and constructive."
        )

        feedback = t5_generate(prompt, max_tokens=250)

        if not feedback or len(feedback) < 20:
            feedback = (
                f"Resume Analysis:\n\n"
                f"Match Score: {match_score}%\n\n"
                f"Strengths:\n"
                f"- Resume contains relevant professional experience\n"
                f"- Document structure is clear and readable\n\n"
                f"Areas for Improvement:\n"
                f"- Consider adding more specific technical skills\n"
                f"- Enhance quantifiable achievements\n\n"
                f"Recommendation:\n"
                f"- Tailor resume content to better match job requirements"
            )

        redis_client.setex(f"resume:feedback:{resume_id}", 3600, feedback)
        redis_client.set(f"resume:status:{resume_id}", "COMPLETED")

        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key="resume.feedback_generated",
            body=json.dumps({"resumeId": resume_id, "feedback": feedback})
        )

        print("[INFO] Feedback generated successfully")
        ch.basic_ack(method.delivery_tag)

    except Exception as e:
        print(f"[ERROR] Feedback generation error: {e}")
        ch.basic_nack(method.delivery_tag, requeue=False)

channel.basic_qos(prefetch_count=1)

channel.basic_consume(queue=QUEUE_PARSE, on_message_callback=process_parse)
channel.basic_consume(queue=QUEUE_MATCH, on_message_callback=process_match)
channel.basic_consume(queue=QUEUE_SUGGEST, on_message_callback=process_suggest)

print("[INFO] Worker started. Waiting for events...")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    print("[INFO] Worker shutting down")
    connection.close()
