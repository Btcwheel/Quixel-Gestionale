"""FastAPI application main entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.infrastructure.database.session import create_db_and_tables, seed_default_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup: Create database tables and seed default data
    if settings.DEBUG:
        create_db_and_tables()
        seed_default_data()
        print("[OK] Database tables created")
    
    yield
    
    # Shutdown: Clean up resources
    print("[BYE] Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI & SaaS Project Tracker - Comprehensive multi-client, multi-project management with AI pool tracking and external integrations",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.vercel.app"]
)


# Include routers
from app.presentation.api.auth import router as auth_router
from app.presentation.api.clients import router as clients_router
from app.presentation.api.projects import router as projects_router
from app.presentation.api.ai_accounts import router as ai_accounts_router
from app.presentation.api.chat_logs import router as chat_logs_router
from app.presentation.api.documents import router as documents_router
from app.presentation.api.external_resources import router as external_resources_router
from app.presentation.api.api_keys import router as api_keys_router
from app.presentation.api.webhook_events import router as webhook_events_router
from app.presentation.api.alerts import router as alerts_router
from app.presentation.api.dashboard import router as dashboard_router
from app.presentation.webhooks.github_webhook import router as github_webhook_router
from app.presentation.webhooks.supabase_webhook import router as supabase_webhook_router
from app.presentation.webhooks.vercel_webhook import router as vercel_webhook_router

app.include_router(auth_router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(clients_router, prefix=f"{settings.API_PREFIX}/clients", tags=["Clients"])
app.include_router(projects_router, prefix=f"{settings.API_PREFIX}/projects", tags=["Projects"])
app.include_router(ai_accounts_router, prefix=f"{settings.API_PREFIX}/ai-accounts", tags=["AI Accounts"])
app.include_router(chat_logs_router, prefix=f"{settings.API_PREFIX}/chat-logs", tags=["Chat Logs"])
app.include_router(documents_router, prefix=f"{settings.API_PREFIX}/documents", tags=["Documents"])
app.include_router(external_resources_router, prefix=f"{settings.API_PREFIX}/resources", tags=["External Resources"])
app.include_router(api_keys_router, prefix=f"{settings.API_PREFIX}/api-keys", tags=["API Keys"])
app.include_router(webhook_events_router, prefix=f"{settings.API_PREFIX}/webhook-events", tags=["Webhook Events"])
app.include_router(alerts_router, prefix=f"{settings.API_PREFIX}/alerts", tags=["Alerts"])
app.include_router(dashboard_router, prefix=f"{settings.API_PREFIX}/dashboard", tags=["Dashboard"])

# Webhook routes (no auth required, signature verification instead)
app.include_router(github_webhook_router, prefix="/webhooks/github", tags=["Webhooks"])
app.include_router(supabase_webhook_router, prefix="/webhooks/supabase", tags=["Webhooks"])
app.include_router(vercel_webhook_router, prefix="/webhooks/vercel", tags=["Webhooks"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/health"
    }
