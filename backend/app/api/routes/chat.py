import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Request, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Store
from app.agents.orchestrator import run_agent_workflow

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Public Chat"])

@router.get("/health")
def api_health():
    """Simple health check endpoint returning status ok."""
    return {"status": "ok"}

@router.post("/chat")
async def chat_endpoint(request: Request, db: Session = Depends(get_db)):
    """
    Public chat endpoint for Sellsy assistant widget.
    Request JSON: { "message": "string", "history": [ { "role": "user" | "assistant", "content": "string" } ] }
    Response JSON: { "reply": "string" }
    """
    # 1. Parse JSON body
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Invalid JSON in request body."}
        )

    if not isinstance(body, dict):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Request body must be a JSON object."}
        )

    # 2. Validate message (required, max 500 chars)
    message = body.get("message")
    if message is None or not isinstance(message, str) or not message.strip():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Field 'message' is required and cannot be empty."}
        )

    if len(message) > 500:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Field 'message' exceeds maximum length of 500 characters."}
        )

    # 3. Validate history if present
    history_raw = body.get("history", [])
    if history_raw is not None and not isinstance(history_raw, list):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Field 'history' must be a list of message objects."}
        )

    clean_history: List[Dict[str, str]] = []
    if history_raw:
        for idx, item in enumerate(history_raw):
            if not isinstance(item, dict):
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": f"Item at index {idx} in 'history' must be an object."}
                )
            role = item.get("role")
            content = item.get("content")
            if role not in ("user", "assistant"):
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": f"Role '{role}' at index {idx} is invalid. Must be 'user' or 'assistant'."}
                )
            if content is None or not isinstance(content, str):
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": f"Content at index {idx} must be a string."}
                )
            clean_history.append({"role": role, "content": content})

    # 4. Invoke existing orchestrator
    try:
        # Retrieve demo or primary store for grounded intelligence
        store = db.query(Store).filter(Store.platform == "demo").first()
        if not store:
            store = db.query(Store).first()
        store_id = store.id if store else "demo-store"

        workflow_result = run_agent_workflow(
            store_id=store_id,
            query=message.strip(),
            conversation_history=clean_history
        )

        reply = workflow_result.get("response", "")
        if not reply or not reply.strip():
            reply = "I analyzed your store metrics, but could not formulate a response. Please ask another question."

        return {"reply": reply}

    except Exception as e:
        logger.error(f"Error executing chat agent workflow: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "An internal error occurred while generating the assistant reply."}
        )

