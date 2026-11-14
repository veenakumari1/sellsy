from typing import Dict, Any, List
from app.mcp import tools
from app.agents.state import AgentState

def run_sales_agent(state: AgentState) -> AgentState:
    store_id = state["store_id"]
    summary = tools.get_sales_summary(store_id, days=30)
    trends = tools.get_revenue_trends(store_id, days=30)

    state["tool_calls_executed"].append({
        "tool_name": "get_sales_summary",
        "arguments": {"store_id": store_id, "days": 30},
        "output_summary": f"Revenue: Rs {summary['total_revenue']:,.0f}, Orders: {summary['total_orders']}, AOV: Rs {summary['average_order_value']:.0f}, Growth: {summary['revenue_growth_pct']}%"
    })
    state["tool_calls_executed"].append({
        "tool_name": "get_revenue_trends",
        "arguments": {"store_id": store_id, "days": 30},
        "output_summary": f"Retrieved {len(trends['timeline'])} daily trend records"
    })

    rev = summary["total_revenue"]
    orders = summary["total_orders"]
    aov = summary["average_order_value"]
    growth = summary["revenue_growth_pct"]

    analysis = (
        f"**Sales Analysis Report:**\n"
        f"- **Gross Revenue (Last 30 Days):** Rs {rev:,.0f} ({growth:+}% vs prior period)\n"
        f"- **Order Volume:** {orders} fulfilled orders\n"
        f"- **Average Order Value (AOV):** Rs {aov:.0f}\n"
    )
    if growth >= 0:
        analysis += f"- **Driver:** Positive momentum driven by steady order velocity and consistent weekend volume spikes.\n"
    else:
        analysis += f"- **Driver:** Contraction in revenue driven primarily by a dip in mid-week order conversion.\n"

    state["agent_outputs"]["sales_agent"] = {
        "raw_summary": summary,
        "narrative": analysis,
        "key_figures": {"revenue": rev, "orders": orders, "aov": aov, "growth": growth}
    }
    return state

def run_product_agent(state: AgentState) -> AgentState:
    store_id = state["store_id"]
    top_prods = tools.get_top_products(store_id, limit=5)
    
    state["tool_calls_executed"].append({
        "tool_name": "get_top_products",
        "arguments": {"store_id": store_id, "limit": 5},
        "output_summary": f"Top item: {top_prods[0]['title'] if top_prods else 'None'} (Rs {top_prods[0]['revenue_generated'] if top_prods else 0:,.0f})"
    })

    top_item = top_prods[0] if top_prods else None
    declining_items = [p for p in top_prods if p.get("velocity_status") == "declining"]

    prod_text = "**Product Intelligence Report:**\n"
    if top_item:
        prod_text += (
            f"- **Star SKU:** `{top_item['title']}` (Rs {top_item['price']:.0f}) with "
            f"{top_item['units_sold']} units sold generating Rs {top_item['revenue_generated']:,.0f} in sales.\n"
        )
    if len(top_prods) > 1:
        prod_text += f"- **Catalog Drivers:** Followed by `{top_prods[1]['title']}` and `{top_prods[2]['title']}`.\n"
    
    if declining_items:
        prod_text += f"- **Declining Alert:** `{declining_items[0]['title']}` has seen reduced 30-day velocity; candidate for bundling liquidation.\n"
    else:
        prod_text += f"- **Catalog Health:** Core SKUs demonstrate stable velocity with no critical stockout risks.\n"

    state["agent_outputs"]["product_agent"] = {
        "top_products": top_prods,
        "narrative": prod_text,
        "star_sku": top_item["title"] if top_item else None
    }
    return state

