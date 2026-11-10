import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.analytics_service import AnalyticsService
from app.services.product_service import ProductService
from app.services.customer_service import CustomerService
from app.services.forecast_service import ForecastService
from app.services.report_service import ReportService
from app.models import Order, Product

def get_sales_summary(store_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Retrieve aggregated sales metrics for a store including total revenue,
    order counts, average order value (AOV), and growth rates.
    """
    with SessionLocal() as db:
        kpis = AnalyticsService.get_kpis(db, store_id, days=days)
        return {
            "store_id": store_id,
            "period_days": days,
            "total_revenue": kpis.total_revenue.numeric_value,
            "total_revenue_display": kpis.total_revenue.value,
            "revenue_growth_pct": kpis.total_revenue.delta_pct,
            "total_orders": int(kpis.total_orders.numeric_value),
            "average_order_value": kpis.average_order_value.numeric_value,
            "total_customers": int(kpis.total_customers.numeric_value),
            "benchmark_conversion_rate": "3.42%"
        }

def get_top_products(store_id: str, limit: int = 5, metric: str = "revenue") -> List[Dict[str, Any]]:
    """
    Retrieve highest-performing products ranked by gross revenue or unit sales.
    """
    with SessionLocal() as db:
        prods = ProductService.get_top_products(db, store_id, limit=limit)
        return [
            {
                "id": p.id,
                "title": p.title,
                "sku": p.sku,
                "price": p.price,
                "cost_price": p.cost_price,
                "units_sold": p.units_sold,
                "revenue_generated": p.revenue_generated,
                "velocity_status": p.velocity_status
            }
            for p in prods
        ]

def get_product_performance(store_id: str, product_id: str) -> Dict[str, Any]:
    """
    Inspect detailed metrics for an individual product, including inventory,
    margins, and monthly historical sales volume.
    """
    with SessionLocal() as db:
        detail = ProductService.get_product_detail(db, store_id, product_id)
        if not detail:
            return {"error": f"Product with ID '{product_id}' was not found in store."}
        return {
            "id": detail.id,
            "title": detail.title,
            "sku": detail.sku,
            "price": detail.price,
            "cost_price": detail.cost_price,
            "margin_pct": detail.margin_pct,
            "inventory_quantity": detail.inventory_quantity,
            "units_sold": detail.units_sold,
            "revenue_generated": detail.revenue_generated,
            "velocity_status": detail.velocity_status,
            "monthly_sales": detail.monthly_sales
        }

def get_customer_insights(store_id: str) -> Dict[str, Any]:
    """
    Retrieve customer cohort breakdowns (VIP, Returning, New, At-Risk, Inactive)
    and repeat purchase rates based on RFM analysis.
    """
    with SessionLocal() as db:
        insights = CustomerService.get_insights(db, store_id)
        return {
            "store_id": store_id,
            "total_customers": insights.total_customers,
            "repeat_purchase_rate_pct": insights.repeat_purchase_rate,
            "avg_customer_ltv": insights.avg_customer_ltv,
            "segments": [
                {
                    "segment": s.segment,
                    "display_name": s.display_name,
                    "count": s.count,
                    "total_revenue": s.total_revenue,
                    "avg_spend": s.avg_spend,
                    "percentage_of_customers": s.percentage_of_customers
                }
                for s in insights.segments
            ],
            "recommendations": insights.retention_recommendations
        }

def get_revenue_trends(store_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Retrieve chronological daily sales timelines and AOV data for trend analysis.
    """
    with SessionLocal() as db:
        trends = AnalyticsService.get_sales_trends(db, store_id, days=days)
        return {
            "store_id": store_id,
            "total_revenue": trends.total_revenue,
            "total_orders": trends.total_orders,
            "aov": trends.aov,
            "growth_rate_pct": trends.growth_rate_pct,
            "timeline": [
                {"date": p.date, "revenue": p.revenue, "orders": p.orders, "aov": p.aov}
                for p in trends.timeline
            ]
        }

def get_sales_forecast(store_id: str, days_ahead: int = 30) -> Dict[str, Any]:
    """
    Generate statistical revenue and order predictions with 80% confidence bands.
    """
    with SessionLocal() as db:
        fc = ForecastService.generate_forecast(db, store_id, days_ahead=days_ahead)
        return {
            "store_id": store_id,
            "horizon_days": fc.horizon_days,
            "total_projected_revenue": fc.total_projected_revenue,
            "total_projected_orders": fc.total_projected_orders,
            "average_daily_projected": fc.average_daily_projected,
            "confidence_level_pct": fc.confidence_level_pct,
            "trend_direction": fc.trend_direction,
            "methodology": fc.methodology,
            "narrative_explanation": fc.narrative_explanation,
            "is_sufficient_data": fc.is_sufficient_data
        }

def get_recent_orders(store_id: str, limit: int = 8) -> List[Dict[str, Any]]:
    """
    Retrieve recent store orders with financial status and customer details.
    """
    with SessionLocal() as db:
        orders = db.query(Order).filter(Order.store_id == store_id).order_by(Order.created_at.desc()).limit(limit).all()
        return [
            {
                "order_number": o.order_number,
                "total_price": o.total_price,
                "financial_status": o.financial_status,
                "fulfillment_status": o.fulfillment_status,
                "customer_email": o.customer.email if o.customer else "guest",
                "items_count": len(o.items),
                "date": o.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for o in orders
        ]

def generate_business_report(store_id: str, report_type: str = "executive") -> Dict[str, Any]:
    """
    Trigger the compilation of an executive business intelligence report (PDF/CSV).
    """
    with SessionLocal() as db:
        # Find store owner user_id
        from app.models import Store
        store = db.query(Store).filter(Store.id == store_id).first()
        user_id = store.user_id if store else "system"
        rep = ReportService.generate_report(db, store_id, user_id, report_type=report_type, file_format="pdf")
        return {
            "report_id": rep.id,
            "title": rep.title,
            "report_type": rep.report_type,
            "status": rep.status,
            "created_at": rep.created_at.isoformat(),
            "summary": rep.summary_data
        }
