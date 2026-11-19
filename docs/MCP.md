# Storsy Custom Model Context Protocol (MCP) Server

---

## 1. Overview & Specification

Storsy implements a dedicated Model Context Protocol (MCP) server utilizing the official Python MCP SDK (`mcp`). The server exposes 8 verified tools that allow autonomous AI agents and external MCP clients to interact safely with store database records.

---

## 2. MCP Tools Catalog

| Tool Name | Parameters | Return Schema | Description |
|---|---|---|---|
| `get_sales_summary` | `store_id: str, days: int = 30` | `dict` | Aggregated revenue, total orders, AOV, and growth rate. |
| `get_top_products` | `store_id: str, limit: int = 5, metric: str = "revenue"` | `list[dict]` | Catalog items ranked by sales volume and gross turnover. |
| `get_product_performance` | `store_id: str, product_id: str` | `dict` | In-depth SKU metrics, profit margins, and monthly history. |
| `get_customer_insights` | `store_id: str` | `dict` | Customer RFM cohorts, repeat purchase rate, and LTV. |
| `get_revenue_trends` | `store_id: str, days: int = 30` | `dict` | Chronological daily sales time-series for trend analysis. |
| `get_sales_forecast` | `store_id: str, days_ahead: int = 30` | `dict` | Statistical exponential smoothing forecast & confidence bands. |
| `get_recent_orders` | `store_id: str, limit: int = 8` | `list[dict]` | Recent order transactions with financial and fulfillment status. |
| `generate_business_report` | `store_id: str, report_type: str = "executive"` | `dict` | Generates verified executive business report (PDF/CSV). |

---

## 3. Running the Storsy MCP Server

The MCP server can be launched directly over stdio transport:

```bash
python -m app.mcp.server
```

### Example MCP Tool Invocation Trace
```json
{
  "tool_name": "get_sales_summary",
  "arguments": {
    "store_id": "995ae8aa-58c3-4241-b857-7cdf74b8661a",
    "days": 30
  },
  "result": {
    "store_id": "995ae8aa-58c3-4241-b857-7cdf74b8661a",
    "period_days": 30,
    "total_revenue": 11585.38,
    "total_revenue_display": "$11,585.38",
    "revenue_growth_pct": 36.6,
    "total_orders": 99,
    "average_order_value": 117.02,
    "total_customers": 45,
    "benchmark_conversion_rate": "3.42%"
  }
}
```

