# AI Resume Screener

A full-stack event-driven application for intelligent resume analysis and job matching using AI.

## 🚀 Features

- **User Authentication**: Role-based access (Admin, Recruiter, Candidate)
- **Resume Upload**: Support for PDF and DOCX files
- **AI-Powered Analysis**: 
  - Resume parsing and text extraction
  - Semantic matching with job descriptions
  - AI-generated feedback using FLAN-T5
- **Job Management**: Create and manage job postings (Recruiters)
- **Real-time Status Tracking**: Live updates on processing pipeline
- **Modern Dark UI**: Professional dark theme interface

## 🏗️ Architecture

- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **AI Worker**: Python with Transformers (FLAN-T5, Sentence Transformers)
- **Frontend**: React + Vite
- **Message Queue**: RabbitMQ
- **Cache**: Redis

## 📋 Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- PostgreSQL
- RabbitMQ
- Redis

## 🔧 Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-resume-screener
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database, RabbitMQ, and Redis credentials

# Run migrations
npx prisma migrate dev
npx prisma generate

# Create admin user
node scripts/createAdmin.js
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. AI Worker Setup

```bash
cd ai-worker
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:password@localhost:5434/resume_db"
JWT_SECRET="your-secret-key-here"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
REDIS_URL="redis://localhost:6379"
PORT=3000
UPLOAD_FOLDER="./uploads"
```

**AI Worker (.env):**
```env
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
REDIS_HOST="localhost"
REDIS_PORT=6379
UPLOAD_FOLDER="../backend/uploads"
```

## 🚀 Running the Application

### Start Backend
```bash
cd backend
npm start
# or for development
npm run dev
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Start AI Worker
```bash
cd ai-worker
source venv/bin/activate  # On Windows: venv\Scripts\activate
python worker.py
```

## 👤 Default Admin Account

- **Email**: `admin@resumescreener.com`
- **Password**: `admin123`

⚠️ **Change this password immediately after first login!**

## 📁 Project Structure

```
ai-resume-screener/
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── workers/
│   └── prisma/
├── frontend/         # React application
│   └── src/
│       ├── pages/
│       └── components/
└── ai-worker/        # Python AI processing worker
    └── worker.py
```

## 🔐 Security Notes

- Never commit `.env` files
- Use strong JWT secrets in production
- Change default admin password
- Use HTTPS in production

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Resumes
- `POST /api/resume/upload` - Upload resume (authenticated)
- `GET /api/resume/my` - Get user's resumes (authenticated)
- `GET /api/resume/:id/status` - Get resume status (authenticated)
- `GET /api/resume/:id/result` - Get resume analysis result (authenticated)

### Jobs
- `POST /api/jobs` - Create job (Recruiter/Admin)
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/my` - Get user's jobs (authenticated)

### Matching
- `POST /api/match` - Trigger resume-job matching (authenticated)

## 🛠️ Tech Stack

- **Backend**: Express.js, Prisma, PostgreSQL, RabbitMQ, Redis
- **AI**: Python, Transformers, Sentence Transformers, FLAN-T5
- **Frontend**: React, Vite, Axios, Lucide Icons
- **Authentication**: JWT, bcrypt

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

