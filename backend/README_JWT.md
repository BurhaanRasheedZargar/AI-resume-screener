# JWT Token Setup Guide

## What is a JWT Token?

JWT (JSON Web Token) is used for authentication. When users register or login, the backend automatically generates a JWT token that contains user information.

## How JWT Tokens Work in This App

1. **User Registration/Login**: When a user registers or logs in, the backend creates a JWT token
2. **Token Storage**: The frontend stores the token in `localStorage`
3. **API Requests**: The frontend automatically includes the token in the `Authorization` header for protected routes
4. **Token Validation**: The backend validates the token on each protected request

## Setting Up JWT_SECRET

### Step 1: Create `.env` file

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```bash
cp .env.example .env
```

### Step 2: Generate a Strong JWT Secret

**Option A: Using Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option C: Manual (for development only)**
Use any long random string, e.g.:
```
JWT_SECRET="my-super-secret-key-for-development-only-12345"
```

### Step 3: Add to `.env` file

```env
JWT_SECRET="your-generated-secret-key-here"
```

## Default Admin Account

After running the migration, a default admin account is created:

- **Email**: `admin@resumescreener.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

To update the admin password, run:
```bash
node scripts/createAdmin.js
```

## Getting JWT Tokens

### Method 1: Through the Frontend (Recommended)

1. Open the application in your browser
2. Register a new account or login
3. The JWT token is automatically stored in browser's `localStorage`
4. You can view it in browser DevTools → Application → Local Storage

### Method 2: Through API (for testing)

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "CANDIDATE"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

The response will include a `token` field - that's your JWT token!

### Method 3: Using the Token

Once you have the token, include it in API requests:

```bash
curl -X GET http://localhost:3000/api/resume/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Token Expiration

Tokens expire after **7 days** by default. Users need to login again after expiration.

## Security Notes

1. **Never commit `.env` file** to version control
2. **Use strong secrets** in production (32+ characters, random)
3. **Change default admin password** immediately
4. **Use HTTPS** in production to protect tokens in transit

