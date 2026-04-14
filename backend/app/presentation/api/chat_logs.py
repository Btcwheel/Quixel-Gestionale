"""Chat Logs API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import ChatLog, AdminUser
from app.domain.schemas import (
    ChatLogCreate, ChatLogUpdate, ChatLogResponse, MessageResponse,
    ChatConversationResponse, PublicConversationResponse
)

router = APIRouter()


@router.get("/", response_model=dict)
async def list_chat_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    ai_account_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    conversation_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all chat logs with pagination and filtering."""
    query = select(ChatLog)
    count_query = select(ChatLog.id)  # For counting
    
    # Apply filters
    if ai_account_id:
        query = query.where(ChatLog.ai_account_id == ai_account_id)
        count_query = count_query.where(ChatLog.ai_account_id == ai_account_id)
    if project_id:
        query = query.where(ChatLog.project_id == project_id)
        count_query = count_query.where(ChatLog.project_id == project_id)
    if conversation_id:
        query = query.where(ChatLog.conversation_id == conversation_id)
        count_query = count_query.where(ChatLog.conversation_id == conversation_id)
    if role:
        query = query.where(ChatLog.role == role)
        count_query = count_query.where(ChatLog.role == role)
    
    # Get total count
    total = db.exec(count_query).count()
    
    # Apply sorting
    if sort_by and hasattr(ChatLog, sort_by):
        column = getattr(ChatLog, sort_by)
        query = query.order_by(column.desc() if sort_order == "desc" else column.asc())
    
    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)
    
    chats = list(db.exec(query).all())
    
    return {
        "items": [chat.model_dump() for chat in chats],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=ChatLogResponse)
async def create_chat_log(
    chat_in: ChatLogCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new chat log entry."""
    chat = ChatLog.model_validate(chat_in)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


@router.get("/{chat_id}", response_model=ChatLogResponse)
async def get_chat_log(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get a chat log by ID."""
    chat = db.get(ChatLog, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat log not found")
    return chat


@router.put("/{chat_id}/rating", response_model=ChatLogResponse)
async def update_chat_rating(
    chat_id: str,
    rating_in: ChatLogUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update chat log rating."""
    chat = db.get(ChatLog, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat log not found")
    
    chat.rating = rating_in.rating
    chat.feedback = rating_in.feedback
    
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


@router.delete("/{chat_id}", response_model=MessageResponse)
async def delete_chat_log(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete a chat log."""
    chat = db.get(ChatLog, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat log not found")
    db.delete(chat)
    db.commit()
    return {"message": "Chat log deleted successfully"}


@router.get("/conversation/{conversation_id}", response_model=ChatConversationResponse)
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get full conversation by ID."""
    chats = db.exec(
        select(ChatLog)
        .where(ChatLog.conversation_id == conversation_id)
        .order_by(ChatLog.message_index.asc())
    ).all()

    if not chats:
        raise HTTPException(status_code=404, detail="Conversation not found")

    total_tokens = sum(chat.tokens_used for chat in chats)
    total_cost = sum(chat.cost_credits for chat in chats)
    ratings = [chat.rating for chat in chats if chat.rating]
    avg_rating = sum(ratings) / len(ratings) if ratings else None

    return {
        "conversation_id": conversation_id,
        "messages": [chat.model_dump() for chat in chats],
        "total_tokens": total_tokens,
        "total_cost": total_cost,
        "avg_rating": avg_rating
    }


@router.get("/public/{conversation_id}", response_model=PublicConversationResponse)
async def get_public_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Get public conversation by ID (no auth required, for sharing)."""
    chats = db.exec(
        select(ChatLog)
        .where(ChatLog.conversation_id == conversation_id)
        .order_by(ChatLog.message_index.asc())
    ).all()

    if not chats:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {
        "conversation_id": conversation_id,
        "title": f"Chat {conversation_id[:8]}",
        "messages": [chat.model_dump() for chat in chats],
        "total_messages": len(chats),
        "created_at": chats[0].created_at if chats else None
    }
