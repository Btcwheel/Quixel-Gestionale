"""SQLModel database models with full relationships."""

from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlmodel import (
    SQLModel, Field, Relationship, Column, UniqueConstraint,
    String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey, Index
)
from sqlalchemy import func

from app.domain.enums import (
    AIProvider, ProjectStatus, ExternalResourceType, SyncStatus,
    WebhookProvider, ChatRole, RatingScore, AlertSeverity, AlertType
)


# ============================================
# Base Model with common fields
# ============================================
class BaseModel(SQLModel):
    """Base model with common fields for all models."""
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================
# Core Domain Models
# ============================================

class Client(BaseModel, table=True):
    """Client/Company model."""
    __tablename__ = "clients"
    
    name: str = Field(index=True, max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    website: Optional[str] = Field(default=None, max_length=500)
    contact_email: Optional[str] = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
    
    # Relationships
    projects: List["Project"] = Relationship(back_populates="client")
    
    class Config:
        json_schema_extra = {"example": {"name": "Acme Corp", "description": "Leading innovator"}}


class Project(BaseModel, table=True):
    """Project model - core entity linking clients to resources."""
    __tablename__ = "projects"
    
    name: str = Field(index=True, max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    status: ProjectStatus = Field(default=ProjectStatus.PLANNING, sa_column=Column(String(50)))
    client_id: str = Field(foreign_key="clients.id", index=True)
    start_date: Optional[datetime] = Field(default=None)
    end_date: Optional[datetime] = Field(default=None)
    budget: Optional[float] = Field(default=None, sa_column=Column(Float))
    tags: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))

    # Computed fields (updated by triggers/workers)
    last_sync_at: Optional[datetime] = Field(default=None)
    github_activity_score: float = Field(default=0.0, sa_column=Column(Float))
    vercel_deploy_count: int = Field(default=0, sa_column=Column(Integer))
    
    # Relationships
    client: Optional[Client] = Relationship(back_populates="projects")
    external_resources: List["ExternalResource"] = Relationship(back_populates="project")
    ai_pool_assignments: List["ProjectAIPoolAssignment"] = Relationship(back_populates="project")
    alerts: List["Alert"] = Relationship(back_populates="project")
    documents: List["ProjectDocument"] = Relationship(back_populates="project")
    
    class Config:
        json_schema_extra = {"example": {"name": "E-commerce Platform", "status": "active"}}


class ExternalResource(BaseModel, table=True):
    """External resource mapping (GitHub, Supabase, Vercel)."""
    __tablename__ = "external_resources"
    
    project_id: str = Field(foreign_key="projects.id", index=True)
    resource_type: ExternalResourceType = Field(sa_column=Column(String(50)))
    external_id: str = Field(index=True, max_length=255)  # repo_id, project_ref, deployment_id
    name: str = Field(max_length=255)
    url: str = Field(max_length=500)
    owner: Optional[str] = Field(default=None, max_length=255)  # org/user
    branch: Optional[str] = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
    last_sync_status: SyncStatus = Field(default=SyncStatus.PENDING, sa_column=Column(String(50)))
    last_sync_at: Optional[datetime] = Field(default=None)
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))
    
    # Provider-specific fields
    github_full_name: Optional[str] = Field(default=None, max_length=255)  # owner/repo
    supabase_region: Optional[str] = Field(default=None, max_length=50)
    vercel_target: Optional[str] = Field(default=None, max_length=50)  # production/preview/development

    # Relationships
    project: Optional[Project] = Relationship(back_populates="external_resources")
    sync_logs: List["SyncLog"] = Relationship(back_populates="resource")

    __table_args__ = (
        UniqueConstraint("external_id", "resource_type", name="uq_external_id_type"),
    )


class SyncLog(BaseModel, table=True):
    """Log of sync operations for auditing."""
    __tablename__ = "sync_logs"
    
    resource_id: str = Field(foreign_key="external_resources.id", index=True)
    provider: WebhookProvider = Field(sa_column=Column(String(50)))
    status: SyncStatus = Field(sa_column=Column(String(50)))
    action: str = Field(max_length=100)  # e.g., "push", "deploy", "backup"
    triggered_by: str = Field(default="manual", max_length=50)  # manual/webhook/scheduled
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)
    duration_seconds: Optional[int] = Field(default=None, sa_column=Column(Integer))
    error_message: Optional[str] = Field(default=None, sa_column=Column(Text))
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))
    
    # Relationships
    resource: Optional[ExternalResource] = Relationship(back_populates="sync_logs")


