---
name: sales-forecasting
description: Computes statistical time-series projections, trend trajectories, and confidence intervals for e-commerce store revenue.
version: 1.0.0
---

# Skill: Sales Forecasting

## Purpose
The **Sales Forecasting Skill** executes statistical time-series forecasting (including Holt-Winters exponential smoothing, weighted moving averages, and linear trend projection) on historical daily order sequences, providing merchants with mathematical 30/60/90-day revenue and order volume expectations.

## When to Use
- When planning future inventory purchases or marketing budgets.
- When merchants ask "What will my revenue look like next month?".
- To evaluate seasonal momentum and trend continuation.
- During quarterly or annual strategic forecasting reviews.

## Required Inputs
- `store_id`: Store identifier.
- `days_ahead`: Forecast horizon (e.g., 30, 60, or 90 days; default 30).
- `historical_window_days`: Backtrack window for training statistical models (minimum 30 days required).

## Analysis Instructions
1. **Data Sufficiency Check**:
   - Check if store has $\ge 14$ days of recorded sales history.
   - If historical days $< 14$, explicitly halt forecast calculation and notify user that more historical transactions are required to achieve statistical significance.
2. **Time-Series Decomposition**:
   - Aggregate daily revenue sequence $y_t$.
   - Compute 7-day rolling moving average to dampen day-of-week noise.
   - Fit double exponential smoothing (level + trend):
     $$\ell_t = \alpha y_t + (1 - \alpha)(\ell_{t-1} + b_{t-1})$$
     $$b_t = \beta(\ell_t - \ell_{t-1}) + (1 - \beta)b_{t-1}$$
     $$\hat{y}_{t+h} = \ell_t + h b_t$$
3. **Uncertainty & Confidence Bands**:
   - Compute residual standard deviation $\sigma_e$.
   - Calculate $80\%$ confidence intervals: $[\hat{y} - 1.28\sigma_e\sqrt{h}, \hat{y} + 1.28\sigma_e\sqrt{h}]$.
4. **Narrative Explanation**:
   - Translate numerical outputs into plain English context. Highlight upward/downward slope and potential holiday/seasonal factors.

## Tool Usage Instructions
- Invoke `get_sales_forecast(store_id, days_ahead)` to compute statistical series and bounds.

## Output Format
```json
{
  "horizon_days": 30,
  "projected_revenue": 18450.00,
  "projected_orders": 210,
  "confidence_band": {
    "lower_bound": 16200.00,
    "upper_bound": 20700.00,
    "confidence_level_pct": 80
  },
  "trend_direction": "UPWARD",
  "average_daily_projected": 615.00,
  "methodology": "Holt Double Exponential Smoothing (alpha=0.3, beta=0.1)",
  "narrative": "Based on a 12% month-over-month acceleration in order velocity, next month's sales are projected at $18,450.00 with moderate certainty."
}
```

## Validation Rules
- Projected values must be non-negative ($\ge 0$).
- Upper bound must strictly exceed lower bound.
- Clearly label projections as estimates, never guaranteed financial promises.

## Limitations
- Black swan events, unexpected supply chain disruptions, or sudden viral TikTok surges cannot be foreseen by purely statistical time-series models.
