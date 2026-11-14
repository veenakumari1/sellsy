import asyncio
from datetime import datetime, timezone
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models import Notification, User, Store
from app.schemas import NotificationOut, NotificationListResponse
from app.core.websocket_manager import ws_manager

class NotificationService:
    @staticmethod
    def ensure_default_notifications(db: Session, user_id: str, store_id: str):
        existing_count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.store_id == store_id
        ).count()

        if existing_count == 0:
            default_notifications = [
                {
                    "title": "New High-Value Order #1099",
                    "message": "Sarah Jenkins completed purchase of Ceramic Minimalist Planter (Rs 18,500).",
                    "category": "order",
                    "link": "/sales",
                    "is_read": False,
                },
                {
                    "title": "Low Inventory Alert",
                    "message": "Ceramic Minimalist Planter stock fell below safety threshold (14 units remaining).",
                    "category": "inventory_alert",
                    "link": "/products",
                    "is_read": False,
                },
                {
                    "title": "AI Growth Opportunity Detected",
                    "message": "AOV surged +24% on Saturday evenings. Review the AI Marketing Advisor retention bundle.",
                    "category": "ai_insight",
                    "link": "/marketing",
                    "is_read": False,
                },
                {
                    "title": "Achievement Unlocked: Store Starter",
                    "message": "You successfully connected Aura Living Essentials to Sellsy (+100 Points earned!).",
                    "category": "gamification",
                    "link": "/rewards",
                    "is_read": True,
                },
                {
                    "title": "Weekly Performance Audit Ready",
                    "message": "Holt-Winters 30-day forecast and cohort breakdown generated for store leadership.",
                    "category": "sales",
                    "link": "/reports",
                    "is_read": True,
                }
            ]

            for notif in default_notifications:
                n = Notification(
                    user_id=user_id,
                    store_id=store_id,
                    title=notif["title"],
                    message=notif["message"],
                    category=notif["category"],
                    link=notif["link"],
                    is_read=notif["is_read"]
                )
                db.add(n)
            db.commit()

    @staticmethod
    def list_notifications(db: Session, user_id: str, store_id: str, limit: int = 30) -> NotificationListResponse:
        NotificationService.ensure_default_notifications(db, user_id, store_id)

        items = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.store_id == store_id
        ).order_by(Notification.created_at.desc()).limit(limit).all()

        unread = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.store_id == store_id,
            Notification.is_read == False
        ).count()

        return NotificationListResponse(
            notifications=[NotificationOut.model_validate(n) for n in items],
            unread_count=unread
        )

    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        store_id: str,
        title: str,
        message: str,
        category: str = "sales",
        link: str = None
    ) -> Notification:
        n = Notification(
            user_id=user_id,
            store_id=store_id,
            title=title,
            message=message,
            category=category,
            link=link,
            is_read=False
        )
        db.add(n)
        db.commit()
        db.refresh(n)

        # Trigger async WebSocket broadcast
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(ws_manager.broadcast_to_store(store_id, {
                    "type": "NOTIFICATION",
                    "data": {
                        "id": n.id,
                        "title": n.title,
                        "message": n.message,
                        "category": n.category,
                        "link": n.link,
                        "is_read": n.is_read,
                        "created_at": n.created_at.isoformat()
                    }
                }))
        except Exception:
            pass

        return n

    @staticmethod
    def mark_as_read(db: Session, notification_id: str, user_id: str) -> bool:
        n = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if n:
            n.is_read = True
            db.commit()
            return True
        return False

    @staticmethod
    def mark_all_read(db: Session, user_id: str, store_id: str) -> int:
        updated = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.store_id == store_id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return updated

