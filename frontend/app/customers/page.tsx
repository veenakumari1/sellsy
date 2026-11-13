"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import {
  UserCheck,
  ShieldAlert,
  Crown,
  Search,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

export default function CustomersPage() {
  const [insights, setInsights] = useState<any>(() => ApiClient.getCached("/api/v1/customers/insights"));
  const [customers, setCustomers] = useState<any[]>(() => ApiClient.getCached("/api/v1/customers") || []);
  const [segment, setSegment] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(() => !ApiClient.getCached("/api/v1/customers/insights"));
  const [error, setError] = useState<string | null>(null);

  const loadData = async (segFilter?: string, force = false) => {
    const cachedInsights = ApiClient.getCached("/api/v1/customers/insights");
    const query = new URLSearchParams();
    if (segFilter && segFilter !== "all") query.append("segment", segFilter);
    if (search) query.append("search", search);
    const qs = query.toString();
    const custEp = `/api/v1/customers${qs ? `?${qs}` : ""}`;
    const cachedCust = ApiClient.getCached(custEp);

    if (force || !cachedInsights || !cachedCust) {
      setLoading(true);
    }
    setError(null);
    try {
      const [insightsData, custList] = await Promise.all([
        ApiClient.getCustomerInsights(force),
        ApiClient.getCustomers({ segment: segFilter !== "all" ? segFilter : undefined, search }, force),
      ]);
      setInsights(insightsData);
      setCustomers(custList);
    } catch (e) {
      console.error(e);
      setError("We couldn't load your customer data right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(segment);
  }, [segment]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(segment);
  };

  const getSegmentPill = (seg: string) => {
    switch (seg) {
      case "high_value":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Crown size={12} className="text-amber-500" />
            <span>Top customer</span>
          </span>
        );
      case "returning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF1F3] text-[#620F1E] border border-[#EBC3CB]">
            <UserCheck size={12} className="text-[#A3243A]" />
            <span>Returning</span>
          </span>
        );
      case "at_risk":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert size={12} className="text-rose-500" />
            <span>Needs attention</span>
          </span>
        );
      case "new":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>New</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f3ede7] text-[#5a4e50]">
            <span>Inactive</span>
          </span>
        );
    }
  };

  const recommendations: string[] = Array.isArray(insights?.recommendations)
    ? insights.recommendations
    : Array.isArray(insights?.retention_recommendations)
    ? insights.retention_recommendations
    : [];

  const segments: any[] = Array.isArray(insights?.segments) ? insights.segments : [];
  const repeatRate = insights?.repeat_purchase_rate_pct ?? insights?.repeat_purchase_rate ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Customers</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Understand who buys from you and how often they return
            </p>
          </div>
        </div>

        {error && !insights && customers.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-[#e8e2dc] text-center space-y-3">
            <p className="text-sm text-[#5a4e50]">{error}</p>
            <button
              onClick={() => loadData(segment, true)}
              className="px-4 py-2 bg-[#7b1425] text-white text-xs font-semibold rounded-lg hover:bg-[#600f1c] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading && (!insights || customers.length === 0) ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs h-24 animate-pulse">
                  <div className="h-3 w-24 bg-[#f3ede7] rounded mb-3" />
                  <div className="h-6 w-20 bg-[#f3ede7] rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs h-64 animate-pulse" />
          </div>
        ) : (
          <>
            {insights && (
              <>
                {/* Top Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                  <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                    <div>
                      <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Total Customers</p>
                      <p className="text-2xl font-bold text-[#14090b] mt-1 whitespace-nowrap">{formatNumber(insights.total_customers || 0)}</p>
                    </div>
                    <p className="text-xs text-[#6f6264] mt-2 truncate">Unique customer accounts</p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                    <div>
                      <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Repeat Customer Rate</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1 whitespace-nowrap">{repeatRate}%</p>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium mt-2 truncate">Customers who bought more than once</p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                    <div>
                      <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider truncate">Average Spend Per Customer</p>
                      <p className="text-2xl font-bold text-[#14090b] mt-1 whitespace-nowrap">{formatCurrency(insights.avg_customer_ltv || 0)}</p>
                    </div>
                    <p className="text-xs text-[#6f6264] mt-2 truncate">Average total spend per customer</p>
                  </div>
                </div>

                {/* AI Customer Tips */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-purple-50/70 via-[#FBF1F3]/40 to-white border border-purple-200/80 shadow-xs">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-sm mb-2">
                    <Sparkles size={16} className="text-purple-600" />
                    <span>Customer tips</span>
                  </div>
                  <div className="space-y-2 mt-2">
                    {recommendations.length > 0 ? (
                      recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[#3b2f31]">
                          <CheckCircle2 size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#6f6264]">No tips available for this group.</p>
                    )}
                  </div>
                </div>

                {/* Segment Selector Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  <button
                    onClick={() => setSegment("all")}
                    className={`h-10 sm:h-9 min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 inline-flex items-center ${
                      segment === "all"
                        ? "bg-[#14090b] text-white"
                        : "bg-white border border-[#e8e2dc] text-[#5a4e50] hover:bg-[#faf8f5]"
                    }`}
                  >
                    All ({insights.total_customers || 0})
                  </button>
                  {segments.map((s: any) => (
                    <button
                      key={s.segment}
                      onClick={() => setSegment(s.segment)}
                      className={`h-10 sm:h-9 min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 inline-flex items-center ${
                        segment === s.segment
                          ? "bg-[#7b1425] text-white shadow-xs"
                          : "bg-white border border-[#e8e2dc] text-[#5a4e50] hover:bg-[#faf8f5]"
                      }`}
                    >
                      {s.display_name} ({s.count || 0})
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Customer Directory Table */}
            <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f3ede7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#14090b]">Customers</h3>
                  <p className="text-xs text-[#6f6264]">All customer accounts and lifetime spend</p>
                </div>
                <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-3 sm:top-2.5 text-[#a89b99]" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 sm:h-9 min-h-[40px] w-full pl-9 pr-3 text-xs rounded-lg border border-[#e8e2dc] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20 text-[#14090b]"
                  />
                </form>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf8f5] text-[#6f6264] uppercase font-semibold text-[10px] tracking-wider border-b border-[#f3ede7]">
                    <tr>
                      <th className="px-6 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-right">Orders</th>
                      <th className="px-4 py-3 text-right">Total spent</th>
                      <th className="px-4 py-3 text-left">Last order</th>
                      <th className="px-6 py-3 text-right">Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ede7]">
                    {Array.isArray(customers) && customers.length > 0 ? (
                      customers.map((c) => (
                        <tr key={c.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                          <td className="px-6 py-3 font-semibold text-[#14090b] align-middle whitespace-nowrap">
                            {c.first_name} {c.last_name}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#6f6264] text-[11px] align-middle whitespace-nowrap">{c.email}</td>
                          <td className="px-4 py-3 text-right font-semibold text-[#14090b] align-middle whitespace-nowrap">{c.orders_count}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#14090b] align-middle whitespace-nowrap">{formatCurrency(c.total_spent)}</td>
                          <td className="px-4 py-3 text-[#6f6264] align-middle whitespace-nowrap">{formatDate(c.last_order_at)}</td>
                          <td className="px-6 py-3 text-right align-middle whitespace-nowrap">{getSegmentPill(c.segment)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-xs text-[#6f6264]">
                          No customers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

