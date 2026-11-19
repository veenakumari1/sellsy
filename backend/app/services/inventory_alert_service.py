import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.models import Store, Product, Order, OrderItem, Notification
from app.services.notification_service import NotificationService

logger = logging.getLogger("storsy.inventory_alert")

class InventoryAlertService:
    @staticmethod
    def _call_gemini(prompt: str) -> Optional[str]:
        if not settings.GEMINI_API_KEY or len(settings.GEMINI_API_KEY) < 10:
            return None
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini API call skipped: {e}")
        return None

    @classmethod
    def get_inventory_alerts(cls, db: Session, store: Store) -> Dict[str, Any]:
        """
        Analyzes stock across catalog, calculates sales velocity, days left,
        status classification, and suggested restock quantities.
        """
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)

        # 1. Fetch 30-day unit sales per product for velocity
        sales_by_product = dict(
            db.query(
                OrderItem.product_id,
                func.sum(OrderItem.quantity)
            )
            .join(Order, Order.id == OrderItem.order_id)
            .filter(
                Order.store_id == store.id,
                Order.created_at >= thirty_days_ago,
                Order.financial_status != "refunded"
            )
            .group_by(OrderItem.product_id)
            .all()
        )

        products = db.query(Product).filter(Product.store_id == store.id).all()

        items = []
        low_count = 0
        oos_count = 0
        healthy_count = 0
        total_reorder_cost = 0.0

        for p in products:
            qty = p.inventory_quantity if p.inventory_quantity is not None else 0
            reorder_lvl = p.reorder_level if p.reorder_level is not None else 10
            cost = p.cost_price if (p.cost_price and p.cost_price > 0) else (p.price * 0.6)

            sold_30d = float(sales_by_product.get(p.id, 0))
            daily_velocity = round(sold_30d / 30.0, 2)

            # Days of stock left calculation
            if qty <= 0:
                days_left = 0
                status = "Out of stock"
                oos_count += 1
            elif daily_velocity > 0:
                days_left = int(qty / daily_velocity)
                if qty <= reorder_lvl or days_left <= 7:
                    status = "Low stock"
                    low_count += 1
                else:
                    status = "Healthy"
                    healthy_count += 1
            else:
                # No sales in 30 days
                days_left = 99
                if qty <= reorder_lvl:
                    status = "Low stock"
                    low_count += 1
                else:
                    status = "Healthy"
                    healthy_count += 1

            # Suggested restock calculation:
            # 30-day projected demand + safety buffer - current stock
            if daily_velocity > 0:
                target_coverage = int(daily_velocity * 30 + (reorder_lvl - qty))
                suggested_qty = max(15, target_coverage)
                restock_reason = (
                    f"Based on {daily_velocity:.1f} units/day run rate. Covers next 30 days with safety buffer."
                )
            else:
                suggested_qty = max(15, reorder_lvl * 2)
                restock_reason = "Standard baseline replenishment batch to maintain display presence."

            item_reorder_cost = round(suggested_qty * cost, 2)
            if status in ("Out of stock", "Low stock"):
                total_reorder_cost += item_reorder_cost

            items.append({
                "id": p.id,
                "title": p.title,
                "sku": p.sku or "N/A",
                "category_name": p.category.name if p.category else "General",
                "price": float(p.price or 0.0),
                "inventory_quantity": qty,
                "reorder_level": reorder_lvl,
                "daily_velocity": daily_velocity,
                "days_left": days_left,
                "status": status,
                "suggested_restock_qty": suggested_qty,
                "restock_reason": restock_reason,
                "estimated_restock_cost": item_reorder_cost
            })

        # Sort: Out of stock first, then Low stock, then Healthy
        status_priority = {"Out of stock": 0, "Low stock": 1, "Healthy": 2}
        items.sort(key=lambda x: (status_priority.get(x["status"], 3), x["days_left"]))

        return {
            "items": items,
            "total_skus": len(products),
            "low_stock_count": low_count,
            "out_of_stock_count": oos_count,
            "healthy_count": healthy_count,
            "estimated_reorder_cost": round(total_reorder_cost, 2)
        }

    @classmethod
    def update_reorder_level(cls, db: Session, store: Store, product_id: str, new_level: int) -> Product:
        product = db.query(Product).filter(Product.id == product_id, Product.store_id == store.id).first()
        if not product:
            raise ValueError("Product not found")
        product.reorder_level = max(0, new_level)
        db.commit()
        db.refresh(product)
        return product

    @classmethod
    def check_and_create_notifications(cls, db: Session, store: Store) -> List[Notification]:
        """
        Scans products and creates real-time WebSocket notifications for breached safety thresholds.
        Avoids creating duplicate notifications if an unread alert for the same product exists in the last 24h.
        """
        products = db.query(Product).filter(Product.store_id == store.id).all()
        created_notifs = []
        now = datetime.now(timezone.utc)
        one_day_ago = now - timedelta(hours=24)

        for p in products:
            qty = p.inventory_quantity or 0
            lvl = p.reorder_level or 10

            if qty <= lvl:
                # Check for existing recent unread alert for this product
                existing = (
                    db.query(Notification)
                    .filter(
                        Notification.store_id == store.id,
                        Notification.category == "inventory_alert",
                        Notification.title.like(f"%{p.title}%"),
                        Notification.created_at >= one_day_ago
                    )
                    .first()
                )
                if not existing:
                    if qty <= 0:
                        title = f"Out of Stock: {p.title}"
                        message = f"{p.title} has reached 0 units. Customers cannot purchase this item."
                    else:
                        title = f"Low Stock Alert: {p.title}"
                        message = f"{p.title} has only {qty} units left (below safety threshold of {lvl})."

                    notif = NotificationService.create_notification(
                        db=db,
                        user_id=store.user_id,
                        store_id=store.id,
                        title=title,
                        message=message,
                        category="inventory_alert",
                        link="/inventory"
                    )
                    created_notifs.append(notif)

        return created_notifs

