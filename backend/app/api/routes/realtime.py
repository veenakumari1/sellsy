import uuid
import random
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.core.websocket_manager import ws_manager
from app.models import Order, OrderItem, Product, Store, User, Notification
from app.services.notification_service import NotificationService
from app.services.gamification_service import GamificationService
from app.api.deps import get_current_user, get_current_store

router = APIRouter(prefix="/realtime", tags=["Real-Time Engine"])

@router.websocket("/ws")
@router.websocket("/ws/{store_id}")
async def websocket_endpoint(websocket: WebSocket, store_id: str = "default"):
    await ws_manager.connect(websocket, store_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Respond to heartbeat pings
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
            else:
                # Echo or handle incoming client control events
                await websocket.send_text('{"type":"ACK"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, store_id)
    except Exception:
        ws_manager.disconnect(websocket, store_id)

@router.post("/simulate-order")
async def simulate_live_order(
    current_user: User = Depends(get_current_user),
    current_store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """
    Simulates a live incoming store order:
    1. Selects an active catalog product
    2. Creates a realistic order record
    3. Emits real-time WebSocket metrics update & notification
    4. Awards gamification points
    """
    products = db.query(Product).filter(Product.store_id == current_store.id).all()
    if not products:
        product_title = "Minimalist Ceramic Planter"
        item_price = 45.0
        product_id = None
    else:
        chosen = random.choice(products)
        product_title = chosen.title
        item_price = chosen.price
        product_id = chosen.id

    qty = random.choice([1, 2, 3])
    total = round(item_price * qty, 2)
    order_num = f"#{random.randint(1100, 9999)}"

    # Create Order in DB
    new_order = Order(
        store_id=current_store.id,
        order_number=order_num,
        total_price=total,
        subtotal_price=total,
        financial_status="paid",
        fulfillment_status="unfulfilled",
        currency="USD"
    )
    db.add(new_order)
    db.flush()

    if product_id:
        db.add(OrderItem(
            order_id=new_order.id,
            product_id=product_id,
            quantity=qty,
            price=item_price
        ))

    # Create Notification
    notif = NotificationService.create_notification(
        db,
        user_id=current_user.id,
        store_id=current_store.id,
        title=f"New Order {order_num} Received",
        message=f"{qty}x {product_title} purchased for ${total:.2f}.",
        category="order",
        link="/sales"
    )

    # Award points
    GamificationService.award_points(
        db,
        user_id=current_user.id,
        activity_type="live_order_processed",
        points=20,
        description=f"Processed live order {order_num} (${total:.2f})",
        store_id=current_store.id
    )

    db.commit()

    # Broadcast live dashboard update via WebSocket
    await ws_manager.broadcast_to_store(current_store.id, {
        "type": "METRIC_UPDATE",
        "data": {
            "order_number": order_num,
            "revenue_add": total,
            "order_count_add": 1,
            "product_title": product_title,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    })

    return {
        "status": "ok",
        "order_number": order_num,
        "total": total,
        "product": product_title
    }

