"""Pydantic schemas for API requests and responses."""

from datetime import datetime
from typing import Optional, List, Generic, TypeVar
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from app.domain.enums import (
    AIProvider, ProjectStatus, ExternalResourceType, SyncStatus,
    WebhookProvider, ChatRole, RatingScore, AlertSeverity, AlertType
)

# Generic type for pagination
T = TypeVar("T")


# ============================================
# Common Schemas
# ============================================

class MessageResponse(BaseModel):
    """Standard message response."""
    status: str = "success"
    message: str


class ErrorResponse(BaseModel):
    """Standard error response."""
    status: str = "error"
    code: str
    message: str
    details: Optional[dict] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginationParams(BaseModel):
    """Common pagination parameters."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")


# ============================================
# Client Schemas
# ============================================

class ClientCreate(BaseModel):
    """Schema for creating a client."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    is_active: bool = True


class ClientUpdate(BaseModel):
    """Schema for updating a client."""
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class ClientResponse(BaseModel):
    """Client response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    description: Optional[str]
    website: Optional[str]
    contact_email: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    project_count: Optional[int] = None


# ============================================
# Project Schemas
# ============================================

class ProjectCreate(BaseModel):
    """Schema for creating a project."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    client_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    tags: Optional[List[str]] = None
    metadata: Optional[dict] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    tags: Optional[List[str]] = None
    metadata: Optional[dict] = None


class ProjectResponse(BaseModel):
    """Project response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    description: Optional[str]
    status: ProjectStatus
    client_id: str
    client_name: Optional[str] = None
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    budget: Optional[float]
    tags: Optional[List[str]]
    metadata: Optional[dict]
    last_sync_at: Optional[datetime]
    github_activity_score: float
    vercel_deploy_count: int
    created_at: datetime
    updated_at: datetime
    external_resource_count: Optional[int] = None


# ============================================
# External Resource Schemas
# ============================================

class ExternalResourceCreate(BaseModel):
    """Schema for creating an external resource."""
    project_id: str
    resource_type: ExternalResourceType
    external_id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=255)
    url: str = Field(..., max_length=500)
    owner: Optional[str] = None
    branch: Optional[str] = None
    metadata: Optional[dict] = None
    github_full_name: Optional[str] = None
    supabase_region: Optional[str] = None
    vercel_target: Optional[str] = None


class ExternalResourceUpdate(BaseModel):
    """Schema for updating an external resource."""
    name: Optional[str] = None
    branch: Optional[str] = None
    is_active: Optional[bool] = None
    metadata: Optional[dict] = None
    github_full_name: Optional[str] = None
    supabase_region: Optional[str] = None
    vercel_target: Optional[str] = None


class ExternalResourceResponse(BaseModel):
    """External resource response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    project_id: str
    resource_type: ExternalResourceType
    external_id: str
    name: str
    url: str
    owner: Optional[str]
    branch: Optional[str]
    is_active: bool
    last_sync_status: SyncStatus
    last_sync_at: Optional[datetime]
    github_full_name: Optional[str]
    supabase_region: Optional[str]
    vercel_target: Optional[str]
    metadata: Optional[dict]
    created_at: datetime
    updated_at: datetime


# ============================================
# AI Account Schemas
# ============================================

class AIAccountCreate(BaseModel):
    """Schema for creating an AI account."""
    provider: AIProvider
    account_name: str = Field(..., min_length=1, max_length=255)
    api_key: str = Field(..., min_length=1)  # Will be encrypted
    model_name: str = Field(..., max_length=100)
    total_credits: float = 0.0
    credit_limit_daily: Optional[float] = None
    priority: int = 0
    max_concurrent_requests: int = 5
    metadata: Optional[dict] = None


class AIAccountUpdate(BaseModel):
    """Schema for updating an AI account."""
    account_name: Optional[str] = None
    api_key: Optional[str] = None  # Will be encrypted
    model_name: Optional[str] = None
    total_credits: Optional[float] = None
    credit_limit_daily: Optional[float] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    max_concurrent_requests: Optional[int] = None
    metadata: Optional[dict] = None


class AIAccountResponse(BaseModel):
    """AI account response schema (NO API KEY)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    provider: AIProvider
    account_name: str
    model_name: str
    total_credits: float
    used_credits: float
    remaining_credits: float
    credit_limit_daily: Optional[float]
    is_active: bool
    is_rate_limited: bool
    rate_limit_until: Optional[datetime]
    priority: int
    total_requests: int
    total_tokens_in: int
    total_tokens_out: int
    avg_response_time_ms: Optional[float]
    last_used_at: Optional[datetime]
    metadata: Optional[dict]
    created_at: datetime
    updated_at: datetime


class AICreditUpdate(BaseModel):
    """Schema for updating AI credits."""
    used_credits: float
    tokens_in: int = 0
    tokens_out: int = 0
    cost_credits: float
    response_time_ms: Optional[int] = None


# ============================================
# Chat Log Schemas
# ============================================

class ChatLogCreate(BaseModel):
    """Schema for creating a chat log entry."""
    ai_account_id: str
    project_id: Optional[str] = None
    role: ChatRole
    content: str
    tokens_used: int = 0
    cost_credits: float = 0.0
    conversation_id: Optional[str] = None
    message_index: int = 0
    model_used: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    response_time_ms: Optional[int] = None
    request_payload: Optional[dict] = None
    response_payload: Optional[dict] = None
    error_message: Optional[str] = None


class ChatLogUpdate(BaseModel):
    """Schema for updating a chat log (rating)."""
    rating: Optional[RatingScore] = None
    feedback: Optional[str] = None


class ChatLogResponse(BaseModel):
    """Chat log response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    ai_account_id: str
    project_id: Optional[str]
    role: ChatRole
    content: str
    tokens_used: int
    cost_credits: float
    conversation_id: Optional[str]
    message_index: int
    model_used: Optional[str]
    temperature: Optional[float]
    response_time_ms: Optional[int]
    rating: Optional[RatingScore]
    feedback: Optional[str]
    created_at: datetime


