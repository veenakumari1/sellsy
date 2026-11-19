import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store, User, AiConversation, AiMessage
from app.schemas import (
    ChatRequest, ChatResponse, ConversationOut, MessageOut, ToolInvocationInfo
)
from app.agents.orchestrator import run_agent_workflow
from app.api.deps import get_current_user, get_current_store

router = APIRouter(prefix="/assistant", tags=["Storsy AI Assistant"])

@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    current_store: Store = Depends(get_current_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(AiConversation).filter(
        AiConversation.store_id == current_store.id,
        AiConversation.user_id == current_user.id
    ).order_by(AiConversation.updated_at.desc()).all()
    return [ConversationOut.model_validate(c) for c in convs]

@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: str,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    conv = db.query(AiConversation).filter(
        AiConversation.id == conversation_id,
        AiConversation.store_id == current_store.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return ConversationOut.model_validate(conv)

@router.post("/chat", response_model=ChatResponse)
def chat(
    chat_req: ChatRequest,
    current_store: Store = Depends(get_current_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve or create conversation
    conv = None
    if chat_req.conversation_id:
        conv = db.query(AiConversation).filter(
            AiConversation.id == chat_req.conversation_id,
            AiConversation.store_id == current_store.id
        ).first()

    if not conv:
        # Title snippet from first 50 chars of prompt
        title = chat_req.message[:50].strip() + ("..." if len(chat_req.message) > 50 else "")
        conv = AiConversation(
            store_id=current_store.id,
            user_id=current_user.id,
            title=title
        )
        db.add(conv)
        db.flush()

    # Save user message
    user_msg = AiMessage(
        conversation_id=conv.id,
        role="user",
        content=chat_req.message
    )
    db.add(user_msg)
    db.flush()

    # Load history for context
    past_messages = db.query(AiMessage).filter(
        AiMessage.conversation_id == conv.id
    ).order_by(AiMessage.created_at.asc()).all()

    conv_history = [{"role": m.role, "content": m.content} for m in past_messages[-6:]]

    # Execute LangGraph Multi-Agent Orchestration with MCP Tools
    workflow_result = run_agent_workflow(
        store_id=current_store.id,
        query=chat_req.message,
        conversation_history=conv_history
    )

    final_content = workflow_result["response"]
    raw_tool_calls = workflow_result["tool_calls"]
    suggested_actions = workflow_result["suggested_actions"]

    # Save assistant message
    asst_msg = AiMessage(
        conversation_id=conv.id,
        role="assistant",
        content=final_content,
        tool_calls=raw_tool_calls
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    tools_out = [
        ToolInvocationInfo(
            tool_name=tc.get("tool_name", "unknown"),
            arguments=tc.get("arguments", {}),
            output_summary=tc.get("output_summary")
        )
        for tc in (raw_tool_calls or [])
    ]

    msg_out = MessageOut(
        id=asst_msg.id,
        role="assistant",
        content=final_content,
        tool_calls=tools_out,
        created_at=asst_msg.created_at
    )

    return ChatResponse(
        conversation_id=conv.id,
        message=msg_out,
        suggested_actions=suggested_actions
    )
