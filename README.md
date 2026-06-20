# AI Resume Screener

A full-stack, event-driven application that analyzes resumes with AI and matches them against job descriptions. Candidates upload a resume, the system extracts and embeds the text, scores it against a chosen job using semantic similarity, and generates structured, recruiter-style feedback with an open-source LLM — all asynchronously through a message queue with live status updates in the UI.

---

## ✨ Features

- **Role-based accounts** — Candidate, Recruiter, and Admin.
- **Resume upload** — PDF and DOCX, with validation and size limits.
- **AI analysis pipeline**
  - Text extraction (pdfplumber / python-docx)
  - Semantic match score via sentence embeddings (chunked, no truncation)
  - Recruiter-style feedback via an instruction-tuned LLM
- **Job management** — recruiters post jobs and see matched candidates ranked by score.
- **Live status tracking** — an animated pipeline (Upload → Parse → Match → Feedback) polls real-time progress.
- **Modern animated UI** — dark theme, glassmorphism, page transitions, animated score gauge.
- **Resilient by design** — message queue with reconnection and a dead-letter queue, Redis caching, JWT auth, rate limiting, and a deep health check.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    UI[React Frontend] -- REST --> API[Node.js / Express API]
    API -- Prisma --> PG[(PostgreSQL)]
    API <-- status/cache --> R[(Redis)]
    API -- publish/consume --> MQ{{RabbitMQ}}
    W[Python AI Worker] -- publish/consume --> MQ
    W <-- text/score/feedback --> R
    W -. embeddings + LLM .-> HF[(Hugging Face models)]
```

**Event pipeline** (RabbitMQ topic exchange `resume.events`):

```
upload ──> resume.uploaded ──> [parse] ──> resume.parsed
                                                │
                          (user picks a job)    ▼
       resume.match_requested ──> [match] ──> resume.matched
                                                │
                                                ▼
                                  [feedback] ──> resume.feedback_generated ──> COMPLETED
```

Status is written to Redis (`resume:status:{id}`) for fast polling and mirrored to PostgreSQL as the source of truth. Failed messages are sent to a dead-letter queue with error context.

### Tech stack

| Layer        | Technology                                                                 |
| ------------ | ------------------------------------------------------------------------- |
| Frontend     | React 19, Vite, React Router, Framer Motion, React Markdown, Axios         |
| Backend      | Node.js, Express 5, Prisma, Zod, JWT, Pino                                  |
| AI Worker    | Python, Transformers, Sentence-Transformers, PyTorch, pdfplumber           |
| Data / infra | PostgreSQL, Redis, RabbitMQ                                                 |

### AI models (free & ungated — no Hugging Face token required)

| Purpose             | Model                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| Embeddings (match)  | [`BAAI/bge-small-en-v1.5`](https://hf.co/BAAI/bge-small-en-v1.5) (MIT)          |
| Feedback (LLM)      | [`Qwen/Qwen2.5-1.5B-Instruct`](https://hf.co/Qwen/Qwen2.5-1.5B-Instruct) (Apache-2.0) |

Both are configurable via environment variables. On a GPU host you can raise quality with e.g. `LLM_MODEL=Qwen/Qwen2.5-3B-Instruct` or `microsoft/Phi-3.5-mini-instruct`.

---

## 📁 Project structure

```
AI-resume-screener/
├── docker-compose.yml        # full stack: postgres, redis, rabbitmq, 3 services
├── .env.example              # optional compose overrides
├── backend/                  # Node.js / Express API
│   ├── src/
│   │   ├── config/           # env, db, logger, redis, rabbitmq
│   │   ├── controllers/      # auth, resume, job, match
│   │   ├── middleware/       # auth, validation, rate limiting, errors
│   │   ├── routes/           # API routes
│   │   ├── validators/       # zod schemas
│   │   ├── workers/          # consumes AI results -> persists to DB
│   │   ├── app.js
│   │   └── server.js
│   ├── prisma/schema.prisma
│   └── Dockerfile
├── ai-worker/                # Python AI processing worker
│   ├── config.py  cache.py  extractors.py  textutils.py
│   ├── models.py  matching.py  feedback.py
│   ├── messaging.py  handlers.py  worker.py
│   └── Dockerfile
└── frontend/                 # React + Vite SPA
    ├── src/
    │   ├── components/  context/  hooks/  pages/  utils/
    │   ├── api.js  App.jsx  main.jsx
    │   └── styles/
    ├── nginx.conf
    └── Dockerfile
```

---

## 🚀 Quick start with Docker (recommended)

Requires Docker and Docker Compose.

```bash
git clone https://github.com/BurhaanRasheedZargar/AI-resume-screener.git
cd AI-resume-screener

# optional: override secrets / models
cp .env.example .env

