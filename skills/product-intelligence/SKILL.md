---
name: product-intelligence
description: Analyzes catalog performance, product margins, inventory velocity, revenue distribution, and product lifecycle trends.
version: 1.0.0
---

# Skill: Product Intelligence

## Purpose
The **Product Intelligence Skill** systematically scrutinizes product catalog velocity, SKU-level revenues, return concentrations, declining items, and cross-category affinities to identify top revenue generators and underperforming assets.

## When to Use
- When identifying best-selling and worst-performing SKUs over any selected timeframe.
- When an e-commerce merchant asks which products require markdown, re-stocking, or marketing investment.
- When evaluating category revenue concentration (e.g., 80/20 Pareto distribution).
- During multi-agent store diagnostics to uncover product-level catalysts for revenue shifts.

## Required Inputs
- `store_id`: Store identifier.
- `limit`: Number of top/bottom items to evaluate (default 10).
- `sort_metric`: Revenue, units sold, gross margin, or conversion rate.
- `category_filter`: (Optional) Target product category or collection.

## Analysis Instructions
1. **Catalog Stratification**:
   - Classify catalog into 4 quadrants based on Sales Velocity and Gross Margin:
     - *Stars*: High Volume, High Margin (Prime candidates for scale).
     - *Cash Cows*: High Volume, Low Margin (Maintain inventory stability).
     - *Opportunities*: Low Volume, High Margin (Needs marketing spotlight).
     - *Drainers*: Low Volume, Low Margin (Consider discontinuation or bundle liquidation).
2. **Declining SKU Detection**:
   - Compare unit velocity over the last 30 days vs preceding 30 days.
   - Products experiencing $>20\%$ drop in velocity with static price are marked as `Declining`.
3. **Inventory & Revenue Exposure**:
   - Calculate revenue contribution percentage per product relative to total store sales.

## Tool Usage Instructions
- Invoke `get_top_products(store_id, limit, metric)` to retrieve highest performing items.
- Invoke `get_product_performance(store_id, product_id)` for SKU-specific time-series data.

## Output Format
```json
{
  "top_performers": [
    {
      "product_id": "prod_101",
      "title": "Minimalist Ceramic Planter",
      "revenue": 3420.00,
      "units_sold": 76,
      "revenue_share_pct": 27.4,
      "classification": "Star"
    }
  ],
  "declining_products": [
    {
      "product_id": "prod_88",
      "title": "Aroma Diffuser Gen 1",
      "velocity_change_pct": -34.5,
      "recommendation": "Bundle with Lavender Essential Oil to clear remaining 45 units."
    }
  ],
  "category_breakdown": {
    "Home Decor": 64.2,
    "Wellness": 35.8
  }
}
```

## Validation Rules
- `revenue_share_pct` across all products must sum to $\le 100\%$.
- SKU titles and pricing must match the current product catalog database.

## Limitations
- Cost of goods sold (COGS) must be populated in the product record to compute exact margins; otherwise gross revenue is utilized.
