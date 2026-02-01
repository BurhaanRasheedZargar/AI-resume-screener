# GitHub Upload Guide

## ✅ Pre-Upload Checklist

Before uploading to GitHub, make sure:

1. ✅ `.gitignore` is configured (already done)
2. ✅ `.env` files are NOT included (they're in .gitignore)
3. ✅ `node_modules/` are excluded
4. ✅ `venv/` and Python cache are excluded
5. ✅ Upload folders are excluded
6. ✅ Sensitive data is removed

## 🚀 Upload Steps

### Option 1: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not installed
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: See https://cli.github.com/

# Login to GitHub
gh auth login

# Create repository and push
gh repo create ai-resume-screener --public --source=. --remote=origin --push
```

### Option 2: Using Git Commands

```bash
# 1. Initialize git (if not done)
git init

# 2. Add all files (respects .gitignore)
git add .

# 3. Create initial commit
git commit -m "Initial commit: AI Resume Screener application"

# 4. Create repository on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-resume-screener.git
git branch -M main
git push -u origin main
```

### Option 3: Using GitHub Desktop

1. Download GitHub Desktop
2. File → Add Local Repository
3. Select the `ai-resume-screener` folder
4. Click "Publish repository"
5. Choose name and visibility
6. Click "Publish repository"

## 📝 What Will Be Uploaded

✅ **Included:**
- All source code
- Configuration files (.env.example)
- Documentation (README.md, etc.)
- Package files (package.json, requirements.txt)
- Prisma schema

❌ **Excluded (via .gitignore):**
- `.env` files (sensitive credentials)
- `node_modules/` (dependencies)
- `venv/` (Python virtual environment)
- `uploads/` (user-uploaded files)
- Database files
- IDE settings
- Log files

## 🔒 Security Reminders

After uploading:

1. **Never commit `.env` files** - They contain secrets
2. **Add environment variables to GitHub Secrets** (for CI/CD):
   - Go to repository → Settings → Secrets and variables → Actions
   - Add: DATABASE_URL, JWT_SECRET, RABBITMQ_URL, REDIS_URL
3. **Update README.md** with your actual repository URL
4. **Consider adding a LICENSE file**

## 📋 Post-Upload Checklist

- [ ] Verify `.env` files are NOT in the repository
- [ ] Check that sensitive data is excluded
- [ ] Update README.md with correct repository URL
- [ ] Add a LICENSE file (MIT recommended)
- [ ] Set up GitHub Actions for CI/CD (optional)
- [ ] Add repository description and topics on GitHub

## 🎯 Repository Topics (for discoverability)

Add these topics on GitHub:
- `resume-screener`
- `ai`
- `nodejs`
- `react`
- `python`
- `machine-learning`
- `job-matching`
- `nlp`

