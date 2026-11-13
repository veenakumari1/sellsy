"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Search,
  Sparkles,
  AlertTriangle,
  Flame,
  RefreshCw,
  X,
  Package
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>(() => ApiClient.getCached("/api/v1/products?sort_by=revenue") || []);
  const [loading, setLoading] = useState(() => !ApiClient.getCached("/api/v1/products?sort_by=revenue"));
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadProducts = async (force = false) => {
    const query = new URLSearchParams();
    if (search) query.append("search", search);
    if (sortBy) query.append("sort_by", sortBy);
    const qs = query.toString();
    const ep = `/api/v1/products${qs ? `?${qs}` : ""}`;
    const cached = ApiClient.getCached<any[]>(ep);
    if (force || !cached) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await ApiClient.getProducts({ search, sort_by: sortBy }, force);
      setProducts(data);
    } catch (e) {
      console.error(e);
      setError("We couldn't load your products right now. Please try again.");
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
            <span>Top seller</span>
          </span>
        );
      case "declining":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={12} className="text-rose-500" />
            <span>Slowing down</span>
          </span>
        );
      case "opportunity":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles size={12} className="text-purple-500" />
            <span>High margin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f3ede7] text-[#3b2f31]">
            <span>Steady</span>
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Products</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              See how your products are selling and manage your stock
            </p>
          </div>
        </div>

        {error && products.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-[#e8e2dc] text-center space-y-3">
            <p className="text-sm text-[#5a4e50]">{error}</p>
            <button
              onClick={() => loadProducts(true)}
              className="px-4 py-2 bg-[#7b1425] text-white text-xs font-semibold rounded-lg hover:bg-[#600f1c] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* AI Product Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 h-full">
                <Flame size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-950">Top seller: Ultrasonic Aroma Diffuser</p>
                  <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                    Over $3,150.00 in sales with strong weekend demand. Make sure stock stays above 50 units.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3 h-full">
                <AlertTriangle size={20} className="text-rose-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-950">Slow-moving product: Wild Cedarwood Room Spray</p>
                  <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">
                    Sales dropped 42% over the last 30 days. Consider bundling with another product or offering a small discount.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e8e2dc]/90 shadow-2xs">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-3 sm:top-2.5 text-[#a89b99]" />
                <input
                  type="text"
                  placeholder="Search products or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 sm:h-9 min-h-[40px] w-full pl-9 pr-3 text-xs rounded-lg border border-[#e8e2dc] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20 focus:border-[#7b1425] text-[#14090b]"
                />
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                <span className="text-xs text-[#6f6264] font-medium whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 sm:h-9 min-h-[40px] px-3 rounded-lg border border-[#e8e2dc] text-xs font-semibold bg-[#faf8f5] text-[#3b2f31] focus:outline-hidden"
                >
                  <option value="revenue">Total sales</option>
                  <option value="units">Units sold</option>
                  <option value="price_desc">Price: High to low</option>
                  <option value="price_asc">Price: Low to high</option>
                </select>
                <button
                  onClick={() => loadProducts(true)}
                  className="h-10 w-10 sm:h-9 sm:w-9 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-[#5a4e50] transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf8f5] text-[#6f6264] uppercase font-semibold text-[10px] tracking-wider border-b border-[#f3ede7]">
                    <tr>
                      <th className="px-6 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">In stock</th>
                      <th className="px-4 py-3 text-right">Units sold</th>
                      <th className="px-4 py-3 text-right">Total sales</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3ede7]">
                    {loading && products.length === 0 ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-3"><div className="h-4 w-40 bg-[#f3ede7] rounded" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-16 bg-[#f3ede7] rounded" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-20 bg-[#f3ede7] rounded" /></td>
                          <td className="px-4 py-3 text-right"><div className="h-4 w-14 bg-[#f3ede7] rounded ml-auto" /></td>
                          <td className="px-4 py-3 text-right"><div className="h-4 w-12 bg-[#f3ede7] rounded ml-auto" /></td>
                          <td className="px-4 py-3 text-right"><div className="h-4 w-10 bg-[#f3ede7] rounded ml-auto" /></td>
                          <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-[#f3ede7] rounded ml-auto" /></td>
                          <td className="px-6 py-3 text-right"><div className="h-4 w-16 bg-[#f3ede7] rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : products && products.length > 0 ? (
                      products.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => handleOpenDetail(p.id)}
                          className="hover:bg-[#faf8f5]/70 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-3 font-semibold text-[#14090b] group-hover:text-[#7b1425] transition-colors align-middle">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div className="w-8 h-8 rounded-lg bg-[#f3ede7] border border-[#e8e2dc]/60 overflow-hidden flex items-center justify-center flex-shrink-0 text-[#a89b99]">
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={16} />
                                )}
                              </div>
                              <span className="truncate max-w-xs">{p.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-[#6f6264] align-middle whitespace-nowrap">{p.sku || "-"}</td>
                          <td className="px-4 py-3 text-[#5a4e50] align-middle whitespace-nowrap">{p.category?.name || "General"}</td>
                          <td className="px-4 py-3 text-right font-medium text-[#14090b] align-middle whitespace-nowrap">{formatCurrency(p.price)}</td>
                          <td className="px-4 py-3 text-right font-medium text-[#5a4e50] align-middle whitespace-nowrap">
                            {p.inventory_quantity} units
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#14090b] align-middle whitespace-nowrap">{formatNumber(p.units_sold)}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#14090b] align-middle whitespace-nowrap">{formatCurrency(p.revenue_generated)}</td>
                          <td className="px-6 py-3 text-right align-middle whitespace-nowrap">{getStatusBadge(p.velocity_status)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-xs text-[#6f6264]">
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
              <div className="fixed inset-0 z-50 bg-[#14090b]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#e8e2dc] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-5 sm:px-6 py-4 border-b border-[#f3ede7] flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#14090b]">{selectedProduct.title}</h3>
                      <p className="text-xs text-[#6f6264] font-mono mt-0.5">SKU: {selectedProduct.sku || "N/A"}</p>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="p-2 -mr-1 rounded-lg text-[#a89b99] hover:text-[#5a4e50] hover:bg-[#f3ede7] min-h-[40px] min-w-[40px] flex items-center justify-center"
                      aria-label="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center">
                      <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#f3ede7]">
                        <p className="text-[10px] uppercase font-bold text-[#a89b99]">Price</p>
                        <p className="text-base font-bold text-[#14090b] mt-0.5">{formatCurrency(selectedProduct.price)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#f3ede7]">
                        <p className="text-[10px] uppercase font-bold text-[#a89b99]">Profit Margin</p>
                        <p className="text-base font-bold text-emerald-600 mt-0.5">{selectedProduct.margin_pct}%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#f3ede7]">
                        <p className="text-[10px] uppercase font-bold text-[#a89b99]">Units Sold</p>
                        <p className="text-base font-bold text-[#14090b] mt-0.5">{selectedProduct.units_sold}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-[#2a1b1e] uppercase tracking-wider mb-2">Monthly Sales</h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {selectedProduct.monthly_sales.map((m: any) => (
                          <div key={m.month} className="flex items-center justify-between p-2 rounded-lg bg-[#faf8f5] text-xs">
                            <span className="font-medium text-[#3b2f31]">{m.month}</span>
                            <span className="text-[#6f6264]">{m.units} units</span>
                            <span className="font-bold text-[#14090b]">{formatCurrency(m.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 py-3.5 bg-[#faf8f5] border-t border-[#f3ede7] flex justify-end">
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-2 min-h-[40px] rounded-lg bg-[#14090b] text-white font-semibold text-xs hover:bg-[#2a1b1e] inline-flex items-center justify-center"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

