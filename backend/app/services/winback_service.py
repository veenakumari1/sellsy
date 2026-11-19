import logging
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.models import Store, Customer, Order, OrderItem, Product

logger = logging.getLogger("storsy.winback")

class WinBackService:
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

    @staticmethod
    def clean_whatsapp_number(raw: Optional[str]) -> Optional[str]:
        """Cleans phone / WhatsApp number into standard international format for wa.me links."""
        if not raw:
            return None
        digits = "".join(ch for ch in str(raw) if ch.isdigit())
        if not digits:
            return None
        # Handle Pakistan local format starting with 03 -> 923
        if digits.startswith("03") and len(digits) == 11:
            digits = "92" + digits[1:]
        elif digits.startswith("92") and len(digits) >= 11:
            pass
        return digits

    @classmethod
    def get_at_risk_customers(cls, db: Session, store: Store, days: int = 30) -> Dict[str, Any]:
        """
        Retrieves customers who haven't ordered in `days` (30, 60, or 90),
        computes risk level, retrieves last product purchased, and aggregates summary stats.
        """
        now = datetime.now(timezone.utc)
        threshold_date = now - timedelta(days=days)

        customers = (
            db.query(Customer)
            .filter(Customer.store_id == store.id)
            .all()
        )

        at_risk_list = []
        high_count = 0
        med_count = 0
        low_count = 0
        potential_rev = 0.0

        for c in customers:
            # Must be a prior customer
            if (c.orders_count or 0) <= 0 and not c.last_order_at:
                continue

            last_order = c.last_order_at
            if last_order is not None and last_order.tzinfo is None:
                last_order = last_order.replace(tzinfo=timezone.utc)

            # Inactivity calculation
            if last_order:
                inactive_days = max(0, (now - last_order).days)
            else:
                inactive_days = days + 1

            if inactive_days < days:
                continue

            # Risk level scoring
            # High: inactive >= 90 days, or (>= 60 days and high value / multiple orders)
            # Medium: inactive 60-89 days, or (30-59 days and multiple orders)
            # Low: 30-59 days with 1 order
            if inactive_days >= 90:
                risk_level = "High"
                high_count += 1
            elif inactive_days >= 60:
                if (c.orders_count or 0) >= 2 or (c.total_spent or 0) > 8000:
                    risk_level = "High"
                    high_count += 1
                else:
                    risk_level = "Medium"
                    med_count += 1
            else:
                if (c.orders_count or 0) >= 2 or (c.total_spent or 0) > 8000:
                    risk_level = "Medium"
                    med_count += 1
                else:
                    risk_level = "Low"
                    low_count += 1

            potential_rev += float(c.total_spent or 0.0)

            # Find last product purchased
            last_product_title = None
            recent_order = (
                db.query(Order)
                .filter(Order.customer_id == c.id, Order.store_id == store.id)
                .order_by(desc(Order.created_at))
                .first()
            )
            if recent_order:
                item = (
                    db.query(OrderItem)
                    .filter(OrderItem.order_id == recent_order.id)
                    .first()
                )
                if item and item.product_id:
                    prod = db.query(Product).filter(Product.id == item.product_id).first()
                    if prod:
                        last_product_title = prod.title

            full_name = f"{c.first_name or ''} {c.last_name or ''}".strip()
            if not full_name:
                full_name = c.email.split("@")[0].capitalize()

            at_risk_list.append({
                "id": c.id,
                "name": full_name,
                "email": c.email,
                "phone": c.phone,
                "whatsapp": c.whatsapp or c.phone,
                "days_inactive": inactive_days,
                "last_order_at": c.last_order_at,
                "orders_count": c.orders_count or 0,
                "total_spent": float(c.total_spent or 0.0),
                "risk_level": risk_level,
                "last_product_name": last_product_title,
                "currency": store.currency or "PKR"
            })

        # Sort by days inactive descending (highest urgency first)
        at_risk_list.sort(key=lambda x: x["days_inactive"], reverse=True)

        return {
            "customers": at_risk_list,
            "total_at_risk": len(at_risk_list),
            "high_risk_count": high_count,
            "medium_risk_count": med_count,
            "low_risk_count": low_count,
            "potential_revenue_at_risk": round(potential_rev, 2)
        }

    @classmethod
    def update_whatsapp(cls, db: Session, store: Store, customer_id: str, whatsapp: str) -> Customer:
        customer = db.query(Customer).filter(Customer.id == customer_id, Customer.store_id == store.id).first()
        if not customer:
            raise ValueError("Customer not found")
        customer.whatsapp = whatsapp.strip()
        db.commit()
        db.refresh(customer)
        return customer

    @classmethod
    def generate_winback_message(
        cls,
        db: Session,
        store: Store,
        customer_id: str,
        discount_code: str = "WELCOMEBACK"
    ) -> Dict[str, Any]:
        """Generates a warm, short, friendly win-back message with personalized details."""
        customer = db.query(Customer).filter(Customer.id == customer_id, Customer.store_id == store.id).first()
        if not customer:
            raise ValueError("Customer not found")

        first_name = customer.first_name or customer.email.split("@")[0].capitalize()
        full_name = f"{customer.first_name or ''} {customer.last_name or ''}".strip() or first_name

        # Last ordered product
        last_product_title = None
        recent_order = (
            db.query(Order)
            .filter(Order.customer_id == customer.id, Order.store_id == store.id)
            .order_by(desc(Order.created_at))
            .first()
        )
        if recent_order:
            item = db.query(OrderItem).filter(OrderItem.order_id == recent_order.id).first()
            if item and item.product_id:
                prod = db.query(Product).filter(Product.id == item.product_id).first()
                if prod:
                    last_product_title = prod.title

        # Prompt Gemini for customized winback copy
        ai_prompt = (
            f"Write a short, friendly, high-converting WhatsApp win-back message for an e-commerce customer.\n"
            f"Store Name: {store.name}\n"
            f"Customer Name: {first_name}\n"
            f"Last Purchased Product: {last_product_title or 'our signature collection'}\n"
            f"Incentive: 10% discount with code '{discount_code}'\n"
            f"Requirements:\n"
            f"- Polite, conversational tone (e.g. Salam {first_name}!)\n"
            f"- Mention how much we hope they loved their {last_product_title or 'previous order'}\n"
            f"- Keep it under 65 words\n"
            f"- Include the voucher code '{discount_code}'\n"
            f"- No hashtags, plain text suitable for WhatsApp."
        )

        generated_text = cls._call_gemini(ai_prompt)

        # Fallback if AI not available
        if not generated_text or len(generated_text) < 20:
            if last_product_title:
                generated_text = (
                    f"Salam {first_name}! We hope you're loving your {last_product_title} from {store.name}. "
                    f"We've just dropped fresh new additions to our collection that you'll love! "
                    f"As a special thank you, use code *{discount_code}* for 10% off your next order today. "
                    f"Let us know if we can help you pick anything!"
                )
            else:
                generated_text = (
                    f"Salam {first_name}! We miss having you shop at {store.name}. "
                    f"We've refreshed our catalog with exciting new arrivals! "
                    f"Here's an exclusive 10% discount for you: use code *{discount_code}* at checkout. "
                    f"Hope to see you back soon!"
                )

        # WhatsApp link generation
        clean_num = cls.clean_whatsapp_number(customer.whatsapp or customer.phone)
        wa_link = None
        if clean_num:
            encoded_msg = urllib.parse.quote(generated_text)
            wa_link = f"https://wa.me/{clean_num}?text={encoded_msg}"

        return {
            "customer_id": customer.id,
            "customer_name": full_name,
            "whatsapp": customer.whatsapp or customer.phone,
            "message": generated_text,
            "wa_link": wa_link
        }

