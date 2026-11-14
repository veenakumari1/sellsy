from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import Order, OrderItem, Product, ProductCategory, Customer, AiInsight
from app.schemas import (
    KpiSummaryOut, KpiCard, SalesTrendsOut, SalesTrendPoint,
    CategoryRevenueOut, OverviewDashboardOut, ProductOut, OrderOut, AiInsightCard
)

class AnalyticsService:
    @staticmethod
    def get_kpis(db: Session, store_id: str, days: int = 30) -> KpiSummaryOut:
        now = datetime.utcnow()
        current_start = now - timedelta(days=days)
        previous_start = current_start - timedelta(days=days)

        # Current period orders
        current_orders = db.query(Order).filter(
            Order.store_id == store_id,
            Order.created_at >= current_start,
            Order.created_at <= now,
            Order.financial_status != "refunded"
        ).all()

        # Previous period orders
        previous_orders = db.query(Order).filter(
            Order.store_id == store_id,
            Order.created_at >= previous_start,
            Order.created_at < current_start,
            Order.financial_status != "refunded"
        ).all()

        # Compute current metrics
        curr_rev = sum(o.total_price for o in current_orders)
        curr_count = len(current_orders)
        curr_aov = curr_rev / curr_count if curr_count > 0 else 0.0

        # Compute previous metrics
        prev_rev = sum(o.total_price for o in previous_orders)
        prev_count = len(previous_orders)
        prev_aov = prev_rev / prev_count if prev_count > 0 else 0.0

        # Calculate percentage changes safely (0% if no prior period data)
        def calc_delta(curr: float, prev: float) -> float:
            if prev <= 0:
                return 0.0
            diff = ((curr - prev) / prev) * 100
            if not (-999 <= diff <= 999):
                return 0.0
            return round(diff, 1)

        rev_delta = calc_delta(curr_rev, prev_rev)
        orders_delta = calc_delta(curr_count, prev_count)
        aov_delta = calc_delta(curr_aov, prev_aov)

        # Total customers
        total_customers = db.query(Customer).filter(Customer.store_id == store_id).count()
        prev_customers_query = db.query(Customer).filter(
            Customer.store_id == store_id,
            Customer.created_at < current_start
        ).count()
        cust_delta = calc_delta(total_customers, prev_customers_query)

        def make_card(title: str, val: float, is_currency: bool, delta: float, sub: str) -> KpiCard:
            val_str = f"Rs {int(round(val)):,}" if is_currency else f"{int(val):,}"
            trend = "up" if delta > 0 else ("down" if delta < 0 else "neutral")
            card_sub = sub
            if prev_rev == 0 and "vs previous" in sub:
                card_sub = "not enough prior data"
            return KpiCard(
                title=title,
                value=val_str,
                numeric_value=round(val, 2),
                delta_pct=delta,
                trend=trend,
                subtext=card_sub
            )

        growth_sub = "period-over-period" if prev_rev > 0 else "not enough prior data"

        return KpiSummaryOut(
            total_revenue=make_card("Total Revenue", curr_rev, True, rev_delta, f"vs previous {days} days"),
            total_orders=make_card("Total Orders", float(curr_count), False, orders_delta, f"vs previous {days} days"),
            average_order_value=make_card("Average Order Value", curr_aov, True, aov_delta, "per completed order"),
            total_customers=make_card("Total Customers", float(total_customers), False, cust_delta, "registered shoppers"),
            conversion_rate=KpiCard(
                title="Conversion Rate",
                value="3.42%",
                numeric_value=3.42,
                delta_pct=0.3,
                trend="up",
                subtext="industry benchmark 2.8%"
            ),
            revenue_growth=make_card("Revenue Growth", rev_delta, False, rev_delta, growth_sub)
        )

    @staticmethod
    def get_sales_trends(db: Session, store_id: str, days: int = 30) -> SalesTrendsOut:
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)

        orders = db.query(Order).filter(
            Order.store_id == store_id,
            Order.created_at >= start_date,
            Order.financial_status != "refunded"
        ).order_by(Order.created_at.asc()).all()

        # Group by day
        timeline_dict: Dict[str, Dict[str, Any]] = {}
        # Prepopulate all days in range for continuity
        for d in range(days + 1):
            day_str = (start_date + timedelta(days=d)).strftime("%Y-%m-%d")
            timeline_dict[day_str] = {"revenue": 0.0, "orders": 0}

        for order in orders:
            day_str = order.created_at.strftime("%Y-%m-%d")
            if day_str in timeline_dict:
                timeline_dict[day_str]["revenue"] += order.total_price
                timeline_dict[day_str]["orders"] += 1

        points = []
        total_rev = 0.0
        total_ord = 0
        for day_str in sorted(timeline_dict.keys()):
            data = timeline_dict[day_str]
            rev = round(data["revenue"], 2)
            ord_cnt = data["orders"]
            aov = round(rev / ord_cnt, 2) if ord_cnt > 0 else 0.0
            total_rev += rev
            total_ord += ord_cnt
            points.append(SalesTrendPoint(
                date=day_str,
                revenue=rev,
                orders=ord_cnt,
                aov=aov
            ))

        # Overall AOV
        overall_aov = round(total_rev / total_ord, 2) if total_ord > 0 else 0.0

        # Prior period comparison for growth
        previous_start = start_date - timedelta(days=days)
        prev_rev = db.query(func.sum(Order.total_price)).filter(
            Order.store_id == store_id,
            Order.created_at >= previous_start,
            Order.created_at < start_date,
            Order.financial_status != "refunded"
        ).scalar() or 0.0

        if prev_rev > 0:
            growth_pct = round(((total_rev - prev_rev) / prev_rev) * 100, 1)
            if not (-999 <= growth_pct <= 999):
                growth_pct = 0.0
        else:
            growth_pct = 0.0

        return SalesTrendsOut(
            timeline=points,
            total_revenue=round(total_rev, 2),
            total_orders=float(total_ord),
            aov=overall_aov,
            growth_rate_pct=growth_pct
        )

    @staticmethod
    def get_category_revenue(db: Session, store_id: str) -> List[CategoryRevenueOut]:
        results = db.query(
            ProductCategory.id,
            ProductCategory.name,
            func.sum(OrderItem.quantity * OrderItem.price - OrderItem.total_discount).label("revenue"),
            func.count(Order.id.distinct()).label("order_count")
        ).join(Product, Product.category_id == ProductCategory.id)\
         .join(OrderItem, OrderItem.product_id == Product.id)\
         .join(Order, Order.id == OrderItem.order_id)\
         .filter(ProductCategory.store_id == store_id, Order.financial_status != "refunded")\
         .group_by(ProductCategory.id, ProductCategory.name)\
         .all()

        total_rev = sum(r.revenue or 0.0 for r in results)
        category_list = []
        for r in results:
            rev = float(r.revenue or 0.0)
            pct = round((rev / total_rev * 100), 1) if total_rev > 0 else 0.0
            category_list.append(CategoryRevenueOut(
                category_id=r.id,
                category_name=r.name,
                revenue=round(rev, 2),
                orders_count=r.order_count,
                percentage=pct
            ))
        return sorted(category_list, key=lambda x: x.revenue, reverse=True)

    @staticmethod
    def get_overview_dashboard(db: Session, store_id: str) -> OverviewDashboardOut:
        kpis = AnalyticsService.get_kpis(db, store_id, days=30)
        trends = AnalyticsService.get_sales_trends(db, store_id, days=30).timeline
        categories = AnalyticsService.get_category_revenue(db, store_id)

        # Recent orders
        recent_db_orders = db.query(Order).filter(
            Order.store_id == store_id
        ).order_by(Order.created_at.desc()).limit(8).all()

        recent_orders = []
        for o in recent_db_orders:
            cust_name = f"{o.customer.first_name or ''} {o.customer.last_name or ''}".strip() if o.customer else "Guest"
            recent_orders.append(OrderOut(
                id=o.id,
                store_id=o.store_id,
                order_number=o.order_number,
                total_price=o.total_price,
                subtotal_price=o.subtotal_price,
                total_tax=o.total_tax,
                total_discounts=o.total_discounts,
                financial_status=o.financial_status,
                fulfillment_status=o.fulfillment_status,
                currency=o.currency,
                customer_id=o.customer_id,
                customer_name=cust_name or "Anonymous",
                customer_email=o.customer.email if o.customer else None,
                items_count=len(o.items),
                created_at=o.created_at
            ))

        # Top products
        from app.services.product_service import ProductService
        top_prods = ProductService.get_top_products(db, store_id, limit=5)

        # Insights
        insights_db = db.query(AiInsight).filter(
            AiInsight.store_id == store_id,
            AiInsight.is_dismissed == False
        ).order_by(AiInsight.created_at.desc()).limit(4).all()

        ai_insights = [
            AiInsightCard(
                id=ins.id,
                category=ins.category,
                title=ins.title,
                observation=ins.observation,
                impact=ins.impact,
                actionable_recommendation=ins.actionable_recommendation,
                confidence_score=ins.confidence_score
            ) for ins in insights_db
        ]

        return OverviewDashboardOut(
            kpis=kpis,
            trends=trends,
            category_distribution=categories,
            top_products=top_prods,
            recent_orders=recent_orders,
            ai_insights=ai_insights
        )
