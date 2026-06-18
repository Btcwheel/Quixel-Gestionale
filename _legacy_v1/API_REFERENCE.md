# 📡 API Reference

Complete API reference for AI & SaaS Project Tracker

**Base URL**: `http://localhost:8000/api/v1`  
**Auth**: Bearer token in `Authorization` header  
**Content-Type**: `application/json` (except login)

---

## 🔐 Authentication

### Login
```http
POST /api/v1/auth/login
Content-Type: multipart/form-data

username: admin
password: admin123

Response 200:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "username": "admin",
  "email": "admin@example.com",
  "is_active": true,
  "last_login_at": "2026-04-12T10:00:00",
  "created_at": "2026-04-12T09:00:00"
}
```

### Change Password
```http
POST /api/v1/auth/change-password
Authorization: Bearer <token>

{
  "current_password": "admin123",
  "new_password": "new_secure_password"
}

Response 200:
{
  "status": "success",
  "message": "Password changed successfully"
}
```

### Initialize Admin
```http
POST /api/v1/auth/init

Response 200:
{
  "message": "Admin user created",
  "created": true,
  "user_id": "uuid"
}
```

---

## 👥 Clients

### List Clients
```http
GET /api/v1/clients/?page=1&page_size=20&is_active=true&sort_by=name&sort_order=asc

Response 200:
{
  "items": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "description": "Leading innovator",
      "website": "https://acme.com",
      "contact_email": "contact@acme.com",
      "is_active": true,
      "created_at": "2026-04-12T10:00:00",
      "updated_at": "2026-04-12T10:00:00",
      "project_count": 5
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

### Create Client
```http
POST /api/v1/clients/
Authorization: Bearer <token>

{
  "name": "New Client",
  "description": "Client description",
  "website": "https://newclient.com",
  "contact_email": "info@newclient.com",
  "is_active": true
}

Response 200: Client object
```

### Get Client
```http
GET /api/v1/clients/{client_id}
Authorization: Bearer <token>

Response 200: Client object with project_count
```

### Update Client
```http
PUT /api/v1/clients/{client_id}
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "website": "https://updated.com"
}

Response 200: Updated Client object
```

### Delete Client
```http
DELETE /api/v1/clients/{client_id}
Authorization: Bearer <token>

Response 200:
{
  "status": "success",
  "message": "Client deleted successfully"
}
```

---

## 📁 Projects

### List Projects
```http
GET /api/v1/projects/?page=1&page_size=20&client_id=uuid&status=active

