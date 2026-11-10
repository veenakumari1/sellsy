import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.models import Order
from app.schemas import (
    ForecastResultOut, ForecastPoint, SalesTrendPoint
)

class ForecastService:
    @staticmethod
    def generate_forecast(db: Session, store_id: str, days_ahead: int = 30) -> ForecastResultOut:
        now = datetime.utcnow()
        lookback_days = 90
        start_date = now - timedelta(days=lookback_days)

        orders = db.query(Order).filter(
            Order.store_id == store_id,
            Order.created_at >= start_date,
            Order.financial_status != "refunded"
        ).order_by(Order.created_at.asc()).all()

        # Group by date
        daily_data: Dict[str, Dict[str, float]] = {}
        for d in range(lookback_days + 1):
            date_str = (start_date + timedelta(days=d)).strftime("%Y-%m-%d")
            daily_data[date_str] = {"revenue": 0.0, "orders": 0}

        for o in orders:
            d_str = o.created_at.strftime("%Y-%m-%d")
            if d_str in daily_data:
                daily_data[d_str]["revenue"] += o.total_price
                daily_data[d_str]["orders"] += 1

        sorted_days = sorted(daily_data.keys())
        revenues = [daily_data[d]["revenue"] for d in sorted_days]
        order_counts = [daily_data[d]["orders"] for d in sorted_days]

        # Check data sufficiency
        active_sales_days = sum(1 for r in revenues if r > 0)
        if len(orders) < 15 or active_sales_days < 10:
            return ForecastResultOut(
                horizon_days=days_ahead,
                total_projected_revenue=0.0,
                total_projected_orders=0,
                average_daily_projected=0.0,
                confidence_level_pct=0,
                trend_direction="INSUFFICIENT_DATA",
                methodology="Holt Linear Exponential Smoothing",
                narrative_explanation="Insufficient historical sales data. Sellsy requires at least 15 completed transactions across 10 distinct days to generate statistically meaningful forecasts.",
                historical_points=[],
                forecast_points=[],
                is_sufficient_data=False,
                insufficient_data_reason="Less than 15 recorded orders available for statistical time-series calibration."
            )

        # Historical points
        historical_points = []
        for d in sorted_days[-30:]:  # last 30 days for clean chart display
            rev = round(daily_data[d]["revenue"], 2)
            ord_cnt = int(daily_data[d]["orders"])
            aov = round(rev / ord_cnt, 2) if ord_cnt > 0 else 0.0
            historical_points.append(SalesTrendPoint(
                date=d,
                revenue=rev,
                orders=ord_cnt,
                aov=aov
            ))

        # Holt's Linear Exponential Smoothing
        # Level: l_t = alpha * y_t + (1 - alpha) * (l_{t-1} + b_{t-1})
        # Trend: b_t = beta * (l_t - l_{t-1}) + (1 - beta) * b_{t-1}
        alpha = 0.3
        beta = 0.1

        y = np.array(revenues, dtype=float)
        n = len(y)

        # Initialize
        level = y[0] if y[0] > 0 else np.mean(y[:7])
        trend = np.mean(np.diff(y[:14])) if len(y) > 14 else 0.0

        levels = [level]
        trends = [trend]
        residuals = []

        for t in range(1, n):
            prev_level = levels[-1]
            prev_trend = trends[-1]
            fitted = prev_level + prev_trend
            residuals.append(y[t] - fitted)

            curr_level = alpha * y[t] + (1 - alpha) * (prev_level + prev_trend)
            curr_trend = beta * (curr_level - prev_level) + (1 - beta) * prev_trend

            levels.append(curr_level)
            trends.append(curr_trend)

        last_level = levels[-1]
        last_trend = trends[-1]
        # Dampen aggressive trend extrapolation to avoid unrealistic divergence
        dampening_factor = 0.95

        std_residual = float(np.std(residuals)) if len(residuals) > 0 else 50.0

        # Calculate average historical AOV for order estimation
        total_hist_rev = sum(revenues)
        total_hist_ord = sum(order_counts)
        avg_aov = total_hist_rev / total_hist_ord if total_hist_ord > 0 else 75.0

        forecast_points = []
        total_proj_rev = 0.0
        total_proj_ord = 0

        last_date = datetime.strptime(sorted_days[-1], "%Y-%m-%d")

        for h in range(1, days_ahead + 1):
            future_date = (last_date + timedelta(days=h)).strftime("%Y-%m-%d")
            
            # Dampened projection: y_hat = level + trend * sum(phi^i)
            cumulative_trend = sum(last_trend * (dampening_factor ** i) for i in range(1, h + 1))
            proj_rev = max(0.0, last_level + cumulative_trend)

            # Uncertainty expands with horizon sqrt(h)
            uncertainty = 1.28 * std_residual * math.sqrt(1 + (h / 7.0))
            lower = max(0.0, round(proj_rev - uncertainty, 2))
            upper = round(proj_rev + uncertainty, 2)
            proj_rev_rounded = round(proj_rev, 2)

            proj_orders = max(1, int(round(proj_rev_rounded / avg_aov))) if proj_rev_rounded > 0 else 0

            total_proj_rev += proj_rev_rounded
            total_proj_ord += proj_orders

            forecast_points.append(ForecastPoint(
                date=future_date,
                projected_revenue=proj_rev_rounded,
                lower_bound=lower,
                upper_bound=upper,
                projected_orders=proj_orders
            ))

        avg_daily = round(total_proj_rev / days_ahead, 2)
        
        # Determine trend direction
        if last_trend > 2.0:
            direction = "UPWARD"
        elif last_trend < -2.0:
            direction = "DOWNWARD"
        else:
            direction = "STABLE"

        # Generate grounded narrative
        growth_pct = round((last_trend * 30 / max(1.0, last_level)) * 100, 1)
        if direction == "UPWARD":
            narrative = (
                f"Historical sales indicate an accelerating trajectory (+{growth_pct}% projected 30-day velocity). "
                f"Projected store revenue for the upcoming {days_ahead} days stands at ${total_proj_rev:,.2f} "
                f"(expected range ${sum(p.lower_bound for p in forecast_points):,.2f} - ${sum(p.upper_bound for p in forecast_points):,.2f}). "
                f"Based on historical AOV (${avg_aov:.2f}), prepare inventory fulfillment for approximately {total_proj_ord} customer orders."
            )
        elif direction == "DOWNWARD":
            narrative = (
                f"Historical sales exhibit slight deceleration ({growth_pct}% variance). "
                f"Projected revenue over the next {days_ahead} days is estimated at ${total_proj_rev:,.2f}. "
                f"Inventory demand is projected at {total_proj_ord} orders. Consider implementing customer retention playbooks and bundle discounts to counter the trend."
            )
        else:
            narrative = (
                f"Store sales demonstrate consistent baseline velocity. Projected {days_ahead}-day revenue is "
                f"${total_proj_rev:,.2f} across approximately {total_proj_ord} orders ($ {avg_daily:.2f}/day average). "
                f"Expected 80% confidence interval spans ${sum(p.lower_bound for p in forecast_points):,.2f} to ${sum(p.upper_bound for p in forecast_points):,.2f}."
            )

        return ForecastResultOut(
            horizon_days=days_ahead,
            total_projected_revenue=round(total_proj_rev, 2),
            total_projected_orders=total_proj_ord,
            average_daily_projected=avg_daily,
            confidence_level_pct=80,
            trend_direction=direction,
            methodology="Holt Linear Exponential Smoothing with 80% Residual Gaussian Uncertainty",
            narrative_explanation=narrative,
            historical_points=historical_points,
            forecast_points=forecast_points,
            is_sufficient_data=True,
            insufficient_data_reason=None
        )
