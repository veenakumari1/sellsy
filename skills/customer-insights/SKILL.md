---
name: customer-insights
description: Segments customer cohorts via RFM metrics, calculates repeat purchase rates, tracks customer lifetime value (LTV), and suggests retention triggers.
version: 1.0.0
---

# Skill: Customer Insights

## Purpose
The **Customer Insights Skill** converts fragmented customer order records into high-fidelity behavioral segments. It calculates essential retention metrics such as Repeat Purchase Rate, Cohort Churn Risk, and Average Customer Lifetime Value.

## When to Use
- When assessing customer loyalty, cohort retention, and repeat buying behavior.
- To detect churn risk among previously high-frequency buyers.
- When merchants ask who their VIP customers are or how to re-engage inactive accounts.
- When generating targeted email marketing or audience segment suggestions.

## Required Inputs
- `store_id`: Store identifier.
- `segment_type`: Optional specific filter (`high_value`, `returning`, `new`, `at_risk`, `inactive`).
- `recency_window_days`: Inactivity threshold (default 60 days).

## Analysis Instructions
1. **RFM Modeling (Recency, Frequency, Monetary)**:
   - *Recency*: Days elapsed since the customer's last order.
   - *Frequency*: Total count of confirmed orders.
   - *Monetary*: Total lifetime spent on store.
2. **Segment Assignment**:
   - **High-Value / VIP**: Top 10% lifetime spend OR orders $\ge 4$ with above-average AOV.
   - **Returning Loyalists**: Orders $\ge 2$ within the last 60 days.
   - **New Buyers**: Exactly 1 order placed within the last 30 days.
   - **At-Risk**: Multiple past orders, but no purchase in 60–120 days.
   - **Inactive / Churned**: No purchase in $>120$ days.
3. **Repeat Purchase Rate (RPR)**:
   $$\text{RPR} = \frac{\text{Customers with } \ge 2 \text{ orders}}{\text{Total Unique Customers}} \times 100$$

## Tool Usage Instructions
- Invoke `get_customer_insights(store_id)` to retrieve aggregate cohort sizes and RFM summaries.

## Output Format
```json
{
  "total_customers": 450,
  "repeat_purchase_rate_pct": 28.4,
  "avg_customer_ltv": 142.80,
  "segments": {
    "high_value": { "count": 42, "avg_spend": 380.50 },
    "returning": { "count": 86, "avg_spend": 195.20 },
    "new": { "count": 110, "avg_spend": 68.00 },
    "at_risk": { "count": 64, "avg_spend": 140.00 },
    "inactive": { "count": 148, "avg_spend": 55.00 }
  },
  "retention_recommendations": [
    "Trigger automated win-back campaign with 15% incentive for 64 at-risk customers.",
    "Introduce early access to new catalog arrivals for the 42 VIP patrons."
  ]
}
```

## Validation Rules
- Customer counts across mutually exclusive segment definitions must reconcile with total active customer base.
- Data grounding: Never synthesize fictional customer identities or emails.

## Limitations
- Does not have access to website browsing sessions unless Google Analytics or Shopify Web Pixels are connected.
