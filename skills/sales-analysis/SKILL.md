---
name: sales-analysis
description: Analyzes revenue trends, period-over-period comparisons, order volume dynamics, and sales anomalies for e-commerce stores.
version: 1.0.0
---

# Skill: Sales Analysis

## Purpose
The **Sales Analysis Skill** provides rigorous analytical guidelines for evaluating store revenue, transaction volumes, average order value (AOV), and growth trajectories across daily, weekly, monthly, and yearly intervals. It ensures financial explanations are backed by mathematical proof rather than speculation.

## When to Use
- When answering queries regarding store financial health, revenue changes, or growth benchmarks.
- During scheduled performance reviews or automated daily/weekly store rollups.
- When detecting sudden spikes or drops in gross sales or order velocity.
- As the first phase of holistic business diagnostic workflows in the Central Orchestrator.

## Required Inputs
- `store_id`: Unique identifier for the authenticated e-commerce store.
- `date_range`: Target period containing `start_date` and `end_date` (ISO-8601 strings).
- `comparison_period`: Benchmark timeframe (e.g., previous period, same period last year).
- `granularity`: Time aggregation bucket (`daily`, `weekly`, `monthly`).

## Analysis Instructions
1. **Metric Aggregation**:
   - Query total revenue, total fulfilled orders, gross discount value, and average order value ($AOV = \frac{\text{Total Revenue}}{\text{Total Orders}}$).
   - Compute period-over-period delta:
     $$\Delta\% = \frac{\text{Current Period Value} - \text{Previous Period Value}}{\text{Previous Period Value}} \times 100$$
2. **Trend Decomposition**:
   - Evaluate whether revenue shifts are volume-driven ($\Delta$ Orders), price-driven ($\Delta$ AOV), or discount-driven ($\Delta$ Average Discount per Order).
   - Identify top 3 peak revenue days and top 3 lowest revenue days within the window.
3. **Data Integrity & Grounding**:
   - Only cite figures retrieved directly from validated store database records or MCP tool outputs.
   - Flag low-sample warning if total orders in period is below 5.

## Tool Usage Instructions
- Invoke `get_sales_summary(store_id, start_date, end_date)` to retrieve aggregate metrics.
- Invoke `get_revenue_trends(store_id, interval)` to extract daily/weekly trend lines.
- Invoke `get_recent_orders(store_id, limit)` when detailed order line analysis is needed.

## Output Format
Return structured JSON or standard markdown complying with the schema:
```json
{
  "summary": {
    "total_revenue": 12450.50,
    "total_orders": 142,
    "aov": 87.68,
    "revenue_growth_rate_pct": 14.2
  },
  "primary_driver": "volume_growth",
  "trend_observations": [
    "Revenue increased 14.2% primarily propelled by weekend order spikes.",
    "AOV remained resilient at $87.68 (-0.4% variance)."
  ],
  "anomalies": [],
  "data_confidence": "HIGH"
}
```

## Validation Rules
- `total_revenue` must equal sum of completed order revenues.
- Percentage changes must not be computed if denominator is 0 (return `null` or 100% flag).
- No speculative statements regarding external economic factors unless supported by store notes.

## Limitations
- Does not track ad-spend or CAC unless advertising integrations are linked.
- Refund rates may have delayed reporting depending on payment gateway settlement times.