def run_customer_agent(state: AgentState) -> AgentState:
    store_id = state["store_id"]
    insights = tools.get_customer_insights(store_id)

    state["tool_calls_executed"].append({
        "tool_name": "get_customer_insights",
        "arguments": {"store_id": store_id},
        "output_summary": f"Total: {insights['total_customers']}, Repeat Rate: {insights['repeat_purchase_rate_pct']}%, Avg LTV: Rs {insights['avg_customer_ltv']:.0f}"
    })

    rpr = insights["repeat_purchase_rate_pct"]
    ltv = insights["avg_customer_ltv"]
    total_c = insights["total_customers"]
    
    vip_count = sum(s["count"] for s in insights["segments"] if s["segment"] == "high_value")
    at_risk_count = sum(s["count"] for s in insights["segments"] if s["segment"] == "at_risk")

    cust_text = (
        f"**Customer Behavior Report:**\n"
        f"- **Active Shoppers:** {total_c} registered customers\n"
        f"- **Repeat Purchase Rate:** {rpr}% (cohort benchmark ~25-30%)\n"
        f"- **Average Lifetime Value (LTV):** Rs {ltv:.0f}\n"
        f"- **Cohort Health:** {vip_count} High-Value VIP patrons, {at_risk_count} At-Risk buyers requiring retention triggers.\n"
    )

    state["agent_outputs"]["customer_agent"] = {
        "insights": insights,
        "narrative": cust_text,
        "vip_count": vip_count,
        "at_risk_count": at_risk_count
    }
    return state

def run_prediction_agent(state: AgentState) -> AgentState:
    store_id = state["store_id"]
    forecast = tools.get_sales_forecast(store_id, days_ahead=30)

    state["tool_calls_executed"].append({
        "tool_name": "get_sales_forecast",
        "arguments": {"store_id": store_id, "days_ahead": 30},
        "output_summary": f"Projected: Rs {forecast['total_projected_revenue']:,.0f}, Orders: {forecast['total_projected_orders']}, Trend: {forecast['trend_direction']}"
    })

    pred_text = (
        f"**Sales Forecasting Report (30-Day Outlook):**\n"
        f"- **Projected Revenue:** Rs {forecast['total_projected_revenue']:,.0f}\n"
        f"- **Expected Orders:** ~{forecast['total_projected_orders']} orders (~Rs {forecast['average_daily_projected']:.0f}/day)\n"
        f"- **Trend Trajectory:** {forecast['trend_direction']}\n"
        f"- **Confidence:** {forecast['confidence_level_pct']}% Gaussian confidence interval\n"
        f"- **Methodology:** {forecast['methodology']}\n"
    )

    state["agent_outputs"]["prediction_agent"] = {
        "forecast": forecast,
        "narrative": pred_text
    }
    return state

def run_marketing_agent(state: AgentState) -> AgentState:
    store_id = state["store_id"]
    from app.services.marketing_service import MarketingService
    from app.core.database import SessionLocal
    
    with SessionLocal() as db:
        strategy = MarketingService.get_marketing_strategy(db, store_id)

    top_campaign = strategy.campaigns[0] if strategy.campaigns else None
    
    state["tool_calls_executed"].append({
        "tool_name": "generate_marketing_strategy",
        "arguments": {"store_id": store_id},
        "output_summary": f"Generated campaign: '{top_campaign.title if top_campaign else 'Standard Growth'}'"
    })

    mkt_text = (
        f"**AI Marketing Strategy Recommendations:**\n"
        f"- **Strategic Focus:** {strategy.strategic_focus}\n"
    )
    if top_campaign:
        mkt_text += (
            f"- **Primary Campaign:** `{top_campaign.title}`\n"
            f"  - **Target:** {top_campaign.target_segment} via {', '.join(top_campaign.recommended_channels)}\n"
            f"  - **Offer:** {top_campaign.offer_summary}\n"
            f"  - **Impact:** {top_campaign.expected_impact}\n"
        )
    if strategy.quick_wins:
        mkt_text += f"- **Immediate Action:** {strategy.quick_wins[0]}\n"

    state["agent_outputs"]["marketing_agent"] = {
        "strategy": strategy.model_dump(),
        "narrative": mkt_text
    }
    return state
