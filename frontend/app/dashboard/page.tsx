"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CategoryDonut } from "@/components/dashboard/CategoryDonut";
import { TopProductsTable } from "@/components/dashboard/TopProductsTable";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { AiInsightsPanel } from "@/components/dashboard/AiInsightsPanel";
import { ApiClient } from "@/lib/api";
import { DollarSign, ShoppingBag, CreditCard, Users, ArrowUpRight, Percent, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await ApiClient.getOverview();
      setData(overview);
    } catch (err: any) {
      setError(err.message || "Failed to load store overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <DashboardLayout daysFilter={days} onDaysChange={setDays}>
      <div className="space-y-6">
        {/* Banner with refresh and status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Executive Performance Hub</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Comprehensive store performance metrics and autonomous AI agent diagnostics
            </p>
          </div>
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-xs font-semibold text-[#3b2f31] shadow-2xs transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadDashboard} className="font-bold underline ml-2">Retry</button>
          </div>
        )}

        {loading && !data ? (
          <div className="py-24 flex flex-col items-center justify-center text-[#a89b99] space-y-3">
            <RefreshCw size={28} className="animate-spin text-[#7b1425]" />
            <p className="text-sm font-medium">Aggregating store metrics & running AI agents...</p>
          </div>
        ) : data ? (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard
                title={data.kpis.total_revenue.title}
                value={data.kpis.total_revenue.value}
                deltaPct={data.kpis.total_revenue.delta_pct}
                trend={data.kpis.total_revenue.trend}
                subtext={data.kpis.total_revenue.subtext}
                icon={<DollarSign size={16} />}
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
                value={data.kpis.average_order_value.value}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Timeline */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8e2dc]/90 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#14090b]">Revenue Timeline</h3>
                    <p className="text-xs text-[#6f6264]">Chronological daily gross sales over selected period</p>
                  </div>
                </div>
                <RevenueChart data={data.trends} />
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-xl border border-[#e8e2dc]/90 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#14090b]">Revenue by Category</h3>
                  <p className="text-xs text-[#6f6264] mb-4">Gross sales contribution by collection</p>
                  <CategoryDonut data={data.category_distribution} />
                </div>
              </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopProductsTable products={data.top_products} />
              <RecentOrdersTable orders={data.recent_orders} />
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

