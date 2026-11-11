"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Crown,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Mail,
  ShoppingBag
} from "lucide-react";

export default function CustomersPage() {
  const [insights, setInsights] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [segment, setSegment] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async (segFilter?: string) => {
    setLoading(true);
    try {
      const [insightsData, custList] = await Promise.all([
        ApiClient.getCustomerInsights(),
        ApiClient.getCustomers({ segment: segFilter !== "all" ? segFilter : undefined, search }),
      ]);
      setInsights(insightsData);
      setCustomers(custList);
    } catch (e) {
      console.error(e);
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
            <span>High-Value VIP</span>
          </span>
        );
      case "returning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF1F3] text-[#620F1E] border border-[#EBC3CB]">
            <UserCheck size={12} className="text-[#A3243A]" />
            <span>Returning Loyalist</span>
          </span>
        );
      case "at_risk":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert size={12} className="text-rose-500" />
            <span>At-Risk (Churn Alert)</span>
          </span>
        );
      case "new":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>New Buyer</span>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Customer Cohort & RFM Intelligence</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Verified customer lifetime value (LTV), repeat purchase frequency, and cohort churn prevention
            </p>
          </div>
        </div>

        {insights && (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs">
                <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Total Active Customers</p>
                <p className="text-2xl font-bold text-[#14090b] mt-1">{formatNumber(insights.total_customers)}</p>
                <p className="text-xs text-[#6f6264] mt-1">Verified unique customer accounts</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs">
                <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Repeat Purchase Rate</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{insights.repeat_purchase_rate_pct}%</p>
                <p className="text-xs text-emerald-700 font-medium mt-1">Exceptional retention benchmark</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs">
                <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Average Customer LTV</p>
                <p className="text-2xl font-bold text-[#14090b] mt-1">{formatCurrency(insights.avg_customer_ltv)}</p>
                <p className="text-xs text-[#6f6264] mt-1">Lifetime revenue per shopper</p>
              </div>
            </div>

            {/* AI Customer Retention Playbook */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-purple-50/70 via-[#FBF1F3]/40 to-white border border-purple-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm mb-2">
                <Sparkles size={16} className="text-purple-600" />
                <span>AI Customer Behavior Agent: Retention Recommendations</span>
              </div>
              <div className="space-y-2 mt-2">
                {insights.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#3b2f31]">
                    <CheckCircle2 size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Segment Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSegment("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                  segment === "all"
                    ? "bg-[#14090b] text-white"
                    : "bg-white border border-[#e8e2dc] text-[#5a4e50] hover:bg-[#faf8f5]"
                }`}
              >
                All Customers ({insights.total_customers})
              </button>
              {insights.segments.map((s: any) => (
                <button
                  key={s.segment}
                  onClick={() => setSegment(s.segment)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                    segment === s.segment
                      ? "bg-[#7b1425] text-white shadow-xs"
                      : "bg-white border border-[#e8e2dc] text-[#5a4e50] hover:bg-[#faf8f5]"
                  }`}
                >
                  {s.display_name} ({s.count})
                </button>
              ))}
            </div>
          </>
        )}

        {/* Customer Directory Table */}
        <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f3ede7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#14090b]">Customer Roster</h3>
              <p className="text-xs text-[#6f6264]">Order frequencies and lifetime spend records</p>
            </div>
            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-[#a89b99]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#e8e2dc] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20 text-[#14090b]"
              />
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf8f5] text-[#6f6264] uppercase font-semibold text-[10px] tracking-wider border-b border-[#f3ede7]">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3">Total Spend</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-6 py-3 text-right">Segment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3ede7]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                    <td className="px-6 py-3 font-semibold text-[#14090b]">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#6f6264] text-[11px]">{c.email}</td>
                    <td className="px-4 py-3 text-center font-semibold text-[#14090b]">{c.orders_count}</td>
                    <td className="px-4 py-3 font-bold text-[#14090b]">{formatCurrency(c.total_spent)}</td>
                    <td className="px-4 py-3 text-[#6f6264]">{formatDate(c.last_order_at)}</td>
                    <td className="px-6 py-3 text-right">{getSegmentPill(c.segment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