class ChatConversationResponse(BaseModel):
    """Full conversation response."""
    conversation_id: str
    messages: List[ChatLogResponse]
    total_tokens: int
    total_cost: float
    avg_rating: Optional[float] = None


class PublicConversationResponse(BaseModel):
    """Public conversation response (for sharing links, no auth required)."""
    conversation_id: str
    title: Optional[str] = None
    messages: List[ChatLogResponse]
    total_messages: int
    created_at: Optional[datetime] = None


# ============================================
# Project Document Schemas
# ============================================

class ProjectDocumentCreate(BaseModel):
    """Schema for creating a project document."""
    project_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    document_type: str = Field(..., max_length=50)  # pdr, markdown, specification, prompt
    file_extension: str = Field(..., max_length=10)  # .py, .md, .txt
    content: str
    description: Optional[str] = None
    version: str = Field(default="1.0.0", max_length=20)
    is_public: bool = False
    created_by: Optional[str] = None


class ProjectDocumentUpdate(BaseModel):
    """Schema for updating a project document."""
    title: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    is_public: Optional[bool] = None


class ProjectDocumentResponse(BaseModel):
    """Project document response schema."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: Optional[str]
    title: str
    document_type: str
    file_extension: str
    content: str
    description: Optional[str]
    version: str
    is_public: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime


# ============================================
# AI Pool Assignment Schemas
# ============================================

class AIPoolAssignmentCreate(BaseModel):
    """Schema for assigning AI account to project."""
    project_id: str
    ai_account_id: str
    is_primary: bool = False
    assigned_by: Optional[str] = None


class AIPoolAssignmentResponse(BaseModel):
    """AI pool assignment response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    project_id: str
    ai_account_id: str
    is_primary: bool
    assigned_at: datetime
    assigned_by: Optional[str]
    ai_account: Optional[AIAccountResponse] = None


# ============================================
# Alert Schemas
# ============================================

class AlertCreate(BaseModel):
    """Schema for creating an alert."""
    project_id: Optional[str] = None
    alert_type: AlertType
    severity: AlertSeverity
    title: str = Field(..., max_length=255)
    message: str
    metadata: Optional[dict] = None


class AlertResponse(BaseModel):
    """Alert response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    project_id: Optional[str]
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    is_resolved: bool
    resolved_at: Optional[datetime]
    resolved_by: Optional[str]
    metadata: Optional[dict]
    created_at: datetime
    updated_at: datetime


class AlertResolveUpdate(BaseModel):
    """Schema for resolving an alert."""
    is_resolved: bool = True
    resolved_by: Optional[str] = None


# ============================================
# Auth Schemas
# ============================================

class LoginRequest(BaseModel):
    """Login request schema."""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(BaseModel):
    """Token refresh response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class PasswordChange(BaseModel):
    """Password change schema."""
    current_password: str
    new_password: str = Field(..., min_length=8)


# ============================================
# Sync & Webhook Schemas
# ============================================

class SyncTriggerRequest(BaseModel):
    """Schema for triggering manual sync."""
    resource_id: Optional[str] = None
    project_id: Optional[str] = None
    sync_type: Optional[str] = None  # github, supabase, vercel, all


class SyncLogResponse(BaseModel):
    """Sync log response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resource_id: str
    provider: WebhookProvider
    status: SyncStatus
    action: str
    triggered_by: str
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]
    error_message: Optional[str]
    metadata: Optional[dict]


class WebhookResponse(BaseModel):
    """Webhook event response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    provider: WebhookProvider
    event_type: str
    external_id: str
    is_verified: bool
    processed: bool
    received_at: datetime


# ============================================
# Dashboard & Analytics Schemas
# ============================================

class DashboardStats(BaseModel):
    """Dashboard statistics response."""
    total_clients: int
    active_projects: int
    total_projects: int
    ai_accounts_active: int
    total_ai_credits_remaining: float
    total_chats_today: int
    total_deployments_today: int
    unresolved_alerts: int
    recent_sync_status: List[SyncLogResponse] = []


class ProjectAnalytics(BaseModel):
    """Project-level analytics."""
    project_id: str
    project_name: str
    total_chats: int
    total_tokens_used: int
    total_cost_credits: float
    avg_chat_rating: Optional[float]
    github_commits_last_7d: int
    vercel_deployments_count: int
    last_activity_at: Optional[datetime]


class AIUsageReport(BaseModel):
    """AI usage report for an account."""
    account_id: str
    account_name: str
    provider: AIProvider
    period_start: datetime
    period_end: datetime
    total_requests: int
    total_tokens_in: int
    total_tokens_out: int
    total_cost_credits: float
    avg_response_time_ms: Optional[float]
    chats_by_rating: dict


# ============================================
# Export Schemas
# ============================================

class ExportRequest(BaseModel):
    """Schema for data export."""
    export_type: str  # clients, projects, ai_accounts, chat_logs, all
    format: str = "json"  # json, csv
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    include_metadata: bool = True
