"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Edit2,
  Check,
  X,
  Package,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  DollarSign,
  BellRing
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryAlertsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, low, oos, healthy
  const [searchQuery, setSearchQuery] = useState("");
  const [editingReorderId, setEditingReorderId] = useState<string | null>(null);
  const [reorderInput, setReorderInput] = useState<number>(10);
  const [savingReorder, setSavingReorder] = useState(false);
  const [notifTriggered, setNotifTriggered] = useState(false);

  const loadAlerts = async (force = false) => {
    setLoading(true);
    try {
      const res = await ApiClient.getInventoryAlerts(force);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleSaveReorder = async (productId: string) => {
    setSavingReorder(true);
    try {
      await ApiClient.updateProductReorderLevel(productId, Number(reorderInput));
      await loadAlerts(true);
      setEditingReorderId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to update reorder level.");
    } finally {
      setSavingReorder(false);
    }
  };

  const handleForceCheckAlerts = async () => {
    try {
      await ApiClient.checkInventoryAlerts();
      setNotifTriggered(true);
      setTimeout(() => setNotifTriggered(false), 3000);
      loadAlerts(true);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = (data?.items || []).filter((item: any) => {
    // Status filter
    if (statusFilter === "low" && item.status !== "Low stock") return false;
    if (statusFilter === "oos" && item.status !== "Out of stock") return false;
    if (statusFilter === "healthy" && item.status !== "Healthy") return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.category_name && item.category_name.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e2dc]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#F6E1E5] text-[#620F1E] rounded-md">
                Warehouse Intelligence
              </span>
              <span className="text-xs text-[#8a7c7e]">Real-Time Safety Thresholds</span>
            </div>
            <h1 className="text-2xl font-bold text-[#14090b] tracking-tight mt-1 flex items-center gap-2">
              <Boxes className="text-[#7b1425]" size={26} />
              Inventory & Restock Alerts
            </h1>
            <p className="text-xs text-[#6f6264] mt-0.5 max-w-2xl">
              Monitors daily sales speed, calculates runaway depletion timelines, and generates AI-assisted purchase
              order restock recommendations to prevent stockouts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
            <button
              onClick={handleForceCheckAlerts}
              className="h-10 px-3.5 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-xs font-semibold text-[#14090b] inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Broadcast real-time alert check"
            >
              <BellRing size={14} className={notifTriggered ? "text-emerald-600 animate-bounce" : "text-[#7b1425]"} />
              <span>{notifTriggered ? "Alerts Synced!" : "Run Safety Check"}</span>
            </button>

            <button
              onClick={() => loadAlerts(true)}
              disabled={loading}
              className="h-10 px-3 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-xs font-semibold text-[#3b2f31] transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8a7c7e] block">Total SKUs</span>
            <p className="text-2xl font-bold text-[#14090b] mt-1">{data?.total_skus ?? 0}</p>
            <span className="text-[10px] text-[#5a4e50] mt-0.5 block">Catalog items</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs">
            <span className="text-[11px] font-semibold text-red-700 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              Out of Stock
            </span>
            <p className="text-2xl font-bold text-red-700 mt-1">{data?.out_of_stock_count ?? 0}</p>
            <span className="text-[10px] text-[#8a7c7e] mt-0.5 block">0 units remaining</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#7b1425] block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#7b1425]" />
              Low Stock Alert
            </span>
            <p className="text-2xl font-bold text-[#7b1425] mt-1">{data?.low_stock_count ?? 0}</p>
            <span className="text-[10px] text-[#8a7c7e] mt-0.5 block">Below reorder point</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-700 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Healthy Buffer
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{data?.healthy_count ?? 0}</p>
            <span className="text-[10px] text-[#8a7c7e] mt-0.5 block">Safe inventory levels</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8e2dc] shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-[#8a7c7e] block">Restock Investment</span>
            <p className="text-xl font-bold text-[#14090b] mt-1 truncate">
              Rs {(data?.estimated_reorder_cost || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-[#5a4e50] mt-0.5 block">Estimated PO cost</span>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#faf8f5] rounded-xl border border-[#e8e2dc] self-start flex-wrap">
            {[
              { id: "all", label: "All Items" },
              { id: "oos", label: `Out of Stock (${data?.out_of_stock_count ?? 0})` },
              { id: "low", label: `Low Stock (${data?.low_stock_count ?? 0})` },
              { id: "healthy", label: `Healthy (${data?.healthy_count ?? 0})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  statusFilter === f.id
                    ? "bg-[#7b1425] text-white shadow-2xs"
                    : "text-[#5a4e50] hover:text-[#14090b] hover:bg-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7c7e]" />
            <input
              type="text"
              placeholder="Filter by title, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#e8e2dc] bg-white text-xs text-[#14090b] focus:outline-none focus:border-[#7b1425]"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-[#e8e2dc] overflow-hidden shadow-2xs">
          {loading && !data ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-[#7b1425] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#6f6264]">Calculating run-rate velocities and days remaining...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Boxes size={32} className="mx-auto text-[#a89b99]" />
              <h3 className="text-sm font-bold text-[#14090b]">No inventory records found</h3>
              <p className="text-xs text-[#6f6264] max-w-sm mx-auto">
                No items match the selected filter. Try choosing "All Items" or adjusting your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf8f5] border-b border-[#e8e2dc] text-[#6f6264] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product & SKU</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Reorder Level</th>
                    <th className="py-3 px-4">Sales Velocity</th>
                    <th className="py-3 px-4">Days Left</th>
                    <th className="py-3 px-4">AI Suggested Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3ede7]">
                  {filteredItems.map((item: any) => {
                    const isOOS = item.status === "Out of stock";
                    const isLow = item.status === "Low stock";
                    const isHealthy = item.status === "Healthy";
                    const isEditing = editingReorderId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                        {/* Title & Category */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#14090b]">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-[#8a7c7e]">{item.sku}</span>
                            <span className="text-[10px] text-[#8a7c7e]">• {item.category_name}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
                              isOOS
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : isLow
                                ? "bg-[#FBF1F3] text-[#7b1425] border border-[#EBC3CB]"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isOOS ? "bg-red-600" : isLow ? "bg-[#7b1425]" : "bg-emerald-600"
                              )}
                            />
                            {item.status}
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "font-bold text-sm",
                              isOOS ? "text-red-600" : isLow ? "text-[#7b1425]" : "text-[#14090b]"
                            )}
                          >
                            {item.inventory_quantity}
                          </span>
                          <span className="text-[11px] text-[#8a7c7e] ml-1">units</span>
                        </td>

                        {/* Reorder Level (Editable) */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={reorderInput}
                                onChange={(e) => setReorderInput(Number(e.target.value))}
                                className="w-16 h-7 px-2 text-xs border border-[#7b1425] rounded focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveReorder(item.id)}
                                disabled={savingReorder}
                                className="p-1 rounded bg-[#7b1425] text-white hover:bg-[#600f1c]"
                                title="Save"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingReorderId(null)}
                                className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#14090b]">{item.reorder_level} units</span>
                              <button
                                onClick={() => {
                                  setEditingReorderId(item.id);
                                  setReorderInput(item.reorder_level);
                                }}
                                className="text-[#8a7c7e] hover:text-[#7b1425] p-0.5"
                                title="Edit threshold"
                              >
                                <Edit2 size={11} />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Sales Velocity */}
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#14090b]">{item.daily_velocity} / day</p>
                          <p className="text-[10px] text-[#8a7c7e]">30-day run rate</p>
                        </td>

                        {/* Days Left */}
                        <td className="py-3 px-4">
                          {isOOS ? (
                            <span className="text-red-600 font-bold">Depleted</span>
                          ) : item.days_left && item.days_left <= 7 ? (
                            <span className="text-[#7b1425] font-bold">{item.days_left} days left</span>
                          ) : item.days_left && item.days_left < 99 ? (
                            <span className="text-[#14090b] font-medium">{item.days_left} days left</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Safe buffer</span>
                          )}
                        </td>

                        {/* AI Suggested Restock */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-[#FBF1F3] text-[#7b1425] border border-[#EBC3CB]">
                              +{item.suggested_restock_qty} units
                            </span>
                            <span className="text-[10px] text-[#8a7c7e] truncate max-w-[140px]" title={item.restock_reason}>
                              Rs {item.estimated_restock_cost.toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

