"""Project context service for recovering project state."""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlmodel import Session, select, func

from app.domain.models import (
    Project, ProjectDiscussion, ChatLog, ProjectPlan, 
    ExternalAccount, AIAccount, CredentialVault
)
from app.domain.schemas import (
    ProjectDiscussionResponse, ChatLogResponse, 
    ProjectPlanResponse, ExternalAccountResponse,
    AIAccountResponse
)


class ContextService:
    """Service for recovering and providing project context."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_project_context(self, project_id: str) -> dict:
        """Get comprehensive context for a project."""
        # Verify project exists
        project = self.db.get(Project, project_id)
        if not project:
            raise ValueError("Project not found")
        
        # Get current plan (latest approved or generated)
        current_plan = self.db.exec(
            select(ProjectPlan)
            .where(ProjectPlan.project_id == project_id)
            .order_by(ProjectPlan.created_at.desc())
        ).first()
        
        # Get recent discussions (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        recent_discussions = self.db.exec(
            select(ProjectDiscussion)
            .where(ProjectDiscussion.project_id == project_id)
            .where(ProjectDiscussion.created_at >= week_ago)
            .order_by(ProjectDiscussion.created_at.desc())
            .limit(10)
        ).all()
        
        # Get recent chats (last 7 days)
        recent_chats = self.db.exec(
            select(ChatLog)
            .where(ChatLog.project_id == project_id)
            .where(ChatLog.created_at >= week_ago)
            .order_by(ChatLog.created_at.desc())
            .limit(10)
        ).all()
        
        # Get key decisions (discussions with decisions and high priority)
        key_decisions = self.db.exec(
            select(ProjectDiscussion)
            .where(ProjectDiscussion.project_id == project_id)
            .where(ProjectDiscussion.decisions.is_not(None))
            .where(ProjectDiscussion.priority >= 2)
            .order_by(ProjectDiscussion.priority.desc())
            .limit(5)
        ).all()
        
        # Get action items (discussions with action items)
        action_items = self.db.exec(
            select(ProjectDiscussion)
            .where(ProjectDiscussion.project_id == project_id)
            .where(ProjectDiscussion.action_items.is_not(None))
            .order_by(ProjectDiscussion.priority.desc())
            .limit(10)
        ).all()
        
        # Get external accounts
        external_accounts = self.db.exec(
            select(ExternalAccount)
            .where(ExternalAccount.project_id == project_id)
            .where(ExternalAccount.is_active == True)
        ).all()
        
        # Get AI accounts used
        ai_accounts_used = self.db.exec(
            select(AIAccount)
            .join(ProjectDiscussion, AIAccount.provider == ProjectDiscussion.provider)
            .where(ProjectDiscussion.project_id == project_id)
            .distinct()
        ).all()
        
        return {
            "project_id": project_id,
            "project_name": project.name,
            "current_plan": ProjectPlanResponse.model_validate(current_plan) if current_plan else None,
            "recent_discussions": [ProjectDiscussionResponse.model_validate(d) for d in recent_discussions],
            "recent_chats": [ChatLogResponse.model_validate(c) for c in recent_chats],
            "key_decisions": [d.decisions for d in key_decisions if d.decisions],
            "action_items": [a.action_items for a in action_items if a.action_items],
            "external_accounts": [ExternalAccountResponse.model_validate(acc) for acc in external_accounts],
            "ai_accounts_used": [AIAccountResponse.model_validate(ai) for ai in ai_accounts_used],
            "obsidian_notes": []  # Placeholder - would integrate with Obsidian MCP
        }
    
    def format_context_for_llm(self, project_id: str) -> str:
        """Format project context as a prompt for LLM consumption."""
        context = self.get_project_context(project_id)
        
        lines = []
        lines.append(f"# Contesto Progetto: {context['project_name']}\n")
        
        # Current plan
        if context["current_plan"]:
            lines.append("## Piano di Lavoro Corrente\n")
            lines.append(context["current_plan"].content)
            lines.append("\n---\n")
        
        # Key decisions
        if context["key_decisions"]:
            lines.append("## Decisioni Chiave\n")
            for decision in context["key_decisions"]:
                lines.append(f"- {decision}\n")
            lines.append("\n---\n")
        
        # Recent insights
        if context["recent_discussions"]:
            lines.append("## Discussioni Recenti\n")
            for discussion in context["recent_discussions"][:5]:  # Limit to 5
                if discussion.insights:
                    lines.append(f"### {discussion.title}\n")
                    lines.append(f"{discussion.insights}\n")
                    lines.append(f"*Fonte: {discussion.provider} - {discussion.model_used}*\n")
                    lines.append("\n---\n")
        
        # External accounts
        if context["external_accounts"]:
            lines.append("## Account Esterni Collegati\n")
            for account in context["external_accounts"]:
                lines.append(f"- {account.name} ({provider_names.get(account.provider, account.provider)})\n")
            lines.append("\n")
        
        return "\n".join(lines)