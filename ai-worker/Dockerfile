FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/app/hf-cache

COPY requirements.txt .

RUN ARCH="$(uname -m)"; \
    if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then \
        pip install --no-cache-dir torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu; \
    else \
        pip install --no-cache-dir torch==2.5.1; \
    fi \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "worker.py"]
