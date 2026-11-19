from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Store
from app.schemas import (
    WinBackListResponse,
    CustomerWhatsappUpdate,
    WinBackMessageRequest,
    WinBackMessageResponse,
    CustomerOut
)
from app.services.winback_service import WinBackService
from app.api.deps import get_current_store

router = APIRouter(prefix="/winback", tags=["Customer Prediction & Win-Back"])

@router.get("/at-risk", response_model=WinBackListResponse)
def get_at_risk_customers(
    days: int = Query(30, description="Inactive threshold in days (30, 60, or 90)"),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """
    Identifies customers who previously purchased but haven't placed an order in the last 30, 60, or 90 days.
    Provides risk scoring (High/Medium/Low) based on inactivity duration and frequency.
    """
    if days not in (30, 60, 90):
        days = 30
    return WinBackService.get_at_risk_customers(db, current_store, days=days)

@router.patch("/customer/{customer_id}/whatsapp")
def update_customer_whatsapp(
    customer_id: str,
    payload: CustomerWhatsappUpdate,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Updates the customer's WhatsApp contact number for 1-click win-back messaging."""
    try:
        updated = WinBackService.update_whatsapp(db, current_store, customer_id, payload.whatsapp)
        return {
            "status": "success",
            "customer_id": updated.id,
            "whatsapp": updated.whatsapp
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/message", response_model=WinBackMessageResponse)
def generate_winback_message(
    payload: WinBackMessageRequest,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized, friendly win-back message for an at-risk customer,
    referencing their past purchase and offering a re-engagement incentive code.
    Returns the message and a ready-to-click wa.me URL.
    """
    try:
        return WinBackService.generate_winback_message(
            db=db,
            store=current_store,
            customer_id=payload.customer_id,
            discount_code=payload.discount_code or "WELCOMEBACK"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

