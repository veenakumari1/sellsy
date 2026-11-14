from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, Store
from app.schemas import NotificationOut, NotificationListResponse
from app.services.notification_service import NotificationService
from app.api.deps import get_current_user, get_current_store

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=NotificationListResponse)
def list_notifications(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    return NotificationService.list_notifications(db, current_user.id, current_store.id, limit=limit)

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = NotificationService.mark_as_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}

@router.post("/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    count = NotificationService.mark_all_read(db, current_user.id, current_store.id)
    return {"status": "ok", "marked_read": count}

@router.post("/trigger-demo")
def trigger_demo_notification(
    category: str = "order",
    current_user: User = Depends(get_current_user),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    templates = {
        "order": ("New Customer Order #1105", "David Vance purchased 2x Minimalist Ceramic Planter (Rs 18,000).", "/sales"),
        "inventory": ("Inventory Low Warning", "Organic Soy Candle has reached 8 units remaining.", "/products"),
        "ai": ("AI Agent Synthesis", "AOV increased +14% after bundling Ceramic sets. Review marketing recommendations.", "/marketing")
    }
    title, msg, link = templates.get(category, templates["order"])
    n = NotificationService.create_notification(
        db, current_user.id, current_store.id, title, msg, category=category, link=link
    )
    return {"status": "ok", "notification": NotificationOut.model_validate(n)}