Response 200:
{
  "items": [Project objects with client_name and external_resource_count],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

### Create Project
```http
POST /api/v1/projects/
Authorization: Bearer <token>

{
  "name": "E-commerce Platform",
  "description": "Modern e-commerce site",
  "status": "active",
  "client_id": "client-uuid",
  "start_date": "2026-04-01T00:00:00",
  "end_date": "2026-12-31T00:00:00",
  "budget": 50000.0,
  "tags": ["ecommerce", "react", "nextjs"],
  "metadata": {"priority": "high"}
}

Response 200: Project object
```

### Get Project
```http
GET /api/v1/projects/{project_id}

Response 200: Project with client_name and external_resource_count
```

### Update Project
```http
PUT /api/v1/projects/{project_id}
Authorization: Bearer <token>

{
  "status": "completed",
  "end_date": "2026-12-31T00:00:00"
}

Response 200: Updated Project
```

### Get Project Analytics
```http
GET /api/v1/projects/{project_id}/analytics?days=30

Response 200:
{
  "project_id": "uuid",
  "project_name": "E-commerce Platform",
  "period_days": 30,
  "total_chats": 150,
  "total_tokens_used": 45000,
  "total_cost_credits": 125.50,
  "avg_chat_rating": 4.2,
  "github_activity_score": 85.5,
  "vercel_deploy_count": 12,
  "last_sync_at": "2026-04-12T10:00:00"
}
```

---

## 🤖 AI Accounts

### List AI Accounts
```http
GET /api/v1/ai-accounts/?page=1&page_size=20&provider=openai&is_active=true

Response 200:
{
  "items": [AIAccount objects (NO api_key)],
  "total": 7,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

### Create AI Account
```http
POST /api/v1/ai-accounts/
Authorization: Bearer <token>

{
  "provider": "openai",
  "account_name": "OpenAI Production 1",
  "api_key": "sk-...",  # Will be encrypted
  "model_name": "gpt-4",
  "total_credits": 1000.0,
  "credit_limit_daily": 100.0,
  "priority": 10,
  "max_concurrent_requests": 10,
  "metadata": {"team": "backend"}
}

Response 200: AIAccount object
```

### Update AI Account
```http
PUT /api/v1/ai-accounts/{account_id}
Authorization: Bearer <token>

{
  "account_name": "Updated Name",
  "priority": 5,
  "is_active": true
}

Response 200: Updated AIAccount
```

### Update AI Credits
```http
POST /api/v1/ai-accounts/{account_id}/credits
Authorization: Bearer <token>

{
  "used_credits": 2.5,
  "tokens_in": 1000,
  "tokens_out": 500,
  "cost_credits": 2.5,
  "response_time_ms": 350
}

Response 200: Updated AIAccount with new credit balance
```

### Get Usage Report
```http
GET /api/v1/ai-accounts/{account_id}/usage-report?days=30

Response 200:
{
  "account_id": "uuid",
  "account_name": "OpenAI Production 1",
  "provider": "openai",
  "period_days": 30,
  "total_requests": 450,
  "total_tokens_in": 250000,
  "total_tokens_out": 180000,
  "total_cost_credits": 125.50,
  "avg_response_time_ms": 350.5,
  "chats_by_rating": {"5": 200, "4": 150, "3": 80, "2": 15, "1": 5}
}
```

---

## 💬 Chat Logs

### List Chat Logs
```http
GET /api/v1/chat-logs/?page=1&page_size=20&ai_account_id=uuid&project_id=uuid&role=user

Response 200:
{
  "items": [ChatLog objects],
  "total": 1500,
  "page": 1,
  "page_size": 20,
  "total_pages": 75
}
```

### Create Chat Log
```http
POST /api/v1/chat-logs/
Authorization: Bearer <token>

{
  "ai_account_id": "account-uuid",
  "project_id": "project-uuid",
  "role": "user",
  "content": "Hello, how are you?",
  "tokens_used": 50,
  "cost_credits": 0.5,
  "conversation_id": "conv-uuid",
  "message_index": 0,
  "model_used": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 1000
}

Response 200: ChatLog object
```

### Update Chat Rating
```http
PUT /api/v1/chat-logs/{chat_id}/rating
Authorization: Bearer <token>

{
  "rating": 5,
  "feedback": "Excellent response!"
}

Response 200: Updated ChatLog with rating
```

### Get Conversation
```http
GET /api/v1/chat-logs/conversation/{conversation_id}

Response 200:
{
  "conversation_id": "conv-uuid",
  "messages": [ChatLog objects in order],
  "total_tokens": 5000,
  "total_cost": 15.5,
  "avg_rating": 4.5
}
```

---

## 🔗 External Resources

### List Resources
```http
GET /api/v1/resources/?page=1&page_size=20&project_id=uuid&resource_type=github_repo

Response 200:
{
  "items": [ExternalResource objects],
  "total": 25,
  "page": 1,
  "page_size": 20,
  "total_pages": 2
}
```

### Create Resource
```http
POST /api/v1/resources/
Authorization: Bearer <token>

{
  "project_id": "project-uuid",
  "resource_type": "github_repo",
  "external_id": "123456789",
  "name": "my-backend-api",
  "url": "https://github.com/user/repo",
  "owner": "user",
  "branch": "main",
  "github_full_name": "user/my-backend-api",
  "metadata": {"language": "python"}
}

Response 200: ExternalResource object
```

### Update Resource
```http
PUT /api/v1/resources/{resource_id}
Authorization: Bearer <token>

{
  "branch": "develop",
  "is_active": true
}

Response 200: Updated ExternalResource
```

### Trigger Sync
```http
POST /api/v1/resources/sync
Authorization: Bearer <token>

{
  "resource_id": "resource-uuid",  # Optional
  "project_id": "project-uuid",     # Optional
  "sync_type": "github"             # github, supabase, vercel, all
}

Response 200:
{
  "status": "success",
  "message": "Sync task queued (implement with Celery worker)"
}
```

### Get Sync Logs
```http
GET /api/v1/resources/{resource_id}/sync-logs?page=1&page_size=20

Response 200:
{
  "items": [SyncLog objects],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

---

## 🚨 Alerts

### List Alerts
```http
GET /api/v1/alerts/?page=1&page_size=20&severity=high&is_resolved=false

Response 200:
{
  "items": [Alert objects],
  "total": 15,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

### Create Alert
```http
POST /api/v1/alerts/
Authorization: Bearer <token>

{
  "project_id": "project-uuid",
  "alert_type": "credit_low",
  "severity": "high",
  "title": "Credits Running Low",
  "message": "Account has less than 20% credits",
  "metadata": {"account_id": "uuid"}
}

Response 200: Alert object
```

### Resolve Alert
```http
PUT /api/v1/alerts/{alert_id}/resolve
Authorization: Bearer <token>

{
  "is_resolved": true,
  "resolved_by": "admin"
}

Response 200: Updated Alert object with resolved_at and resolved_by
```

---

## 📊 Dashboard

### Get Dashboard Stats
```http
GET /api/v1/dashboard/stats

Response 200:
{
  "total_clients": 10,
  "active_clients": 8,
  "total_projects": 25,
  "active_projects": 15,
  "ai_accounts_active": 7,
  "total_ai_credits_remaining": 5432.10,
  "total_chats_today": 150,
  "total_deployments_today": 12,
  "unresolved_alerts": 5,
  "recent_sync_status": [SyncLog objects (last 10)]
}
```

### Projects by Status
```http
GET /api/v1/dashboard/projects-by-status

Response 200:
{
  "planning": 3,
  "active": 15,
  "on_hold": 2,
  "completed": 5
}
```

### AI Usage by Provider
```http
GET /api/v1/dashboard/ai-usage-by-provider?days=30

Response 200:
{
  "openai": {
    "total_requests": 500,
    "total_tokens_in": 300000,
    "total_tokens_out": 200000,
    "total_credits_used": 150.50,
    "account_count": 3
  },
  "anthropic": {...}
}
```

### Recent Activity
```http
GET /api/v1/dashboard/recent-activity?limit=50

Response 200:
{
  "projects": [recent projects],
  "chats": [recent chats],
  "syncs": [recent sync logs]
}
```

---

## 🌐 Webhooks (No Auth Required)

### GitHub Webhook
```http
POST /webhooks/github
X-GitHub-Event: push
X-Hub-Signature-256: sha256=...

{
  "ref": "refs/heads/main",
  "repository": {
    "full_name": "user/repo",
    "id": 123456789
  },
  "commits": [...],
  "pusher": {"name": "user"}
}

Response 200:
{
  "status": "ok",
  "event": "push"
}
```

### Supabase Webhook
```http
POST /webhooks/supabase
X-Supabase-Event: backup.completed

{
  "project_ref": "abc123",
  "status": "completed"
}

Response 200:
{
  "status": "ok",
  "event": "backup.completed"
}
```

### Vercel Webhook
```http
POST /webhooks/vercel
X-Vercel-Event: deployment.succeeded

{
  "deploymentId": "dep_123",
  "projectId": "proj_456",
  "url": "https://app.vercel.app"
}

Response 200:
{
  "status": "ok",
  "event": "deployment.succeeded"
}
```

---

## ❌ Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "code": "validation_error",
  "message": "Invalid input",
  "details": {
    "field_errors": {
      "name": "Field required"
    }
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

---

## 🔍 Query Parameters

All list endpoints support these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number (≥1) |
| `page_size` | int | 20 | Items per page (1-100) |
| `sort_by` | string | - | Field to sort by |
| `sort_order` | string | asc | Sort order: `asc` or `desc` |

Additional filters vary by endpoint (e.g., `is_active`, `status`, `provider`).

---

## 🔑 Authentication

All endpoints except:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/init`
- `GET /health`
- `GET /`
- `/webhooks/*`

require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Get a token by calling `/api/v1/auth/login` with your credentials.

---

## 📝 Notes

- All timestamps in ISO 8601 format
- UUIDs for all IDs
- Money values in float (consider decimal for production)
- Dates in UTC
- Empty arrays `[]` not null for lists
- Optional fields may be `null` or omitted

---

**For complete examples and usage, see the main README.md**
