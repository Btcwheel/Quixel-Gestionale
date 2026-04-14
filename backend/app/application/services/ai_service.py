"""AI Account and Pool service for business logic."""

from typing import Optional, List
from datetime import datetime, timedelta
from sqlmodel import Session, select, func

from app.application.services.base import BaseService
from app.domain.models import AIAccount, ChatLog, ProjectAIPoolAssignment
from app.domain.schemas import AIAccountCreate, AIAccountUpdate, AICreditUpdate
from app.infrastructure.security.auth import encrypt_secret, decrypt_secret
from app.domain.enums import AIProvider, ChatRole


class AIAccountService(BaseService[AIAccount, AIAccountCreate, AIAccountUpdate]):
    """Service for AI Account operations."""
    
    def __init__(self, db: Session):
        super().__init__(AIAccount, db)
    
    def create(self, obj_in: AIAccountCreate) -> AIAccount:
        """Create a new AI account with encrypted API key."""
        # Encrypt the API key before storing
        encrypted_key = encrypt_secret(obj_in.api_key)
        
        # Create account without the plain api_key field
        account_data = obj_in.model_dump(exclude={"api_key"})
        account = AIAccount(**account_data, api_key_encrypted=encrypted_key)
        
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account
    
    def get_api_key(self, id: str) -> Optional[str]:
        """Get decrypted API key for an account."""
        account = self.get_by_id(id)
        if not account:
            return None
        return decrypt_secret(account.api_key_encrypted)
    
    def update_credits(self, account_id: str, credit_data: AICreditUpdate) -> Optional[AIAccount]:
        """Update account credits after a chat request."""
        account = self.get_by_id(account_id)
        if not account:
            return None
        
        account.used_credits += credit_data.cost_credits
        account.remaining_credits = account.total_credits - account.used_credits
        account.total_requests += 1
        account.total_tokens_in += credit_data.tokens_in
        account.total_tokens_out += credit_data.tokens_out
        account.last_used_at = datetime.utcnow()
        
        if credit_data.response_time_ms and account.avg_response_time_ms:
            # Update running average
            account.avg_response_time_ms = (
                (account.avg_response_time_ms * (account.total_requests - 1) + credit_data.response_time_ms)
                / account.total_requests
            )
        elif credit_data.response_time_ms:
            account.avg_response_time_ms = float(credit_data.response_time_ms)
        
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account
    
    def get_best_account(
        self,
        provider: Optional[AIProvider] = None,
        model_name: Optional[str] = None
    ) -> Optional[AIAccount]:
        """Get the best available AI account based on priority and availability."""
        query = select(AIAccount).where(
            AIAccount.is_active == True,
            AIAccount.is_rate_limited == False,
            AIAccount.remaining_credits > 0,
            AIAccount.current_concurrent_requests < AIAccount.max_concurrent_requests
        )
        
        if provider:
            query = query.where(AIAccount.provider == provider)
        
        if model_name:
            query = query.where(AIAccount.model_name == model_name)
        
        # Order by priority (descending), then by remaining credits (descending)
        query = query.order_by(
            AIAccount.priority.desc(),
            AIAccount.remaining_credits.desc()
        )
        
        return self.db.exec(query).first()
    
    def get_usage_report(self, account_id: str, days: int = 30) -> Optional[dict]:
        """Get usage report for an AI account."""
        account = self.get_by_id(account_id)
        if not account:
            return None
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get chat logs for the period
        chats = self.db.exec(
            select(ChatLog).where(
                ChatLog.ai_account_id == account_id,
                ChatLog.created_at >= cutoff_date
            )
        ).all()
        
        total_requests = len(chats)
        total_tokens_in = sum(chat.tokens_used for chat in chats if chat.role == ChatRole.USER)
        total_tokens_out = sum(chat.tokens_used for chat in chats if chat.role == ChatRole.ASSISTANT)
        total_cost = sum(chat.cost_credits for chat in chats)
        
        # Rating distribution
        ratings = {}
        for chat in chats:
            if chat.rating:
                rating_key = str(chat.rating)
                ratings[rating_key] = ratings.get(rating_key, 0) + 1
        
        avg_response_time = (
            sum(chat.response_time_ms for chat in chats if chat.response_time_ms) / total_requests
            if total_requests > 0
            else None
        )
        
        return {
            "account_id": account_id,
            "account_name": account.account_name,
            "provider": account.provider,
            "period_days": days,
            "total_requests": total_requests,
            "total_tokens_in": total_tokens_in,
            "total_tokens_out": total_tokens_out,
            "total_cost_credits": total_cost,
            "avg_response_time_ms": avg_response_time,
            "chats_by_rating": ratings
        }
    
    def rotate_api_key(self, account_id: str, new_api_key: str) -> Optional[AIAccount]:
        """Rotate the API key for an account."""
        account = self.get_by_id(account_id)
        if not account:
            return None
        
        account.api_key_encrypted = encrypt_secret(new_api_key)
        account.last_rotated_at = datetime.utcnow()
        
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account


class AIPoolAssignmentService(BaseService[ProjectAIPoolAssignment, dict, dict]):
    """Service for AI pool assignments."""
    
    def __init__(self, db: Session):
        super().__init__(ProjectAIPoolAssignment, db)
    
    def get_project_accounts(self, project_id: str) -> List[AIAccount]:
        """Get all AI accounts assigned to a project."""
        assignments = self.db.exec(
            select(AIAccount)
            .join(ProjectAIPoolAssignment, AIAccount.id == ProjectAIPoolAssignment.ai_account_id)
            .where(ProjectAIPoolAssignment.project_id == project_id)
        ).all()
        return assignments
    
    def get_primary_account(self, project_id: str) -> Optional[AIAccount]:
        """Get the primary AI account for a project."""
        assignment = self.db.exec(
            select(AIAccount)
            .join(ProjectAIPoolAssignment, AIAccount.id == ProjectAIPoolAssignment.ai_account_id)
            .where(
                ProjectAIPoolAssignment.project_id == project_id,
                ProjectAIPoolAssignment.is_primary == True
            )
        ).first()
        return assignment
