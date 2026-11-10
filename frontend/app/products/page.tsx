"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Search,
  Filter,
  Sparkles,
  ArrowUpDown,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw,
  X,
  Package
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getProducts({ search, sort_by: sortBy });
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleOpenDetail = async (prodId: string) => {
    setDetailLoading(true);
    try {
      const detail = await ApiClient.getProductDetail(prodId);
      setSelectedProduct(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "top_performer":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Flame size={12} className="text-amber-500" />
            <span>Catalog Star</span>
          </span>
        );
      case "declining":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={12} className="text-rose-500" />
            <span>Velocity Drop (-40%)</span>
          </span>
        );
      case "opportunity":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles size={12} className="text-purple-500" />
            <span>High Margin Unlocked</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            <span>Stable</span>
          </span>
        );
    }
  };

  const starCount = products.filter((p) => p.velocity_status === "top_performer").length;
  const decliningCount = products.filter((p) => p.velocity_status === "declining").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Intelligence & SKU Analytics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              SKU-level margins, inventory turnover, catalog stars, and declining liquidation targets
            </p>
          </div>
        </div>

        {/* AI Product Agent Observations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
            <Flame size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950">Top Revenue Driver: Ultrasonic Aroma Diffuser</p>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                Represents over $3,150.00 in verified sales with strong weekend velocity. Ensure warehouse inventory stays above 50 units.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-950">Inventory Alert: Wild Cedarwood Room Spray</p>
              <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">
                Sales velocity contracted 42% over the last 30 days. Recommend bundling with the Ceramic Planter or offering a 15% clearance incentive.
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="revenue">Gross Revenue</option>
              <option value="units">Units Sold</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
            </select>
            <button
              onClick={loadProducts}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3 text-center">In Stock</th>
                  <th className="px-4 py-3 text-center">Units Sold</th>
                  <th className="px-4 py-3">Gross Revenue</th>
                  <th className="px-6 py-3 text-right">Velocity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleOpenDetail(p.id)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-3 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden flex items-center justify-center flex-shrink-0 text-slate-400">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} />
                          )}
                        </div>
                        <span className="truncate max-w-xs">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{p.sku || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.category?.name || "General"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">
                      {p.inventory_quantity} units
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">{formatNumber(p.units_sold)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(p.revenue_generated)}</td>
                    <td className="px-6 py-3 text-right">{getStatusBadge(p.velocity_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedProduct.title}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {selectedProduct.sku || "N/A"}</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Retail Price</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(selectedProduct.price)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Gross Margin</p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">{selectedProduct.margin_pct}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Units</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{selectedProduct.units_sold}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Monthly Breakdown</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedProduct.monthly_sales.map((m: any) => (
                      <div key={m.month} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                        <span className="font-medium text-slate-700">{m.month}</span>
                        <span className="text-slate-500">{m.units} units</span>
                        <span className="font-bold text-slate-900">{formatCurrency(m.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

