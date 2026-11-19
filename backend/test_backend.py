import sys
import os

# Set working directory to backend
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import init_db, SessionLocal
from app.services.seed_service import seed_demo_store
from app.services.analytics_service import AnalyticsService
from app.services.product_service import ProductService
from app.services.customer_service import CustomerService
from app.services.forecast_service import ForecastService
from app.services.marketing_service import MarketingService
from app.services.report_service import ReportService
from app.mcp import tools
from app.agents.orchestrator import run_agent_workflow

def run_all_tests():
    print("=" * 60)
    print("RUNNING STORSY BACKEND VERIFICATION SUITE")
    print("=" * 60)

    # 1. Initialize DB and Seed Demo Store
    print("\n[1/8] Initializing database & seeding demo store...")
    init_db()
    with SessionLocal() as db:
        user = seed_demo_store(db)
        store = user.stores[0]
        store_id = store.id
        print(f"✓ Demo User created: {user.email}")
        print(f"✓ Demo Store created: '{store.name}' (ID: {store_id})")

    # 2. Test Analytics Service
    print("\n[2/8] Testing Analytics Service...")
    with SessionLocal() as db:
        kpis = AnalyticsService.get_kpis(db, store_id, days=30)
        print(f"✓ Revenue: {kpis.total_revenue.value} (Delta: {kpis.total_revenue.delta_pct}%)")
        print(f"✓ Orders: {kpis.total_orders.value}")
        print(f"✓ AOV: {kpis.average_order_value.value}")
        trends = AnalyticsService.get_sales_trends(db, store_id, days=30)
        print(f"✓ Sales Trend Points: {len(trends.timeline)} daily entries")
        categories = AnalyticsService.get_category_revenue(db, store_id)
        print(f"✓ Category breakdown: {len(categories)} categories")

    # 3. Test Product Service
    print("\n[3/8] Testing Product Service...")
    with SessionLocal() as db:
        prods = ProductService.get_products(db, store_id, limit=10)
        print(f"✓ Retrieved {len(prods)} products")
        top_prods = ProductService.get_top_products(db, store_id, limit=3)
        print(f"✓ Top product: '{top_prods[0].title}' (${top_prods[0].revenue_generated:,.2f})")
        declining = ProductService.get_declining_products(db, store_id)
        print(f"✓ Declining products detected: {len(declining)} items")

    # 4. Test Customer Service
    print("\n[4/8] Testing Customer Insights & RFM Segmentation...")
    with SessionLocal() as db:
        cust_insights = CustomerService.get_insights(db, store_id)
        print(f"✓ Total Customers: {cust_insights.total_customers}")
        print(f"✓ Repeat Purchase Rate: {cust_insights.repeat_purchase_rate}%")
        print(f"✓ Average LTV: ${cust_insights.avg_customer_ltv:,.2f}")
        for s in cust_insights.segments:
            print(f"  - Segment '{s.display_name}': {s.count} shoppers (${s.total_revenue:,.2f})")

    # 5. Test Sales Forecasting
    print("\n[5/8] Testing Statistical Time-Series Forecasting...")
    with SessionLocal() as db:
        fc = ForecastService.generate_forecast(db, store_id, days_ahead=30)
        print(f"✓ Forecast Horizon: {fc.horizon_days} days")
        print(f"✓ Projected Revenue: ${fc.total_projected_revenue:,.2f}")
        print(f"✓ Projected Orders: {fc.total_projected_orders}")
        print(f"✓ Trend Direction: {fc.trend_direction}")
        print(f"✓ Methodology: {fc.methodology}")

    # 6. Test Marketing Strategy Service
    print("\n[6/8] Testing AI Marketing Strategy Service...")
    with SessionLocal() as db:
        strat = MarketingService.get_marketing_strategy(db, store_id)
        print(f"✓ Strategic Focus: {strat.strategic_focus}")
        print(f"✓ Generated Campaigns: {len(strat.campaigns)}")
        print(f"✓ Top Campaign: '{strat.campaigns[0].title}'")

    # 7. Test MCP Tools
    print("\n[7/8] Testing Custom Storsy MCP Tools...")
    mcp_summary = tools.get_sales_summary(store_id, days=30)
    print(f"✓ MCP get_sales_summary -> Revenue: {mcp_summary['total_revenue_display']}")
    mcp_top = tools.get_top_products(store_id, limit=2)
    print(f"✓ MCP get_top_products -> {len(mcp_top)} items returned")
    mcp_cust = tools.get_customer_insights(store_id)
    print(f"✓ MCP get_customer_insights -> {mcp_cust['total_customers']} customers")
    mcp_fc = tools.get_sales_forecast(store_id, days_ahead=30)
    print(f"✓ MCP get_sales_forecast -> Projected: ${mcp_fc['total_projected_revenue']:,.2f}")
    mcp_report = tools.generate_business_report(store_id, "executive")
    print(f"✓ MCP generate_business_report -> Generated: {mcp_report['title']} (File ready: {mcp_report['status']})")

    # 8. Test LangGraph Multi-Agent Orchestration
    print("\n[8/8] Testing LangGraph Multi-Agent Orchestrator...")
    query = "Why did my sales drop and what products should I promote to grow revenue?"
    print(f"Invoking Multi-Agent Workflow with query: '{query}'")
    result = run_agent_workflow(store_id=store_id, query=query)
    print("✓ Orchestrator successfully executed multi-agent pipeline!")
    print(f"✓ Tool calls recorded: {len(result['tool_calls'])}")
    for tc in result['tool_calls']:
        print(f"   -> Executed Tool: {tc['tool_name']}")
    print(f"✓ Suggested follow-up actions: {len(result['suggested_actions'])}")
    print("\nAgent Response Preview:")
    print("-" * 50)
    print(result['response'][:350] + "...")
    print("-" * 50)

    print("\n============================================================")
    print("ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("============================================================")

if __name__ == "__main__":
    run_all_tests()

