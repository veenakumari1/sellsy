from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Store
from app.schemas import InventoryAlertsResponse, ReorderLevelUpdate
from app.services.inventory_alert_service import InventoryAlertService
from app.api.deps import get_current_store

router = APIRouter(prefix="/inventory", tags=["Inventory & Restock Alerts"])

@router.get("/alerts", response_model=InventoryAlertsResponse)
def get_inventory_alerts(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """
    Returns inventory health across all catalog products, calculating sales velocity,
    projected days of stock remaining, low/out-of-stock risk status, and suggested restock quantities.
    Also triggers real-time alerts if low stock conditions are newly detected.
    """
    # Check and trigger notifications for breached thresholds
    try:
        InventoryAlertService.check_and_create_notifications(db, current_store)
    except Exception:
        pass

    return InventoryAlertService.get_inventory_alerts(db, current_store)

@router.patch("/products/{product_id}/reorder-level")
def update_product_reorder_level(
    product_id: str,
    payload: ReorderLevelUpdate,
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Adjusts the safety reorder threshold for a specific product."""
    try:
        product = InventoryAlertService.update_reorder_level(
            db=db,
            store=current_store,
            product_id=product_id,
            new_level=payload.reorder_level
        )
        return {
            "status": "success",
            "product_id": product.id,
            "reorder_level": product.reorder_level
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/check-alerts")
def check_alerts_now(
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Forces an immediate re-evaluation and emits real-time WebSocket notifications for low/out-of-stock items."""
    notifs = InventoryAlertService.check_and_create_notifications(db, current_store)
    return {
        "status": "success",
        "notifications_created": len(notifs)
    }

