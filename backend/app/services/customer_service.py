from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Customer, Order
from app.schemas import (
    CustomerOut, CustomerInsightsOut, CustomerSegmentSummary
)

def _to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

class CustomerService:
    @staticmethod
    def get_insights(db: Session, store_id: str) -> CustomerInsightsOut:
        customers = db.query(Customer).filter(Customer.store_id == store_id).all()
        total_customers = len(customers)

        if total_customers == 0:
            return CustomerInsightsOut(
                total_customers=0,
                repeat_purchase_rate=0.0,
                avg_customer_ltv=0.0,
                segments=[],
                retention_recommendations=["Start acquiring customers by connecting your store or importing customer data."]
            )

        repeat_customers = [c for c in customers if c.orders_count >= 2]
        repeat_rate = round((len(repeat_customers) / total_customers) * 100, 1)

        total_spend = sum(c.total_spent for c in customers)
        avg_ltv = round(total_spend / total_customers, 2)

        # Segments aggregation
        segments_def = [
            ("high_value", "High-Value VIPs"),
            ("returning", "Returning Customers"),
            ("new", "New Buyers"),
            ("at_risk", "At-Risk Customers"),
            ("inactive", "Inactive Shoppers")
        ]

        segment_summaries = []
        for seg_key, display_name in segments_def:
            matching = [c for c in customers if c.segment == seg_key]
            cnt = len(matching)
            seg_rev = sum(c.total_spent for c in matching)
            avg_seg_spend = round(seg_rev / cnt, 2) if cnt > 0 else 0.0
            pct = round((cnt / total_customers) * 100, 1)

            segment_summaries.append(CustomerSegmentSummary(
                segment=seg_key,
                display_name=display_name,
                count=cnt,
                total_revenue=round(seg_rev, 2),
                avg_spend=avg_seg_spend,
                percentage_of_customers=pct
            ))

        # Grounded recommendations based on actual segment distributions
        recommendations = []
        at_risk_seg = next((s for s in segment_summaries if s.segment == "at_risk"), None)
        vip_seg = next((s for s in segment_summaries if s.segment == "high_value"), None)
        new_seg = next((s for s in segment_summaries if s.segment == "new"), None)

        if at_risk_seg and at_risk_seg.count > 0:
            recommendations.append(
                f"Deploy a targeted win-back flow offering a 15% incentive to the {at_risk_seg.count} at-risk patrons before they churn completely."
            )
        if vip_seg and vip_seg.count > 0:
            recommendations.append(
                f"Grant VIP early access or custom loyalty tier perks to your {vip_seg.count} highest-spending patrons ($ {vip_seg.avg_spend:,.2f} average lifetime spend)."
            )
        if new_seg and new_seg.count > 0:
            recommendations.append(
                f"Introduce an automated 7-day post-delivery onboarding email for the {new_seg.count} new buyers with complementary product suggestions."
            )

        return CustomerInsightsOut(
            total_customers=total_customers,
            repeat_purchase_rate=repeat_rate,
            avg_customer_ltv=avg_ltv,
            segments=segment_summaries,
            retention_recommendations=recommendations
        )

    @staticmethod
    def get_customers(
        db: Session,
        store_id: str,
        segment: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "spend",
        skip: int = 0,
        limit: int = 50
    ) -> List[CustomerOut]:
        query = db.query(Customer).filter(Customer.store_id == store_id)

        if segment and segment != "all":
            query = query.filter(Customer.segment == segment)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Customer.first_name.ilike(search_pattern)) |
                (Customer.last_name.ilike(search_pattern)) |
                (Customer.email.ilike(search_pattern))
            )

        if sort_by == "spend":
            query = query.order_by(Customer.total_spent.desc())
        elif sort_by == "orders":
            query = query.order_by(Customer.orders_count.desc())
        elif sort_by == "recent":
            query = query.order_by(Customer.last_order_at.desc())
        else:
            query = query.order_by(Customer.created_at.desc())

        customers = query.offset(skip).limit(limit).all()
        return [CustomerOut.model_validate(c) for c in customers]
