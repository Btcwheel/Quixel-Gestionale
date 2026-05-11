"""AI-powered extraction of insights from discussions."""

import re
from typing import Optional

from app.domain.enums import DiscussionProvider


async def extract_insights_from_discussion(
    raw_content: str,
    provider: Optional[DiscussionProvider] = None
) -> dict:
    """
    Extract key insights from raw chat content.
    
    Uses rule-based detection to identify:
    - Key insights and takeaways
    - Code snippets
    - Decisions made
    - Action items / todos
    """
    
    detected_provider = _detect_provider(raw_content)
    
    if not provider:
        provider = detected_provider or DiscussionProvider.CUSTOM
    
    insights = _extract_insights(raw_content)
    code_snippets = _extract_code_snippets(raw_content)
    decisions = _extract_decisions(raw_content)
    action_items = _extract_action_items(raw_content)
    
    return {
        "insights": insights,
        "code_snippets": code_snippets,
        "decisions": decisions,
        "action_items": action_items,
        "detected_provider": detected_provider.value if detected_provider else None
    }


def _detect_provider(content: str) -> Optional[DiscussionProvider]:
    """Detect AI provider from content."""
    content_lower = content.lower()
    
    if "claude" in content_lower or "anthropic" in content_lower:
        return DiscussionProvider.ANTHROPIC
    elif "gpt-4" in content_lower or "gpt-3.5" in content_lower or "openai" in content_lower:
        return DiscussionProvider.OPENAI
    elif "gemini" in content_lower or "google" in content_lower:
        return DiscussionProvider.GOOGLE
    elif "mistral" in content_lower:
        return DiscussionProvider.MISTRAL
    
    return None


def _extract_insights(content: str) -> str:
    """Extract key insights from the conversation."""
    lines = content.split('\n')
    insights = []
    
    markers = [
        "key insight", "important", "note:", "remember", 
        "tip:", "best practice", "recommendation", "suggestion",
        "in summary", "summary:", "to summarize", "conclusion",
        "main point", "the key", "critical", "essential"
    ]
    
    for line in lines:
        line_lower = line.lower().strip()
        if any(marker in line_lower for marker in markers):
            if len(line.strip()) > 20:
                insights.append(line.strip())
    
    decisions_match = re.search(
        r"(?:decisions?|choices? made?:?)\s*(.+?)(?:\n\n|\n---|$)",
        content,
        re.IGNORECASE | re.DOTALL
    )
    if decisions_match:
        insights.append(decisions_match.group(1).strip()[:500])
    
    return "\n".join(insights[:10]) if insights else "No specific insights detected."


def _extract_code_snippets(content: str) -> str:
    """Extract code snippets from the conversation."""
    code_blocks = re.findall(
        r"```(?:\w+)?\s*\n(.+?)```",
        content,
        re.DOTALL
    )
    
    inline_code = re.findall(
        r"(?:code|function|class|def |const |import |export |return |=> )[^\n]{20,200}",
        content
    )
    
    all_code = code_blocks + [c.strip() for c in inline_code if '{' in c or '<' in c or '->' in c]
    unique_code = list(dict.fromkeys(all_code))[:5]
    
    return "\n\n".join(unique_code) if unique_code else ""


def _extract_decisions(content: str) -> str:
    """Extract key decisions made during the conversation."""
    decisions = []
    
    patterns = [
        r"(?:decided|decision|chose|choice):?\s*(.+?)(?:\n|\.|$)",
        r"(?:we'll|we will|let's|let us|we're going to|going to)\s+(.+?)(?:\.|\n)",
        r"(?:best approach|best option|best solution):?\s*(.+?)(?:\.|\n)",
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches[:3]:
            if len(match.strip()) > 10:
                decisions.append(match.strip())
    
    return "\n".join(decisions[:5]) if decisions else ""


def _extract_action_items(content: str) -> str:
    """Extract action items / todos from the conversation."""
    action_items = []
    
    patterns = [
        r"(?:todo|to-do|action item|tasks?|next steps?):?\s*(.+?)(?:\n|\.|$)",
        r"(?:- \[ \]|- \[x\])\s*(.+?)(?:\n|$)",
        r"(?:need to|should|must|have to)\s+(.+?)(?:\.|\n)",
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches[:5]:
            if len(match.strip()) > 10:
                action_items.append(f"• {match.strip()}")
    
    return "\n".join(action_items[:5]) if action_items else ""