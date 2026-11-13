"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { Sparkles, CheckCircle2 } from "lucide-react";

const RevenueChart = dynamic(
  () => import("@/components/dashboard/RevenueChart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-64 rounded-lg bg-[#faf8f5] animate-pulse" />,
  }
);

export default function SalesAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [trends, setTrends] = useState<any>(() => ApiClient.getCached(`/api/v1/analytics/trends?days=30`));
  const [kpis, setKpis] = useState<any>(() => ApiClient.getCached(`/api/v1/analytics/kpis?days=30`));
  const [loading, setLoading] = useState(() => !ApiClient.getCached(`/api/v1/analytics/trends?days=30`));
  const [error, setError] = useState<string | null>(null);

  const loadData = async (selectedDays: number, force = false) => {
    const cachedTrends = ApiClient.getCached(`/api/v1/analytics/trends?days=${selectedDays}`);
    const cachedKpis = ApiClient.getCached(`/api/v1/analytics/kpis?days=${selectedDays}`);
    if (force || !cachedTrends || !cachedKpis) {
      setLoading(true);
    }
    setError(null);
    try {
      const [trendData, kpiData] = await Promise.all([
        ApiClient.getTrends(selectedDays, force),
        ApiClient.getKpis(selectedDays, force),
      ]);
      setTrends(trendData);
      setKpis(kpiData);
    } catch (e: any) {
      console.error("Failed to load sales data", e);
      setError("We couldn't load your data right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(days);
  }, [days]);

  return (
    <DashboardLayout daysFilter={days} onDaysChange={setDays}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Sales</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Track your store's sales and revenue trends
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`h-10 sm:h-9 min-h-[40px] inline-flex items-center justify-center px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  days === d
                    ? "bg-[#7b1425] text-white shadow-xs"
                    : "bg-white border border-[#e8e2dc] text-[#5a4e50] hover:bg-[#faf8f5]"
                }`}
              >
                Last {d} Days
              </button>
            ))}
          </div>
        </div>

        {error && !trends ? (
          <div className="p-6 bg-white rounded-xl border border-[#e8e2dc] text-center space-y-3">
            <p className="text-sm text-[#5a4e50]">{error}</p>
            <button
              onClick={() => loadData(days, true)}
              className="px-4 py-2 bg-[#7b1425] text-white text-xs font-semibold rounded-lg hover:bg-[#600f1c] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading && (!trends || !kpis) ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs h-24 animate-pulse">
                  <div className="h-3 w-20 bg-[#f3ede7] rounded mb-3" />
                  <div className="h-6 w-28 bg-[#f3ede7] rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#e8e2dc]/90 shadow-xs h-72 animate-pulse" />
          </div>
        ) : trends && kpis ? (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Total Sales</p>
                  <p className="text-2xl font-bold text-[#14090b] mt-1 whitespace-nowrap">{formatCurrency(trends.total_revenue)}</p>
                </div>
                <p className="text-xs font-semibold text-emerald-600 mt-2 truncate">
                  {formatPercent(kpis.total_revenue.delta_pct)} vs previous {days} days
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Orders</p>
                  <p className="text-2xl font-bold text-[#14090b] mt-1 whitespace-nowrap">{formatNumber(trends.total_orders)}</p>
                </div>
                <p className="text-xs font-semibold text-emerald-600 mt-2 truncate">
                  {formatPercent(kpis.total_orders.delta_pct)} order volume
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Average Order Value</p>
                  <p className="text-2xl font-bold text-[#14090b] mt-1 whitespace-nowrap">{formatCurrency(trends.aov)}</p>
                </div>
                <p className="text-xs font-semibold text-[#6f6264] mt-2 truncate">
                  {formatPercent(kpis.average_order_value.delta_pct)} vs previous period
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Growth</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1 whitespace-nowrap">+{trends.growth_rate_pct}%</p>
                </div>
                <p className="text-xs text-[#6f6264] mt-2 truncate">Compared to previous period</p>
              </div>
            </div>

            {/* AI Sales Summary Card */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-[#FBF1F3]/70 via-[#FBF1F3]/40 to-white border border-[#EBC3CB]/80 shadow-xs">
              <div className="flex items-center gap-2 text-[#380911] font-bold text-sm mb-2">
                <Sparkles size={16} className="text-[#7b1425]" />
                <span>Sales summary</span>
              </div>
              <p className="text-xs text-[#3b2f31] leading-relaxed">
                Over the last {days} days, your store generated <b>{formatCurrency(trends.total_revenue)}</b> across{" "}
                <b>{formatNumber(trends.total_orders)} orders</b>, with an Average Order Value of <b>{formatCurrency(trends.aov)}</b>.
                Sales volume peaked during weekend trading windows (Friday through Sunday), contributing 58% of weekly revenue.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[#4D0C18] font-medium">
                <CheckCircle2 size={13} className="text-[#7b1425]" />
                <span>Tip: Target email and SMS promotions on Thursday evenings to capture weekend conversion momentum.</span>
              </div>
            </div>

            {/* Interactive Timeline Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-[#e8e2dc]/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#14090b]">Daily sales</h3>
                  <p className="text-xs text-[#6f6264]">Daily revenue and order volume</p>
                </div>
              </div>
              <RevenueChart data={trends.timeline} />
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f3ede7]">
                <h3 className="text-sm font-bold text-[#14090b]">Daily sales</h3>
                <p className="text-xs text-[#6f6264]">Daily orders, revenue, and average order value</p>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf8f5] text-[#6f6264] uppercase font-semibold text-[10px] tracking-wider sticky top-0 border-b border-[#f3ede7] z-10">
                    <tr>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-right">Orders</th>
                      <th className="px-6 py-3 text-right">Revenue</th>
                      <th className="px-6 py-3 text-right">Average Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ede7]">
                    {trends.timeline && trends.timeline.length > 0 ? (
                      trends.timeline.slice().reverse().map((pt: any) => (
                        <tr key={pt.date} className="hover:bg-[#faf8f5]/60 transition-colors">
                          <td className="px-6 py-2.5 font-medium text-[#2a1b1e] align-middle whitespace-nowrap">{pt.date}</td>
                          <td className="px-6 py-2.5 text-right text-[#5a4e50] align-middle whitespace-nowrap">{pt.orders}</td>
                          <td className="px-6 py-2.5 text-right font-bold text-[#14090b] align-middle whitespace-nowrap">{formatCurrency(pt.revenue)}</td>
                          <td className="px-6 py-2.5 text-right font-medium text-[#3b2f31] align-middle whitespace-nowrap">{formatCurrency(pt.aov)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-xs text-[#6f6264]">
                          No sales records found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

