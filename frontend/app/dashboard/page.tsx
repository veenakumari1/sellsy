"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TopProductsTable } from "@/components/dashboard/TopProductsTable";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { AiInsightsPanel } from "@/components/dashboard/AiInsightsPanel";
import { ApiClient } from "@/lib/api";
import { realtimeClient } from "@/lib/realtime";
import { formatCurrency } from "@/lib/utils";
import { LiquidGauge } from "@/components/ui/liquid-gauge";
import { Coins, ShoppingBag, CreditCard, Users, ArrowUpRight, Percent, RefreshCw, Zap } from "lucide-react";

const RevenueChart = dynamic(() => import("@/components/dashboard/RevenueChart").then((m) => m.RevenueChart), {
  ssr: false,
  loading: () => <div className="h-72 flex items-center justify-center text-[#a89b99] text-xs">Loading chart...</div>,
});

const CategoryDonut = dynamic(() => import("@/components/dashboard/CategoryDonut").then((m) => m.CategoryDonut), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-[#a89b99] text-xs">Loading chart...</div>,
});

export default function DashboardPage() {
  const [data, setData] = useState<any>(() => ApiClient.getCached("/api/v1/analytics/overview"));
  const [loading, setLoading] = useState(() => !ApiClient.getCached("/api/v1/analytics/overview"));
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [livePulse, setLivePulse] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const loadDashboard = async (force = false) => {
    if (force || !ApiClient.getCached("/api/v1/analytics/overview")) {
      setLoading(true);
    }
    setError(null);
    try {
      const overview = await ApiClient.getOverview(force);
      setData(overview);
    } catch (err: any) {
      if (!data) {
        setError(err.message || "Failed to load store overview.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    // Subscribe to live WebSocket metric updates and notifications
    if (realtimeClient) {
      const unsubscribe = realtimeClient.subscribe((event) => {
        if (event.type === "METRIC_UPDATE" || event.type === "NOTIFICATION") {
          // Silent real-time background update without flash or spinner
          ApiClient.getOverview(true)
            .then((newData) => {
              setData(newData);
              setLivePulse(true);
              setTimeout(() => setLivePulse(false), 2000);
            })
            .catch(() => {});
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleSimulateOrder = async () => {
    setSimulating(true);
    try {
      await ApiClient.simulateLiveOrder();
    } catch (err) {
      console.error("Order simulation failed", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <DashboardLayout daysFilter={days} onDaysChange={setDays}>
      <div className="space-y-6">
        {/* Banner with simple language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Home</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Here&apos;s how your store is doing
            </p>
          </div>
          {process.env.NODE_ENV === "development" && (
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <button
                onClick={handleSimulateOrder}
                disabled={simulating}
                className="h-10 sm:h-9 min-h-[40px] inline-flex items-center gap-1.5 px-3 rounded-lg border border-[#7b1425]/30 bg-white hover:bg-[#FBF1F3] text-xs font-semibold text-[#7b1425] shadow-2xs transition-colors self-start sm:self-auto disabled:opacity-50 whitespace-nowrap"
                title="Test real-time WebSocket order ingestion & live broadcast"
              >
                <Zap size={13} className={simulating ? "animate-spin flex-shrink-0" : "flex-shrink-0"} />
                <span>Simulate Order</span>
              </button>
              <button
                onClick={() => loadDashboard(true)}
                disabled={loading}
                className="h-10 sm:h-9 min-h-[40px] inline-flex items-center gap-1.5 px-3 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-xs font-semibold text-[#3b2f31] shadow-2xs transition-colors self-start sm:self-auto whitespace-nowrap"
              >
                <RefreshCw size={13} className={loading ? "animate-spin flex-shrink-0" : "flex-shrink-0"} />
                <span>Refresh Analytics</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => loadDashboard(true)} className="font-bold underline ml-2 hover:text-rose-900">Try again</button>
          </div>
        )}

        {loading && !data ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-[#e8e2dc]/80 p-5 h-28 flex flex-col justify-between">
                  <div className="h-3 w-20 bg-[#f3ede7] rounded" />
                  <div className="h-7 w-24 bg-[#f3ede7] rounded" />
                  <div className="h-3 w-16 bg-[#f3ede7] rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#e8e2dc]/80 p-6 h-48 flex items-center justify-center text-xs text-[#a89b99]">
              Loading store details...
            </div>
          </div>
        ) : data ? (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard
                title={data.kpis.total_revenue.title}
                value={formatCurrency(data.kpis.total_revenue.numeric_value ?? data.kpis.total_revenue.value)}
                deltaPct={data.kpis.total_revenue.delta_pct}
                trend={data.kpis.total_revenue.trend}
                subtext={data.kpis.total_revenue.subtext}
                icon={<Coins size={16} />}
              />
              <KpiCard
                title={data.kpis.total_orders.title}
                value={data.kpis.total_orders.value}
                deltaPct={data.kpis.total_orders.delta_pct}
                trend={data.kpis.total_orders.trend}
                subtext={data.kpis.total_orders.subtext}
                icon={<ShoppingBag size={16} />}
              />
              <KpiCard
                title={data.kpis.average_order_value.title}
                value={formatCurrency(data.kpis.average_order_value.numeric_value ?? data.kpis.average_order_value.value)}
                deltaPct={data.kpis.average_order_value.delta_pct}
                trend={data.kpis.average_order_value.trend}
                subtext={data.kpis.average_order_value.subtext}
                icon={<CreditCard size={16} />}
              />
              <KpiCard
                title={data.kpis.total_customers.title}
                value={data.kpis.total_customers.value}
                deltaPct={data.kpis.total_customers.delta_pct}
                trend={data.kpis.total_customers.trend}
                subtext={data.kpis.total_customers.subtext}
                icon={<Users size={16} />}
              />
              <KpiCard
                title={data.kpis.conversion_rate.title}
                value={data.kpis.conversion_rate.value}
                deltaPct={data.kpis.conversion_rate.delta_pct}
                trend={data.kpis.conversion_rate.trend}
                subtext={data.kpis.conversion_rate.subtext}
                icon={<Percent size={16} />}
              />
              <KpiCard
                title={data.kpis.revenue_growth.title}
                value={`${data.kpis.revenue_growth.delta_pct}%`}
                deltaPct={data.kpis.revenue_growth.delta_pct}
                trend={data.kpis.revenue_growth.trend}
                subtext={data.kpis.revenue_growth.subtext}
                icon={<ArrowUpRight size={16} />}
              />
            </div>

            {/* AI Insights Engine Panel */}
            <AiInsightsPanel insights={data.ai_insights} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Revenue Timeline */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8e2dc]/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#14090b]">Revenue Timeline</h3>
                    <p className="text-xs text-[#6f6264]">Chronological daily gross sales over selected period</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <RevenueChart data={data.trends} />
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-xl border border-[#e8e2dc]/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-sm font-bold text-[#14090b]">Revenue by Category</h3>
                  <p className="text-xs text-[#6f6264] mb-4">Gross sales contribution by collection</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <CategoryDonut data={data.category_distribution} />
                </div>
              </div>
            </div>

            {/* Revenue Goal & Top Products Row */}
            {(() => {
              const currentRevenue = Number(data?.kpis?.total_revenue?.numeric_value ?? 0);
              const revenueGoal = 250000;
              const revenuePercent = revenueGoal > 0 ? Math.min(100, Math.round((currentRevenue / revenueGoal) * 100)) : 0;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {/* Monthly Revenue Goal Liquid Gauge */}
                  <div className="flex justify-center">
                    <LiquidGauge
                      label="Monthly revenue goal"
                      value={revenuePercent}
                      total={revenueGoal}
                      unit="Rs"
                      readOnly={true}
                      subline={`${formatCurrency(currentRevenue)} of ${formatCurrency(revenueGoal)}`}
                      statusText={revenuePercent >= 100 ? "Goal reached!" : `${Math.round(revenuePercent)}% achieved`}
                      className="w-full max-w-full h-full min-h-[340px] rounded-xl border-[#e8e2dc]/90"
                    />
                  </div>

                  {/* Top Products Table */}
                  <div className="lg:col-span-2">
                    <TopProductsTable products={data.top_products} />
                  </div>
                </div>
              );
            })()}

            {/* Recent Orders Table */}
            <RecentOrdersTable orders={data.recent_orders} />
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

