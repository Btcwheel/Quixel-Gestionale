# 🚀 Quick Start Guide

Get AI & SaaS Project Tracker running in 5 minutes!

## Prerequisites
- Docker & Docker Compose installed
- OR Python 3.11+ and Node.js 18+

## Option 1: Docker Compose (Recommended)

```bash
# 1. Clone and navigate
cd Gestionale-Quixel

# 2. Setup environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 3. Start everything
docker-compose up -d

# 4. Wait for services (30 seconds)
docker-compose ps

# 5. Access application
# Frontend: http://localhost:3000
# Backend: http://localho
st:8000
# API Docs: http://localhost:8000/api/docs

# Login: admin / admin123
```

## Option 2: Manual Setup

### Backend
```bash
cd backend

# Create venv
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install deps
pip install -r requirements.txt

# Copy env
cp ../.env.example .env

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend

# Install deps
npm install

# Copy env
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run dev server
npm run dev
```

### Database
```bash
# PostgreSQL must be running
# Tables are created automatically in DEBUG mode
```

## First Steps

### 1. Login
- Go to http://localhost:3000
- Username: `admin`
- Password: `admin123`

### 2. Add a Client
```bash
# Via UI: Clients → New Client
# Or API:
curl -X POST http://localhost:8000/api/v1/clients/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "description": "Test client"}'
```

### 3. Create a Project
```bash
# Via UI: Projects → New Project
# Link to client created above
```

### 4. Add AI Account
```bash
# Via UI: AI Pool → New Account
# Select provider (OpenAI, Anthropic, etc.)
# Enter API key (will be encrypted)
```

### 5. Link External Resources
```bash
# Via UI: Integrations → Add Resource
# Select type: GitHub Repo, Supabase Project, or Vercel Deployment
# Enter details and link to project
```

## CLI Quick Start

```bash
cd cli
pip install -r requirements.txt

# Login
python main.py login -u admin -p admin123

# Get stats
python main.py stats -t YOUR_TOKEN

# Trigger sync
python main.py sync --type all -t YOUR_TOKEN

# View alerts
python main.py alerts -t YOUR_TOKEN
```

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env
DATABASE_URL=postgresql://gestionale:secret@localhost:5432/gestionaledb
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml
# Or stop conflicting services
```

### Frontend Can't Connect to Backend
```bash
# Check backend is running
curl http://localhost:8000/health

# Check NEXT_PUBLIC_API_URL in frontend/.env.local
```

### Admin Login Fails
```bash
# Check admin was created
docker-compose logs backend | grep "Admin user"

# Or manually create via database
```

## Next Steps

1. 📖 Read full [README.md](README.md)
2. 🔗 Configure external integrations
3. 🤖 Add AI provider accounts
4. 📊 Explore dashboard analytics
5. 🛡️ Change default admin password!

---

**Need help?** Check [README.md](README.md) or contact support.
