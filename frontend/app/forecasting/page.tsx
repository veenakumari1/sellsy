"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  LineChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";

export default function ForecastingPage() {
  const [horizon, setHorizon] = useState(30);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadForecast = async (daysAhead: number) => {
    setLoading(true);
    try {
      const data = await ApiClient.getForecast(daysAhead);
      setForecast(data);
    } catch (e) {
      console.error(e);
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-[#14090b] text-white p-3 rounded-lg shadow-lg text-xs space-y-1">
          <p className="font-semibold text-[#d4c9c2]">Date: {p.date}</p>
          {p.actualRevenue !== null && (
            <p className="text-[#C26679] font-bold">
              Actual Sales: {formatCurrency(p.actualRevenue)}
            </p>
          )}
          {p.projectedRevenue !== null && (
            <>
              <p className="text-emerald-400 font-bold">
                Projected: {formatCurrency(p.projectedRevenue)}
              </p>
              <p className="text-[#a89b99]">
                Range: {formatCurrency(p.lowerBound)} – {formatCurrency(p.upperBound)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Sales Forecasting & Demand Modeling</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Statistical exponential smoothing projections grounded in verified historical transaction velocities
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[30, 60, 90].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  horizon === h
                    ? "bg-[#7b1425] text-white shadow-xs"
                    : "bg-white border border-[#e8e2dc] text-[#5a4e50] hover:bg-[#faf8f5]"
                }`}
              >
                {h}-Day Outlook
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#a89b99] space-y-3">
            <RefreshCw size={28} className="animate-spin text-[#7b1425]" />
            <p className="text-sm font-medium">Calibrating Holt exponential smoothing models...</p>
          </div>
        ) : forecast && forecast.is_sufficient_data ? (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs">
                <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Projected Revenue</p>
                <p className="text-2xl font-bold text-[#14090b] mt-1">
                  {formatCurrency(forecast.total_projected_revenue)}
                </p>
                <p className="text-xs text-[#6f6264] mt-1">Next {horizon} days expected turnover</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs">
                <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Fulfillment Demand</p>
                <p className="text-2xl font-bold text-[#14090b] mt-1">
                  ~{formatNumber(forecast.total_projected_orders)} orders
                </p>
                <p className="text-xs text-[#6f6264] mt-1">Estimated warehouse fulfillment volume</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs">
                <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Average Daily Projection</p>
                <p className="text-2xl font-bold text-[#14090b] mt-1">
                  {formatCurrency(forecast.average_daily_projected)}
                </p>
                <p className="text-xs text-[#6f6264] mt-1">Expected daily baseline</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs">
                <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Confidence Level</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {forecast.confidence_level_pct}% Certainty
                </p>
                <p className="text-xs text-[#6f6264] mt-1">Statistical Gaussian error interval</p>
              </div>
            </div>

            {/* AI Sales Prediction Agent Explanation */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-[#FBF1F3]/70 via-[#FBF1F3]/40 to-white border border-[#EBC3CB]/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#380911] font-bold text-sm">
                  <Sparkles size={16} className="text-[#7b1425]" />
                  <span>Sales Prediction Agent: Forecast Synthesis</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#F6E1E5] text-[#4D0C18] uppercase tracking-wide">
                  {forecast.trend_direction} Trajectory
                </span>
              </div>
              <p className="text-xs text-[#3b2f31] leading-relaxed">
                {forecast.narrative_explanation}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[#6f6264]">
                <HelpCircle size={13} className="text-[#a89b99]" />
                <span>
                  Methodology: {forecast.methodology}. Projections are mathematical estimates, not guaranteed outcomes.
                </span>
              </div>
            </div>

            {/* Continuous Chart: Historical Actuals + Statistical Forecast */}
            <div className="bg-white p-6 rounded-xl border border-[#e8e2dc]/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#14090b]">Historical vs Projected Revenue</h3>
                  <p className="text-xs text-[#6f6264]">
                    Solid blue represents verified historical sales; dashed green reflects statistical projection with 80% confidence bands
                  </p>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} dy={8} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="actualRevenue" stroke="#7b1425" strokeWidth={2.5} fill="#FBF1F3" fillOpacity={0.4} name="Actual Revenue" />
                    <Area type="monotone" dataKey="projectedRevenue" stroke="#10B981" strokeWidth={2.5} strokeDasharray="5 5" fill="url(#forecastArea)" name="Projected Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#e8e2dc] text-center max-w-lg mx-auto">
            <AlertCircle size={36} className="text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#14090b]">Insufficient Historical Sales Data</h3>
            <p className="text-xs text-[#6f6264] mt-2 leading-relaxed">
              {forecast?.insufficient_data_reason || "Sellsy requires at least 15 completed transactions to construct reliable statistical time-series forecasts."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

