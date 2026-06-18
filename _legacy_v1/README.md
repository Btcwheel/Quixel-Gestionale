# 🚀 AI & SaaS Project Tracker

> **Comprehensive multi-client, multi-project management system with AI pool tracking and external integrations (GitHub, Supabase, Vercel)**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-blue.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [CLI Usage](#cli-usage)
- [External Integrations](#external-integrations)
- [AI Pool Management](#ai-pool-management)
- [Security](#security)
- [Development](#development)
- [Deployment](#deployment)

---

## ✨ Features

### 🏢 Multi-Client & Multi-Project Management
- **Client Management**: Track multiple clients with detailed information
- **Project Tracking**: Full project lifecycle management (planning → active → completed → archived)
- **Tagging & Metadata**: Flexible organization with tags and custom metadata
- **Cross-referenced Search**: Find projects across clients instantly

### 🤖 AI Pool Management
- **Multi-Provider Support**: OpenAI, Anthropic, Google Gemini, Mistral, Cohere, Groq, Together AI
- **Account Pooling**: 6-7 accounts per provider with load balancing
- **Credit Tracking**: Real-time credit monitoring with alerts
- **Smart Routing**: Automatic routing to best available account
- **Chat Logging**: Complete conversation history with ratings
- **Usage Analytics**: Detailed usage reports per account and provider

### 🔗 External Integrations
- **GitHub**: Repository sync, commit tracking, PR monitoring, webhook support
- **Supabase**: Project tracking, health monitoring, backup status
- **Vercel**: Deployment tracking, build status, preview URLs
- **Webhook Receivers**: Real-time updates from all providers
- **HMAC Verification**: Secure webhook signature validation

### 📊 Dashboard & Analytics
- **Real-time Statistics**: Live dashboard with key metrics
- **Activity Charts**: Visual representation of chats and deployments
- **Alert Management**: Severity-based alerting system
- **Usage Reports**: AI usage by provider, cost tracking
- **Recent Activity Feed**: Track all recent actions

### 🛡️ Security
- **JWT Authentication**: HTTP-only cookie-based auth
- **Encrypted Secrets**: Fernet symmetric encryption for API keys
- **Password Hashing**: bcrypt with salt
- **Webhook Verification**: HMAC signature validation
- **Rate Limiting**: Built-in rate limiting for API endpoints

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │Dashboard │  │ Projects │  │   AI Pool Mgmt   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓ HTTP/REST
┌─────────────────────────────────────────────────────┐
│              Backend (FastAPI)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │   CRUD   │  │    Webhooks      │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Async Workers (Celery)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  GitHub  │  │ Supabase │  │     Vercel       │  │
│  │  Sync    │  │   Sync   │  │     Sync         │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│               Database (PostgreSQL)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Clients │  │ Projects │  │  External Res.   │  │
│  │    +     │  │    +     │  │      +           │  │
│  │ AI Pool  │  │  Chats   │  │   Webhooks       │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.109+ (Python 3.11+)
- **ORM**: SQLModel / SQLAlchemy 2.0
- **Database**: PostgreSQL 15+ (JSONB, full-text search, triggers)
- **Task Queue**: Celery + Redis
- **Auth**: JWT + HTTP-only cookies + bcrypt
- **Secrets**: python-dotenv + cryptography.fernet
- **HTTP Client**: httpx + tenacity (retry/rate-limit)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui concepts
- **State**: React Query (TanStack Query)
- **Charts**: Recharts
- **HTTP**: Axios

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **API Docs**: OpenAPI 3.0 (auto-generated)
- **Testing**: pytest + pytest-asyncio
- **Code Quality**: black, ruff, mypy

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or use Docker)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Gestionale-Quixel
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DATABASE_URL
# - SECRET_KEY
# - ENCRYPTION_KEY
# - ADMIN_PASSWORD
```

### 3. Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 4. Initialize Admin User
```bash
# The admin user is created automatically on first run
# Default credentials: admin / admin123
# Change these in .env file!
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Alternative Docs**: http://localhost:8000/api/redoc

---

## 📚 API Documentation

Full API documentation is available at `/api/docs` when running the backend.

### Key Endpoints

#### Authentication
```
POST   /api/v1/auth/login           - Login and get access token
POST   /api/v1/auth/change-password - Change password
GET    /api/v1/auth/me              - Get current user info
POST   /api/v1/auth/init            - Initialize admin user
```

#### Clients
```
GET    /api/v1/clients/             - List clients (paginated)
POST   /api/v1/clients/             - Create client
GET    /api/v1/clients/{id}         - Get client details
PUT    /api/v1/clients/{id}         - Update client
DELETE /api/v1/clients/{id}         - Delete client
```

#### Projects
```
GET    /api/v1/projects/            - List projects
POST   /api/v1/projects/            - Create project
GET    /api/v1/projects/{id}        - Get project details
PUT    /api/v1/projects/{id}        - Update project
GET    /api/v1/projects/{id}/analytics - Get project analytics
```

#### AI Accounts
```
GET    /api/v1/ai-accounts/         - List AI accounts
POST   /api/v1/ai-accounts/         - Create AI account
PUT    /api/v1/ai-accounts/{id}     - Update AI account
POST   /api/v1/ai-accounts/{id}/credits - Update credits
GET    /api/v1/ai-accounts/{id}/usage-report - Usage report
```

#### External Resources
```
GET    /api/v1/resources/           - List resources
POST   /api/v1/resources/           - Create resource
POST   /api/v1/resources/sync       - Trigger sync
GET    /api/v1/resources/{id}/sync-logs - Get sync logs
```

#### Webhooks (No Auth Required)
```
POST   /webhooks/github             - GitHub webhook receiver
POST   /webhooks/supabase           - Supabase webhook receiver
POST   /webhooks/vercel             - Vercel webhook receiver
```

---

## 💻 CLI Usage

The CLI provides command-line access to common operations.

### Setup
```bash
cd cli
pip install -r requirements.txt
```

### Commands

#### Authentication
```bash
python main.py login -u admin -p admin123
# Output: Token: eyJ...
```

#### Sync Operations
```bash
# Trigger sync for all resources
python main.py sync --type all -t YOUR_TOKEN

# Sync specific resource
python main.py sync --resource-id RESOURCE_ID -t YOUR_TOKEN

# Check sync status
python main.py sync-status -r RESOURCE_ID -t YOUR_TOKEN
```

#### Alerts
```bash
# List unresolved alerts
python main.py alerts -t YOUR_TOKEN

# Resolve an alert
python main.py resolve-alert ALERT_ID -t YOUR_TOKEN
```

#### Export
```bash
# Export all projects to JSON
python main.py export projects -f json -o projects.json -t YOUR_TOKEN

# Export chat logs
python main.py export chat-logs -t YOUR_TOKEN
```

#### Health Check
```bash
python main.py health
# Output: ✅ API is healthy! Version: 1.0.0
```

#### Token Rotation
```bash
python main.py rotate-token ACCOUNT_ID -n NEW_API_KEY -t YOUR_TOKEN
```

#### Dashboard Stats
```bash
python main.py stats -t YOUR_TOKEN
# Output: 📊 Dashboard Statistics
# Total Clients: 5
# Active Projects: 12
# ...
```

---

## 🔗 External Integrations

### GitHub Integration

#### Setup
1. Create GitHub OAuth App or Personal Access Token
2. Add token via UI or API (will be encrypted)
3. Link repositories to projects
4. Configure webhooks in GitHub repo settings

#### Webhook Configuration
```
Payload URL: https://your-domain.com/webhooks/github
Content type: application/json
Secret: Your webhook secret from .env
Events: Push, Pull Requests
```

#### Features
- ✅ Automatic commit tracking
- ✅ Branch monitoring
- ✅ Pull request tracking
- ✅ Contributor statistics
- ✅ Activity scoring

### Supabase Integration

#### Setup
1. Generate Supabase Access Token
2. Add token via UI or API
3. Link projects by project reference
4. Configure webhooks (if available)

#### Features
- ✅ Project health monitoring
- ✅ Database backup tracking
- ✅ Organization linking
- ✅ Region tracking

### Vercel Integration

#### Setup
1. Generate Vercel Access Token
2. Add token via UI or API
3. Link deployments to projects
4. Configure webhooks

#### Features
- ✅ Deployment status tracking
- ✅ Build monitoring
- ✅ Preview URL tracking
- ✅ Target environment tracking (prod/preview/dev)

---

## 🤖 AI Pool Management

### Supported Providers
| Provider | Models | Status |
|----------|--------|--------|
| OpenAI | GPT-4, GPT-3.5-Turbo | ✅ |
| Anthropic | Claude 2, Claude Instant | ✅ |
| Google | Gemini Pro, Gemini Ultra | ✅ |
| Mistral | Mistral Large, Medium | ✅ |
| Cohere | Command, Command Light | ✅ |
| Groq | Mixtral, Llama 2 | ✅ |
| Together | Various open models | ✅ |

### Smart Routing
The system automatically routes requests to the best account based on:
1. **Priority**: Higher priority accounts get preference
2. **Available Credits**: Accounts with more credits are preferred
3. **Rate Limits**: Accounts are skipped if rate-limited
4. **Concurrent Requests**: Load balancing across accounts
5. **Model Match**: Ensures requested model is available

### Credit Tracking
- **Real-time Updates**: Credits updated after each request
- **Alerts**: Automatic alerts at 20% (warning) and 10% (critical)
- **Usage Reports**: Detailed reports by account and provider
- **Cost Attribution**: Track costs per project and conversation

### Chat Rating
Users can rate chat quality (1-5 stars):
- ⭐ Poor (1)
- ⭐⭐ Fair (2)
- ⭐⭐⭐ Good (3)
- ⭐⭐⭐⭐ Great (4)
- ⭐⭐⭐⭐⭐ Excellent (5)

Ratings are used to:
- Track AI account performance
- Inform routing decisions
- Generate usage reports

---

## 🛡️ Security

### Authentication
- **JWT Tokens**: Stateless authentication
- **HTTP-only Cookies**: Prevent XSS attacks
- **Password Hashing**: bcrypt with salt
- **Token Expiry**: Configurable (default 24 hours)
- **Refresh Tokens**: Automatic token refresh

### Secret Encryption
- **Fernet Symmetric Encryption**: All API keys encrypted at rest
- **Key Management**: Encryption keys from environment
- **In-memory Decryption**: Keys only decrypted during use
- **Token Rotation**: Support for rotating compromised keys

### Webhook Security
- **HMAC Signature Verification**: All webhooks verified
- **SHA-256 Hashing**: Industry-standard hashing
- **Replay Protection**: Timestamp validation
- **Payload Validation**: Strict schema validation

### Rate Limiting
- **Per-endpoint Limits**: Different limits per endpoint
- **Configurable**: Adjust via environment variables
- **Error Responses**: Clear 429 responses with retry info

---

## 🧪 Development

### Backend Development
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Run linter
ruff check .
black .

# Type checking
mypy app/
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Database Migrations
```bash
# Using Alembic (recommended for production)
cd backend
alembic init alembic
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## 🚀 Deployment

### Docker Compose (Production)
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Scale workers
docker-compose up -d --scale worker=3

# View logs
docker-compose logs -f --tail=100
```

### Environment Variables (Production)
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=<generate-with-secrets-token-hex-32>
ENCRYPTION_KEY=<generate-with-secrets-token-hex-32>
ADMIN_PASSWORD=<strong-password>

# External APIs
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_WEBHOOK_SECRET=...
SUPABASE_ACCESS_TOKEN=...
VERCEL_ACCESS_TOKEN=...

# CORS
CORS_ORIGINS=["https://your-domain.com"]
```

### Generate Secure Keys
```bash
# Python
python -c "import secrets; print(secrets.token_hex(32))"

# OpenSSL
openssl rand -hex 32
```

---

## 📊 Database Schema

### Core Tables
- `clients` - Client/companies
- `projects` - Projects linked to clients
- `external_resources` - GitHub, Supabase, Vercel mappings
- `sync_logs` - Sync operation audit trail

### AI Pool Tables
- `ai_accounts` - AI provider accounts with encrypted keys
- `project_ai_pool_assignments` - Project-to-account mappings
- `chat_logs` - Conversation history with ratings

### Integration Tables
- `webhook_events` - Received webhook events
- `alerts` - System alerts and notifications
- `api_keys` - Encrypted external API keys
- `admin_users` - Admin authentication

---

## 🤝 Contributing

This is a proprietary system. For feature requests or bug reports, contact the development team.

---

## 📄 License

Proprietary - All rights reserved.

---

## 🆘 Support

For issues or questions:
1. Check API documentation at `/api/docs`
2. Review this README
3. Check logs: `docker-compose logs -f`
4. Contact: admin@example.com

---

**Built with ❤️ using FastAPI, Next.js, and PostgreSQL**
