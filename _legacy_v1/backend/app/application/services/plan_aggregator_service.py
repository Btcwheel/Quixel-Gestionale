"""Project plan aggregation service for combining AI discussions into work plans."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlmodel import Session, select

from app.domain.models import ProjectDiscussion, ChatLog, ProjectPlan, Project
from app.domain.enums import DiscussionCategory, PlanStatus


class PlanAggregatorService:
    """Service for aggregating discussions and chats into project plans."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def aggregate_discussions(
        self,
        project_id: str,
        discussion_ids: Optional[List[str]] = None,
        title: Optional[str] = None
    ) -> ProjectPlan:
        """Aggregate discussions into a project plan."""
        # Verify project exists
        project = self.db.get(Project, project_id)
        if not project:
            raise ValueError("Project not found")
        
        # Get discussions to aggregate
        if discussion_ids:
            discussions = self.db.exec(
                select(ProjectDiscussion)
                .where(ProjectDiscussion.id.in_(discussion_ids))
                .where(ProjectDiscussion.project_id == project_id)
            ).all()
        else:
            # Get all discussions for project
            discussions = self.db.exec(
                select(ProjectDiscussion)
                .where(ProjectDiscussion.project_id == project_id)
            ).all()
        
        if not discussions:
            raise ValueError("No discussions found to aggregate")
        
        # Extract insights by category
        insights_by_category = self._categorize_insights(discussions)
        
        # Generate plan content
        plan_content = self._generate_plan_content(insights_by_category, discussions)
        
        # Generate title if not provided
        if not title:
            title = f"Piano Progetto {project.name} - {datetime.now().strftime('%Y-%m-%d')}"
        
        # Get source IDs
        source_discussion_ids = [d.id for d in discussions]
        source_chat_ids = []  # Could be extended to include chats
        
        # Create plan
        plan = ProjectPlan(
            project_id=project_id,
            version="1.0.0",
            status=PlanStatus.GENERATED,
            title=title,
            content=plan_content,
            source_discussion_ids=source_discussion_ids,
            source_chat_ids=source_chat_ids,
            generated_by="system"
        )
        
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        
        # Mark discussions as applied to plan
        for discussion in discussions:
            discussion.applied_to_plan = True
            self.db.add(discussion)
        self.db.commit()
        
        return plan
    
    def aggregate_chats(
        self,
        project_id: str,
        chat_ids: Optional[List[str]] = None,
        title: Optional[str] = None
    ) -> ProjectPlan:
        """Aggregate chat logs into a project plan."""
        # Verify project exists
        project = self.db.get(Project, project_id)
        if not project:
            raise ValueError("Project not found")
        
        # Get chats to aggregate
        if chat_ids:
            chats = self.db.exec(
                select(ChatLog)
                .where(ChatLog.id.in_(chat_ids))
                .where(ChatLog.project_id == project_id)
            ).all()
        else:
            # Get all chats for project
            chats = self.db.exec(
                select(ChatLog)
                .where(ChatLog.project_id == project_id)
            ).all()
        
        if not chats:
            raise ValueError("No chats found to aggregate")
        
        # Extract insights from chats
        insights_by_category = self._categorize_chat_insights(chats)
        
        # Generate plan content
        plan_content = self._generate_plan_content(insights_by_category, chats)
        
        # Generate title if not provided
        if not title:
            title = f"Piano Progetto {project.name} (da Chat) - {datetime.now().strftime('%Y-%m-%d')}"
        
        # Get source IDs
        source_discussion_ids = []  # Could include related discussions
        source_chat_ids = [c.id for c in chats]
        
        # Create plan
        plan = ProjectPlan(
            project_id=project_id,
            version="1.0.0",
            status=PlanStatus.GENERATED,
            title=title,
            content=plan_content,
            source_discussion_ids=source_discussion_ids,
            source_chat_ids=source_chat_ids,
            generated_by="system"
        )
        
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        
        return plan
    
    def _categorize_insights(self, discussions: List[ProjectDiscussion]) -> Dict[str, List[Dict[str, Any]]]:
        """Categorize insights from discussions."""
        categories = {
            "insights": [],
            "decisions": [],
            "action_items": [],
            "code_snippets": [],
            "questions": [],
            "architecture": []
        }
        
        for discussion in discussions:
            # Add insights
            if discussion.insights:
                categories["insights"].append({
                    "content": discussion.insights,
                    "source": discussion.title,
                    "provider": discussion.provider,
                    "model": discussion.model_used,
                    "priority": discussion.priority
                })
            
            # Add decisions
            if discussion.decisions:
                categories["decisions"].append({
                    "content": discussion.decisions,
                    "source": discussion.title,
                    "provider": discussion.provider,
                    "model": discussion.model_used,
                    "priority": discussion.priority
                })
            
            # Add action items
            if discussion.action_items:
                categories["action_items"].append({
                    "content": discussion.action_items,
                    "source": discussion.title,
                    "provider": discussion.provider,
                    "model": discussion.model_used,
                    "priority": discussion.priority
                })
            
            # Add code snippets
            if discussion.code_snippets:
                categories["code_snippets"].append({
                    "content": discussion.code_snippets,
                    "source": discussion.title,
                    "provider": discussion.provider,
                    "model": discussion.model_used,
                    "priority": discussion.priority
                })
        
        return categories
    
    def _categorize_chat_insights(self, chats: List[ChatLog]) -> Dict[str, List[Dict[str, Any]]]:
        """Categorize insights from chat logs (simplified)."""
        # For chats, we'll treat the entire content as potential insights
        # In a more sophisticated implementation, we'd use NLP to extract insights
        categories = {
            "insights": [],
            "decisions": [],
            "action_items": [],
            "code_snippets": [],
            "questions": [],
            "architecture": []
        }
        
        for chat in chats:
            # Simple heuristic: look for keywords
            content_lower = chat.content.lower()
            
            if any(word in content_lower for word in ["decision", "decidere", "decided", "concluso"]):
                categories["decisions"].append({
                    "content": chat.content[:500] + "..." if len(chat.content) > 500 else chat.content,
                    "source": f"Chat {chat.id}",
                    "provider": "chat",
                    "model": "unknown",
                    "priority": 1
                })
            elif any(word in content_lower for word in ["todo", "da fare", "action", "next step"]):
                categories["action_items"].append({
                    "content": chat.content[:500] + "..." if len(chat.content) > 500 else chat.content,
                    "source": f"Chat {chat.id}",
                    "provider": "chat",
                    "model": "unknown",
                    "priority": 1
                })
            elif any(word in content_lower for word in ["codice", "code", "function", "class", "```"]):
                categories["code_snippets"].append({
                    "content": chat.content[:500] + "..." if len(chat.content) > 500 else chat.content,
                    "source": f"Chat {chat.id}",
                    "provider": "chat",
                    "model": "unknown",
                    "priority": 1
                })
            else:
                categories["insights"].append({
                    "content": chat.content[:500] + "..." if len(chat.content) > 500 else chat.content,
                    "source": f"Chat {chat.id}",
                    "provider": "chat",
                    "model": "unknown",
                    "priority": 1
                })
        
        return categories
    
    def _generate_plan_content(
        self,
        insights_by_category: Dict[str, List[Dict[str, Any]]],
        sources: List[Any]
    ) -> str:
        """Generate markdown plan content from categorized insights."""
        lines = []
        
        lines.append("# Piano di Lavoro Aggregato\n")
        lines.append(f"*Generato automaticamente da {len(sources)} fonti di discussione*\n")
        
        # Insights section
        if insights_by_category["insights"]:
            lines.append("## 💡 Insight Chiave\n")
            for insight in insights_by_category["insights"]:
                lines.append(f"- {insight['content']}")
                lines.append(f"  *Fonte: {insight['source']} ({insight['provider']})*")
                lines.append("")
            lines.append("---\n")
        
        # Decisions section
        if insights_by_category["decisions"]:
            lines.append("## ✅ Decisioni Prese\n")
            for decision in insights_by_category["decisions"]:
                lines.append(f"- {decision['content']}")
                lines.append(f"  *Fonte: {decision['source']} ({decision['provider']})*")
                lines.append("")
            lines.append("---\n")
        
        # Action items section
        if insights_by_category["action_items"]:
            lines.append("## 📋 Azioni da Eseguire\n")
            for i, action in enumerate(insights_by_category["action_items"], 1):
                lines.append(f"{i}. {action['content']}")
                lines.append(f"  *Fonte: {action['source']} ({action['provider']})*")
                lines.append("")
            lines.append("---\n")
        
        # Code snippets section
        if insights_by_category["code_snippets"]:
            lines.append("## 💻 Snippet di Codice\n")
            for snippet in insights_by_category["code_snippets"]:
                lines.append(f"```\n{snippet['content']}\n```")
                lines.append(f"*Fonte: {snippet['source']} ({snippet['provider']})*")
                lines.append("")
            lines.append("---\n")
        
        # Architecture section (placeholder for future enhancement)
        if insights_by_category["architecture"]:
            lines.append("## 🏗️ Considerazioni Architetturali\n")
            for arch in insights_by_category["architecture"]:
                lines.append(f"- {arch['content']}")
                lines.append(f"  *Fonte: {arch['source']} ({arch['provider']})*")
                lines.append("")
            lines.append("---\n")
        
        # Summary
        lines.append("## 📊 Riepilogo\n")
        lines.append(f"- **Fonti analizzate**: {len(sources)} discussioni/chat")
        lines.append(f"- **Insight estratti**: {len(insights_by_category['insights'])}")
        lines.append(f"- **Decisioni prese**: {len(insights_by_category['decisions'])}")
        lines.append(f"- **Azioni identificate**: {len(insights_by_category['action_items'])}")
        lines.append(f"- **Snippet di codice**: {len(insights_by_category['code_snippets'])}")
        lines.append("")
        lines.append(f"*Piano generato il {datetime.now().strftime('%d/%m/%Y alle %H:%M')}*")
        
        return "\n".join(lines)