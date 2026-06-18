"""Enumeration types for the application."""

from enum import Enum


class AIProvider(str, Enum):
    """Supported AI providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MISTRAL = "mistral"
    COHERE = "cohere"
    GROQ = "groq"
    TOGETHER = "together"


class ProjectStatus(str, Enum):
    """Project lifecycle status."""
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


# ExternalResourceType replaced by ExternalAccountProvider


class SyncStatus(str, Enum):
    """Sync operation status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WebhookProvider(str, Enum):
    """Providers that send webhooks."""
    GITHUB = "github"
    SUPABASE = "supabase"
    VERCEL = "vercel"


class ChatRole(str, Enum):
    """Roles in chat conversations."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class RatingScore(int, Enum):
    """Rating scores for chat quality."""
    POOR = 1
    FAIR = 2
    GOOD = 3
    GREAT = 4
    EXCELLENT = 5


class AlertSeverity(str, Enum):
    """Alert severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(str, Enum):
    """Types of alerts."""
    CREDIT_LOW = "credit_low"
    SYNC_FAILED = "sync_failed"
    DEPLOY_FAILED = "deploy_failed"
    TOKEN_EXPIRY = "token_expiry"
    RATE_LIMIT = "rate_limit"


class DiscussionProvider(str, Enum):
    """AI providers for discussions."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MISTRAL = "mistral"
    CUSTOM = "custom"


class ExternalAccountProvider(str, Enum):
    """Supported external service providers for project accounts."""
    GITHUB = "github"
    SUPABASE = "supabase"
    VERCEL = "vercel"
    DOCKER_HUB = "docker_hub"
    CLOUDFLARE = "cloudflare"
    AWS = "aws"
    CUSTOM = "custom"


class TOTPStatus(str, Enum):
    """TOTP 2FA setup status."""
    DISABLED = "disabled"
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"


class PlanStatus(str, Enum):
    """Project plan lifecycle status."""
    DRAFT = "draft"
    GENERATED = "generated"
    APPROVED = "approved"
    ARCHIVED = "archived"


class DiscussionCategory(str, Enum):
    """Category for discussion extracted items."""
    INSIGHT = "insight"
    DECISION = "decision"
    ACTION_ITEM = "action_item"
    QUESTION = "question"
    CODE = "code"
    ARCHITECTURE = "architecture"
