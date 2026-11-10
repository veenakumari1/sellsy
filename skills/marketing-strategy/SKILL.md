---
name: marketing-strategy
description: Synthesizes catalog strengths, customer segments, and revenue opportunities to generate actionable growth campaigns and promotion playbooks.
version: 1.0.0
---

# Skill: Marketing Strategy

## Purpose
The **Marketing Strategy Skill** translates quantitative discoveries from sales, product velocity, and customer retention into tactical, high-ROI marketing blueprints. It produces concrete campaign angles, cross-sell bundles, and email schedules tailored to the merchant's actual performance data.

## When to Use
- When merchants ask for actionable advice to boost lagging revenue or liquidate slow-moving inventory.
- When planning seasonal campaigns (Black Friday, Summer Launch, Flash Sales).
- When seeking cross-selling and up-selling pairings based on customer purchase history.
- As the culminating synthesis step in multi-agent store diagnostic sessions.

## Required Inputs
- `store_id`: Store identifier.
- `target_objective`: Primary goal (`revenue_growth`, `customer_retention`, `clear_inventory`, `increase_aov`).
- `sales_summary_data`: Context from Sales Analysis.
- `product_performance_data`: Context from Product Intelligence.
- `customer_segments_data`: Context from Customer Insights.

## Analysis Instructions
1. **Identify the Core Growth Lever**:
   - If AOV is low $\rightarrow$ Focus on Bundle Discounts & Tiered Thresholds ("Spend \$75, get free gift").
   - If Repeat Purchase Rate is low $\rightarrow$ Focus on Automated Post-Purchase Follow-up & VIP Loyalty Tiers.
   - If Specific SKUs are declining $\rightarrow$ Focus on Cross-Sell Pairings with Top Sellers.
2. **Campaign Blueprint Generation**:
   - For each recommendation, define:
     - **Campaign Title**
     - **Target Audience** (e.g., At-Risk Buyers, VIPs, or All Store Visitors)
     - **Hero Offer / Value Proposition**
     - **Recommended Channels** (Email, SMS, Meta Ads, On-Site Banner)
     - **Expected Impact** (Estimated percentage lift on targeted metric)
     - **Execution Steps** (Actionable checklist for the merchant)
3. **Guardrails**:
   - Ground promotions exclusively on products that currently exist in inventory.
   - Do not state that campaigns are already running or ad budgets spent unless explicitly integrated with ad platforms.

## Tool Usage Instructions
- Leverage outputs from `get_sales_summary`, `get_top_products`, and `get_customer_insights`.
- Invoke `generate_business_report(store_id, "marketing")` if exporting a formal marketing plan.

## Output Format
```json
{
  "strategic_focus": "Customer Retention & Basket Size Expansion",
  "recommended_campaigns": [
    {
      "title": "VIP Exclusive Early Drop",
      "target_segment": "High-Value VIPs (Top 10%)",
      "channel": "Email / Klaviyo",
      "hero_product": "Minimalist Ceramic Planter",
      "bundle_suggestion": "Planter + Organic Fertilizer Set",
      "estimated_lift": "+8-12% repeat order rate",
      "action_steps": [
        "Create dedicated email list of VIP customers.",
        "Offer 48-hour exclusive purchase window.",
        "Add personalized note from the founder."
      ]
    }
  ],
  "quick_wins": [
    "Add a $10 cart threshold progress bar to raise current AOV from $68 to $80."
  ]
}
```

## Validation Rules
- All recommended products must exist in the store's current catalog.
- Action items must be concrete and directly executable by a small-to-medium merchant.

## Limitations
- Does not automatically write to external ad accounts or send emails without authorized email marketing integrations (e.g. Klaviyo, Mailchimp).