# ============================================
# AI Pool Models
# ============================================

class AIAccount(BaseModel, table=True):
    """AI provider account with credentials."""
    __tablename__ = "ai_accounts"
    
    provider: AIProvider = Field(sa_column=Column(String(50), index=True))
    account_name: str = Field(index=True, max_length=255)  # descriptive name
    api_key_encrypted: str = Field(sa_column=Column(Text))  # Fernet-encrypted
    model_name: str = Field(max_length=100)  # gpt-4, claude-2, etc.
    
    # Credit tracking
    total_credits: float = Field(default=0.0, sa_column=Column(Float))
    used_credits: float = Field(default=0.0, sa_column=Column(Float))
    remaining_credits: float = Field(default=0.0, sa_column=Column(Float))
    credit_limit_daily: Optional[float] = Field(default=None, sa_column=Column(Float))
    credits_reset_at: Optional[datetime] = Field(default=None)
    
    # Status & routing
    is_active: bool = Field(default=True)
    is_rate_limited: bool = Field(default=False)
    rate_limit_until: Optional[datetime] = Field(default=None)
    priority: int = Field(default=0, sa_column=Column(Integer))  # higher = more priority
    max_concurrent_requests: int = Field(default=5, sa_column=Column(Integer))
    current_concurrent_requests: int = Field(default=0, sa_column=Column(Integer))
    
    # Usage stats
    total_requests: int = Field(default=0, sa_column=Column(Integer))
    total_tokens_in: int = Field(default=0, sa_column=Column(Integer))
    total_tokens_out: int = Field(default=0, sa_column=Column(Integer))
    avg_response_time_ms: Optional[float] = Field(default=None, sa_column=Column(Float))
    last_used_at: Optional[datetime] = Field(default=None)
    
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))
    
    # Relationships
    chat_logs: List["ChatLog"] = Relationship(back_populates="account")
    pool_assignments: List["ProjectAIPoolAssignment"] = Relationship(back_populates="ai_account")


class ProjectAIPoolAssignment(BaseModel, table=True):
    """Many-to-many: Projects assigned to AI accounts."""
    __tablename__ = "project_ai_pool_assignments"
    
    project_id: str = Field(foreign_key="projects.id", index=True)
    ai_account_id: str = Field(foreign_key="ai_accounts.id", index=True)
    is_primary: bool = Field(default=False)  # primary account for routing
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = Field(default=None, max_length=255)
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))
    
    # Relationships
    project: Optional[Project] = Relationship(back_populates="ai_pool_assignments")
    ai_account: Optional[AIAccount] = Relationship(back_populates="pool_assignments")
    
    __table_args__ = (
        UniqueConstraint("project_id", "ai_account_id", name="uq_project_ai"),
    )


class ChatLog(BaseModel, table=True):
    """Chat conversation logs with AI accounts."""
    __tablename__ = "chat_logs"

    ai_account_id: str = Field(foreign_key="ai_accounts.id", index=True)
    project_id: Optional[str] = Field(default=None, foreign_key="projects.id", index=True)

    # Conversation
    role: ChatRole = Field(sa_column=Column(String(50)))
    content: str = Field(sa_column=Column(Text))
    tokens_used: int = Field(default=0, sa_column=Column(Integer))
    cost_credits: float = Field(default=0.0, sa_column=Column(Float))

    # Metadata
    conversation_id: Optional[str] = Field(default=None, index=True, max_length=255)
    message_index: int = Field(default=0, sa_column=Column(Integer))
    model_used: Optional[str] = Field(default=None, max_length=100)
    temperature: Optional[float] = Field(default=None)
    max_tokens: Optional[int] = Field(default=None)
    response_time_ms: Optional[int] = Field(default=None, sa_column=Column(Integer))

    # Rating & feedback
    rating: Optional[RatingScore] = Field(default=None, sa_column=Column(Integer))
    feedback: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Technical
    request_payload: Optional[dict] = Field(default=None, sa_column=Column("request_payload", JSON))
    response_payload: Optional[dict] = Field(default=None, sa_column=Column("response_payload", JSON))
    error_message: Optional[str] = Field(default=None, sa_column=Column(Text))

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), index=True)
    )

    # Relationships
    account: Optional[AIAccount] = Relationship(back_populates="chat_logs")


