# Quick Setup Guide

## ✅ Migration Fixed!

The migration has been successfully applied. All existing data has been assigned to the default admin user.

## 🔑 JWT Token Setup

### 1. Create `.env` file

Create a `.env` file in the `backend` directory with the following:

```env
DATABASE_URL="postgresql://user:password@localhost:5434/resume_db?schema=public"
JWT_SECRET="2d49807287c729c7cb366ab724575181d3320fd6407c5ea2db2e6bea839eff12"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT=6379
PORT=3000
UPLOAD_FOLDER="./uploads"
```

**Note**: The JWT_SECRET above is a generated secure key. You can use it or generate a new one.

### 2. How to Get JWT Tokens

**Option 1: Through the Website (Easiest)**
1. Start the frontend: `cd frontend && npm run dev`
2. Open http://localhost:5173
3. Register a new account or login
4. The token is automatically stored and used by the frontend

**Option 2: Through API**

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "CANDIDATE"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

The response will contain a `token` field - that's your JWT token!

### 3. Using the Token

The frontend automatically includes the token in all API requests. If you're testing with curl:

```bash
curl -X GET http://localhost:3000/api/resume/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 👤 Default Admin Account

- **Email**: `admin@resumescreener.com`
- **Password**: `admin123`

⚠️ **Change this password after first login!**

## 🚀 Next Steps

1. ✅ Migration is complete
2. ✅ Admin user created
3. ⚠️ Create `.env` file with JWT_SECRET
4. ⚠️ Restart backend server to load new environment variables
5. ✅ Start frontend and test login/registration

## 📝 Token Details

- **Expiration**: 7 days
- **Storage**: Browser localStorage (frontend)
- **Format**: `Bearer <token>` in Authorization header
- **Contains**: User ID (used to identify the user)

For more details, see `README_JWT.md`

