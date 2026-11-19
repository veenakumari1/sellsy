import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.analytics_service import AnalyticsService
from app.services.product_service import ProductService
from app.services.customer_service import CustomerService
from app.schemas import MarketingStrategyOut, MarketingCampaignOut

class MarketingService:
    @staticmethod
    def get_marketing_strategy(db: Session, store_id: str) -> MarketingStrategyOut:
        kpis = AnalyticsService.get_kpis(db, store_id, days=30)
        top_prods = ProductService.get_top_products(db, store_id, limit=3)
        declining_prods = ProductService.get_declining_products(db, store_id)
        cust_insights = CustomerService.get_insights(db, store_id)

        star_prod = top_prods[0].title if top_prods else "Best-Selling Collection"
        star_price = top_prods[0].price if top_prods else 48.0
        declining_prod = declining_prods[0].title if declining_prods else None
        
        at_risk_seg = next((s for s in cust_insights.segments if s.segment == "at_risk"), None)
        vip_seg = next((s for s in cust_insights.segments if s.segment == "high_value"), None)

        current_aov = kpis.average_order_value.numeric_value
        target_aov_threshold = round((current_aov * 1.25) / 100) * 100  # nearest Rs 100 milestone

        campaigns = [
            MarketingCampaignOut(
                id=str(uuid.uuid4()),
                title=f"VIP Early-Access Drop: {star_prod}",
                objective="Boost repeat purchase rate and maximize lifetime value among loyal shoppers",
                target_segment="High-Value VIPs",
                recommended_channels=["Direct Email (Klaviyo)", "Personalized SMS Concierge"],
                hero_product_title=star_prod,
                offer_summary=f"Exclusive 48-hour early release window with a complimentary artisanal gift on orders exceeding Rs {target_aov_threshold:,.0f}.",
                expected_impact="+18% Repeat Purchase Rate lift, estimated Rs 250,000+ incremental weekend revenue.",
                action_steps=[
                    "Export high-value customer segment list from Storsy Customers tab.",
                    f"Draft email emphasizing appreciation for their brand loyalty with private shop link.",
                    f"Set minimum cart threshold of Rs {target_aov_threshold:,.0f} for free gift qualification.",
                    "Schedule send for Thursday 6:00 PM EST prior to peak weekend buying traffic."
                ]
            )
        ]

        if declining_prod:
            campaigns.append(
                MarketingCampaignOut(
                    id=str(uuid.uuid4()),
                    title=f"Inventory Liquidation Bundle: {declining_prod}",
                    objective="Clear slow-moving inventory and recover trapped working capital",
                    target_segment="All Past Shoppers & New Visitors",
                    recommended_channels=["On-site Banner / Cart Drawer", "Meta Retargeting Ad"],
                    hero_product_title=declining_prod,
                    offer_summary=f"Pair '{declining_prod}' with '{star_prod}' for an instant 20% bundle discount.",
                    expected_impact="Liquidate 40+ stagnant units within 14 days, lifting overall basket size.",
                    action_steps=[
                        f"Create a bundle product in your store linking '{declining_prod}' and '{star_prod}'.",
                        "Add a sticky 'Frequently Bought Together' widget on the hero product page.",
                        "Deploy automated cart-drawer cross-sell upsell prompt before checkout."
                    ]
                )
            )

        if at_risk_seg and at_risk_seg.count > 0:
            campaigns.append(
                MarketingCampaignOut(
                    id=str(uuid.uuid4()),
                    title=f"Automated Win-Back Flow for {at_risk_seg.count} Lapsed Buyers",
                    objective="Re-engage at-risk customers who haven't ordered in over 45 days",
                    target_segment="At-Risk Customers",
                    recommended_channels=["2-Step Email Sequence"],
                    hero_product_title="Curated New Arrivals",
                    offer_summary="Tiered incentive: 'Rs 1,500 off your next order over Rs 6,000' expiring in 7 days.",
                    expected_impact=f"Reactivate ~12-15% of lapsed customers (approx {int(at_risk_seg.count * 0.14)} reactivated orders).",
                    action_steps=[
                        "Segment customers filtered by 'At-Risk' in Storsy.",
                        "Step 1: 'We Miss You - See What's New' email with highlighted top-selling items.",
                        "Step 2 (4 days later): Time-sensitive reminder of the Rs 1,500 voucher countdown."
                    ]
                )
            )

        quick_wins = [
            f"Add a free shipping progress bar at Rs {target_aov_threshold:,.0f} (current AOV: Rs {current_aov:,.0f}) to incentivize multi-item orders.",
            f"Highlight '{star_prod}' on your homepage hero carousel with social proof badges (e.g. 'Customer Favorite').",
            "Send weekend sales promotional emails on Friday evening to capture peak weekend conversion momentum."
        ]

        retention_playbook = [
            "Day 0: Send instant order confirmation with estimated delivery window and care instructions.",
            "Day 5: Check in on product delivery satisfaction before asking for reviews.",
            "Day 14: Automated product review request with 10% coupon incentive for photo/video submissions.",
            "Day 30: Targeted recommendation email based on category purchase history."
        ]

        cross_sell_matrix = [
            {
                "trigger_product": star_prod,
                "recommended_cross_sell": declining_prod or "Organic French Lavender Oil",
                "rationale": "High affinity complementary utility with strong margin cushion."
            },
            {
                "trigger_product": "Precision Gooseneck Pour-Over Kettle",
                "recommended_cross_sell": "Double-Wall Insulated Matcha Bowl",
                "rationale": "Kitchen connoisseur audience bundle yielding high combined ticket value."
            }
        ]

        return MarketingStrategyOut(
            strategic_focus="Average Order Value Expansion & Cohort Retention",
            summary=f"Analysis of current metrics shows strong demand for '{star_prod}'. Primary growth levers involve raising basket sizes from ${current_aov:.2f} to ${target_aov_threshold:.2f} via bundling and reactivating the at-risk customer segment.",
            campaigns=campaigns,
            quick_wins=quick_wins,
            retention_playbook=retention_playbook,
            cross_sell_opportunities=cross_sell_matrix
        )