class ProjectDocument(BaseModel, table=True):
    """Project documents: PDR, MD files, specifications, prompts."""
    __tablename__ = "project_documents"

    project_id: Optional[str] = Field(default=None, foreign_key="projects.id", index=True)
    title: str = Field(max_length=255)
    document_type: str = Field(sa_column=Column(String(50)))  # pdr, markdown, specification, prompt, etc.
    file_extension: str = Field(max_length=10)  # .py, .md, .txt, etc.
    content: str = Field(sa_column=Column(Text))  # Document content stored in DB
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    version: str = Field(default="1.0.0", max_length=20)
    is_public: bool = Field(default=False)  # Whether document is publicly accessible
    created_by: Optional[str] = Field(default=None, max_length=255)

    # Relationships
    project: Optional[Project] = Relationship(back_populates="documents")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Project Requirements Document",
                "document_type": "pdr",
                "file_extension": ".py",
                "content": "# Content here..."
            }
        }


# ============================================
# Auth & Security Models
# ============================================

class AdminUser(BaseModel, table=True):
    """Admin user for authentication."""
    __tablename__ = "admin_users"
    
    username: str = Field(unique=True, index=True, max_length=100)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(sa_column=Column(Text))
    is_active: bool = Field(default=True)
    last_login_at: Optional[datetime] = Field(default=None)
    failed_login_attempts: int = Field(default=0, sa_column=Column(Integer))
    locked_until: Optional[datetime] = Field(default=None)
    
    class Config:
        json_schema_extra = {"example": {"username": "admin", "email": "admin@example.com"}}


class APIKey(BaseModel, table=True):
    """API keys for external service authentication."""
    __tablename__ = "api_keys"
    
    name: str = Field(max_length=255)
    key_encrypted: str = Field(sa_column=Column(Text))  # Fernet-encrypted
    provider: str = Field(index=True, max_length=100)  # github, supabase, vercel
    scopes: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    expires_at: Optional[datetime] = Field(default=None)
    is_active: bool = Field(default=True)
    last_rotated_at: Optional[datetime] = Field(default=None)
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))


# ============================================
# Alerts & Monitoring
# ============================================

class Alert(BaseModel, table=True):
    """System alerts and notifications."""
    __tablename__ = "alerts"
    
    project_id: Optional[str] = Field(default=None, foreign_key="projects.id", index=True)
    alert_type: AlertType = Field(sa_column=Column(String(50)))
    severity: AlertSeverity = Field(sa_column=Column(String(50)))
    title: str = Field(max_length=255)
    message: str = Field(sa_column=Column(Text))
    is_resolved: bool = Field(default=False)
    resolved_at: Optional[datetime] = Field(default=None)
    resolved_by: Optional[str] = Field(default=None, max_length=255)
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))
    
    # Relationships
    project: Optional[Project] = Relationship(back_populates="alerts")
    
    class Config:
        json_schema_extra = {
            "example": {
                "alert_type": "credit_low",
                "severity": "high",
                "title": "AI Credits Running Low",
                "message": "Account OpenAI-1 has less than 10% credits remaining"
            }
        }


# ============================================
# Webhook & Integration Models
# ============================================

class WebhookEvent(BaseModel, table=True):
    """Received webhook events for auditing."""
    __tablename__ = "webhook_events"
    
    provider: WebhookProvider = Field(sa_column=Column(String(50), index=True))
    event_type: str = Field(index=True, max_length=100)
    external_id: str = Field(max_length=255)  # ID from provider
    payload: dict = Field(sa_column=Column(JSON))
    signature: Optional[str] = Field(default=None, max_length=500)
    is_verified: bool = Field(default=False)
    processed: bool = Field(default=False)
    processed_at: Optional[datetime] = Field(default=None)
    error_message: Optional[str] = Field(default=None, sa_column=Column(Text))
    received_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), index=True)
    )
    
    class Config:
        json_schema_extra = {"example": {"provider": "github", "event_type": "push"}}


# ============================================
# Full-text search index table (PostgreSQL)
# ============================================

class SearchIndex(BaseModel, table=True):
    """Full-text search index for cross-entity search."""
    __tablename__ = "search_index"

    entity_type: str = Field(index=True, max_length=50)  # client, project, resource, etc.
    entity_id: str = Field(index=True, max_length=255)
    search_vector: Optional[str] = Field(default=None, sa_column=Column(Text))  # PostgreSQL tsvector
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))
