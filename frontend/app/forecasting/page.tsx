"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Sparkles,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from "lucide-react";

const ForecastChart = dynamic(
  () => import("@/components/dashboard/ForecastChart").then((mod) => mod.ForecastChart),
  {
    ssr: false,
    loading: () => <div className="h-80 rounded-lg bg-[#faf8f5] animate-pulse" />,
  }
);

export default function ForecastingPage() {
  const [horizon, setHorizon] = useState(30);
  const [forecast, setForecast] = useState<any>(() => ApiClient.getCached("/api/v1/forecasts?days_ahead=30"));
  const [loading, setLoading] = useState(() => !ApiClient.getCached("/api/v1/forecasts?days_ahead=30"));
  const [error, setError] = useState<string | null>(null);

  const loadForecast = async (daysAhead: number, force = false) => {
    const cached = ApiClient.getCached(`/api/v1/forecasts?days_ahead=${daysAhead}`);
    if (force || !cached) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await ApiClient.getForecast(daysAhead, force);
      setForecast(data);
    } catch (e) {
      console.error(e);
      setError("We couldn't load your forecast right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast(horizon);
  }, [horizon]);

  // Combine historical and projected data for continuous time-series visualization
  const combinedChartData = React.useMemo(() => {
    if (!forecast || !forecast.is_sufficient_data) return [];

    const hist = (forecast.historical_points || []).map((pt: any) => ({
      date: pt.date.slice(5), // "MM-DD"
      actualRevenue: pt.revenue,
      projectedRevenue: null,
      lowerBound: null,
      upperBound: null,
    }));

    const proj = (forecast.forecast_points || []).map((pt: any) => ({
      date: pt.date.slice(5),
      actualRevenue: null,
      projectedRevenue: pt.projected_revenue,
      lowerBound: pt.lower_bound,
      upperBound: pt.upper_bound,
    }));

    // Bridge historical to forecast for unbroken visual
    if (hist.length > 0 && proj.length > 0) {
      hist[hist.length - 1].projectedRevenue = hist[hist.length - 1].actualRevenue;
    }

    return [...hist, ...proj];
  }, [forecast]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Sales Forecast</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              What you can expect to sell in the coming weeks
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {[30, 60, 90].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`h-10 sm:h-9 min-h-[40px] inline-flex items-center justify-center px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  horizon === h
                    ? "bg-[#7b1425] text-white shadow-xs"
                    : "bg-white border border-[#e8e2dc] text-[#5a4e50] hover:bg-[#faf8f5]"
                }`}
              >
                Next {h} Days
              </button>
            ))}
          </div>
        </div>

        {error && !forecast ? (
          <div className="p-6 bg-white rounded-xl border border-[#e8e2dc] text-center space-y-3">
            <p className="text-sm text-[#5a4e50]">{error}</p>
            <button
              onClick={() => loadForecast(horizon, true)}
              className="px-4 py-2 bg-[#7b1425] text-white text-xs font-semibold rounded-lg hover:bg-[#600f1c] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading && !forecast ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs h-24 animate-pulse">
                  <div className="h-3 w-24 bg-[#f3ede7] rounded mb-3" />
                  <div className="h-6 w-20 bg-[#f3ede7] rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#e8e2dc]/90 shadow-xs h-80 animate-pulse" />
          </div>
        ) : forecast && forecast.is_sufficient_data ? (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Expected sales</p>
                  <p className="text-2xl font-bold text-[#14090b] mt-1 whitespace-nowrap">
                    {formatCurrency(forecast.total_projected_revenue)}
                  </p>
                </div>
                <p className="text-xs text-[#6f6264] mt-2 truncate">Estimated sales over next {horizon} days</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Expected orders</p>
                  <p className="text-2xl font-bold text-[#14090b] mt-1 whitespace-nowrap">
                    ~{formatNumber(forecast.total_projected_orders)} orders
                  </p>
                </div>
                <p className="text-xs text-[#6f6264] mt-2 truncate">Estimated orders to fulfill</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Average daily sales</p>
                  <p className="text-2xl font-bold text-[#14090b] mt-1 whitespace-nowrap">
                    {formatCurrency(forecast.average_daily_projected)}
                  </p>
                </div>
                <p className="text-xs text-[#6f6264] mt-2 truncate">Estimated daily sales</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Accuracy estimate</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1 whitespace-nowrap">
                    {forecast.confidence_level_pct}%
                  </p>
                </div>
                <p className="text-xs text-[#6f6264] mt-2 truncate">Based on past sales patterns</p>
              </div>
            </div>

            {/* AI Sales Forecast Summary */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-[#FBF1F3]/70 via-[#FBF1F3]/40 to-white border border-[#EBC3CB]/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#380911] font-bold text-sm">
                  <Sparkles size={16} className="text-[#7b1425]" />
                  <span>Forecast summary</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#F6E1E5] text-[#4D0C18] uppercase tracking-wide">
                  {forecast.trend_direction} trend
                </span>
              </div>
              <p className="text-xs text-[#3b2f31] leading-relaxed">
                {forecast.narrative_explanation}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[#6f6264]">
                <HelpCircle size={13} className="text-[#a89b99]" />
                <span>
                  Forecasts are calculated from your previous sales history to help you plan stock and promotions.
                </span>
              </div>
            </div>

            {/* Continuous Chart: Historical Actuals + Statistical Forecast */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-[#e8e2dc]/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#14090b]">Past and expected sales</h3>
                  <p className="text-xs text-[#6f6264]">
                    Solid line is past sales; dashed line is your forecast
                  </p>
                </div>
              </div>

              <ForecastChart data={combinedChartData} />
            </div>
          </>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#e8e2dc] text-center max-w-lg mx-auto">
            <AlertCircle size={36} className="text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#14090b]">More sales data needed</h3>
            <p className="text-xs text-[#6f6264] mt-2 leading-relaxed">
              {forecast?.insufficient_data_reason || "Sellsy needs at least 15 completed orders to generate an accurate forecast for your store."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