docker compose up --build
```

Then open **http://localhost:8080**.

| Service            | URL                                            |
| ------------------ | ---------------------------------------------- |
| Frontend           | http://localhost:8080                          |
| Backend API        | http://localhost:3000 (health: `/health`)      |
| RabbitMQ dashboard | http://localhost:15672 (guest / guest)         |

> **First run note:** the AI worker downloads its models (~3 GB) on first start, so analysis becomes available a few minutes after the stack is up. Models are cached in a Docker volume for subsequent runs. The backend automatically applies the database schema (`prisma db push`) and seeds the default admin on startup.

To stop and remove everything (including volumes):

```bash
docker compose down -v
```

---

## 🧑‍💻 Manual / local development

**Prerequisites:** Node.js 20+, Python 3.10+, and running PostgreSQL, Redis, and RabbitMQ instances.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit values (set a 32+ char JWT_SECRET)
npx prisma generate
npx prisma db push          # or: npx prisma migrate dev
npm run seed:admin
npm run dev                 # http://localhost:3000
```

### 2. AI Worker

```bash
cd ai-worker
python -m venv venv
venv\Scripts\activate        # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
cp .env.example .env
python worker.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173 (proxies /api to :3000)
```

---

## 🔧 Environment variables

### Backend (`backend/.env`)

| Variable        | Description                                  | Default                  |
| --------------- | -------------------------------------------- | ------------------------ |
| `DATABASE_URL`  | PostgreSQL connection string                 | —                        |
| `JWT_SECRET`    | JWT signing secret (min 32 chars)            | —                        |
| `RABBITMQ_URL`  | RabbitMQ AMQP URL                            | —                        |
| `REDIS_URL`     | Redis connection URL                         | —                        |
| `PORT`          | API port                                     | `3000`                   |
| `CORS_ORIGIN`   | Comma-separated allowed origins              | `http://localhost:5173`  |
| `UPLOAD_FOLDER` | Upload directory                             | `./uploads`              |
| `MAX_UPLOAD_MB` | Max upload size (MB)                         | `5`                      |

### AI Worker (`ai-worker/.env`)

| Variable          | Description                          | Default                         |
| ----------------- | ------------------------------------ | ------------------------------- |
| `RABBITMQ_URL`    | RabbitMQ AMQP URL                    | `amqp://guest:guest@localhost:5672` |
| `REDIS_URL`       | Redis URL (or `REDIS_HOST`/`PORT`)  | —                               |
| `UPLOAD_FOLDER`   | Shared upload directory             | `../backend/uploads`            |
| `LLM_MODEL`       | Feedback model                      | `Qwen/Qwen2.5-1.5B-Instruct`    |
| `EMBEDDING_MODEL` | Embedding model                     | `BAAI/bge-small-en-v1.5`        |
| `DEVICE`          | `cpu` / `cuda` (auto-detected)      | auto                            |

---

## 👤 Default admin account

| Email                        | Password   |
| ---------------------------- | ---------- |
| `admin@resumescreener.com`   | `admin123` |

> Change this immediately (set `ADMIN_EMAIL` / `ADMIN_PASSWORD` before seeding, or update after first login).

---

## 📡 API reference

All protected routes require an `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| POST   | `/api/auth/register` | Register (Candidate/Recruiter) |
| POST   | `/api/auth/login`    | Log in                 |
| GET    | `/api/auth/me`       | Current user profile   |

### Resumes
| Method | Endpoint                  | Description                  |
| ------ | ------------------------- | ---------------------------- |
| POST   | `/api/resume/upload`      | Upload a resume (multipart)  |
| GET    | `/api/resume/my`          | List my resumes (paginated)  |
| GET    | `/api/resume/:id/status`  | Processing status            |
| GET    | `/api/resume/:id/result`  | Score + feedback             |
| DELETE | `/api/resume/:id`         | Delete a resume              |

### Jobs
| Method | Endpoint        | Description                          |
| ------ | --------------- | ----------------------------------- |
| POST   | `/api/jobs`     | Create a job (Recruiter/Admin)      |
| GET    | `/api/jobs`     | List all jobs (paginated)           |
| GET    | `/api/jobs/my`  | My jobs with matched candidates     |
| GET    | `/api/jobs/:id` | Job by id                           |
| DELETE | `/api/jobs/:id` | Delete a job (Recruiter/Admin)      |

### Matching & health
| Method | Endpoint     | Description                          |
| ------ | ------------ | ----------------------------------- |
| POST   | `/api/match` | Trigger resume↔job analysis         |
| GET    | `/health`    | Dependency health (DB/Redis/MQ)     |

---

## 🔐 Security notes

- Registration cannot grant the `ADMIN` role (server-side whitelist).
- Never commit `.env` files; use strong `JWT_SECRET` values and HTTPS in production.
- Uploads are restricted by type, size, and count.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
