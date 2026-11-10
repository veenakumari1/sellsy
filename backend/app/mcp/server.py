"""
Sellsy Custom Model Context Protocol (MCP) Server.
Exposes specialized e-commerce intelligence tools using the official Python MCP SDK.
"""

import sys
import os

# Add backend directory to sys.path so imports resolve cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from mcp.server.mcpserver import MCPServer
from app.mcp import tools

# Initialize Sellsy MCP Server
mcp_server = MCPServer("sellsy-intelligence-server")

@mcp_server.tool()
def get_sales_summary(store_id: str, days: int = 30) -> dict:
    """
    Retrieve aggregated revenue, order count, AOV, and growth percentages for a store.
    """
    return tools.get_sales_summary(store_id, days)

@mcp_server.tool()
def get_top_products(store_id: str, limit: int = 5, metric: str = "revenue") -> list:
    """
    Retrieve top selling products ranked by revenue or units sold.
    """
    return tools.get_top_products(store_id, limit, metric)

@mcp_server.tool()
def get_product_performance(store_id: str, product_id: str) -> dict:
    """
    Retrieve in-depth inventory, margin, and velocity metrics for a specific product SKU.
    """
    return tools.get_product_performance(store_id, product_id)

@mcp_server.tool()
def get_customer_insights(store_id: str) -> dict:
    """
    Retrieve customer RFM segment counts, repeat purchase rate, and retention recommendations.
    """
    return tools.get_customer_insights(store_id)

@mcp_server.tool()
def get_revenue_trends(store_id: str, days: int = 30) -> dict:
    """
    Retrieve daily chronological revenue and order time-series for trend analysis.
    """
    return tools.get_revenue_trends(store_id, days)

@mcp_server.tool()
def get_sales_forecast(store_id: str, days_ahead: int = 30) -> dict:
    """
    Compute statistical exponential smoothing sales projections with 80% confidence bands.
    """
    return tools.get_sales_forecast(store_id, days_ahead)

@mcp_server.tool()
def get_recent_orders(store_id: str, limit: int = 8) -> list:
    """
    Retrieve recent transactions with order status and buyer email.
    """
    return tools.get_recent_orders(store_id, limit)

@mcp_server.tool()
def generate_business_report(store_id: str, report_type: str = "executive") -> dict:
    """
    Generate an executive PDF or CSV business intelligence report for the store.
    """
    return tools.generate_business_report(store_id, report_type)

def main():
    """Run the MCP server over standard input/output transport."""
    print("Starting Sellsy MCP Intelligence Server via stdio transport...", file=sys.stderr)
    mcp_server.run()

if __name__ == "__main__":
    main()
