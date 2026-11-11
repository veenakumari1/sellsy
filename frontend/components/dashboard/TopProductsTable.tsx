"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ProductItem {
  id: string;
  title: string;
  sku?: string;
  price: number;
  units_sold: number;
  revenue_generated: number;
  velocity_status: string;
}

interface TopProductsTableProps {
  products: ProductItem[];
}

export const TopProductsTable: React.FC<TopProductsTableProps> = ({ products }) => {
  return (
    <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#f3ede7] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#14090b]">Top-Performing Products</h3>
          <p className="text-xs text-[#6f6264]">Ranked by verified gross revenue</p>
        </div>
        <Link
          href="/products"
          className="text-xs font-semibold text-[#7b1425] hover:text-[#620F1E] flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#faf8f5] text-[#6f6264] uppercase font-semibold text-[10px] tracking-wider border-b border-[#f3ede7]">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3 text-center">Units Sold</th>
              <th className="px-6 py-3 text-right">Gross Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3ede7]">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                <td className="px-6 py-3.5 font-medium text-[#14090b]">
                  <span className="truncate block max-w-xs">{p.title}</span>
                </td>
                <td className="px-4 py-3.5 text-[#6f6264] font-mono text-[11px]">{p.sku || "-"}</td>
                <td className="px-4 py-3.5 font-medium text-[#3b2f31]">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3.5 text-center font-semibold text-[#14090b]">
                  {formatNumber(p.units_sold)}
                </td>
                <td className="px-6 py-3.5 text-right font-bold text-[#14090b]">
                  {formatCurrency(p.revenue_generated)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

