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
    <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden flex flex-col justify-between h-full">
      <div className="px-6 py-4 border-b border-[#f3ede7] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#14090b]">Top products</h3>
          <p className="text-xs text-[#6f6264]">Ranked by sales</p>
        </div>
        <Link
          href="/products"
          className="text-xs font-semibold text-[#7b1425] hover:text-[#620F1E] flex items-center gap-1"
        >
          <span>View all</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#faf8f5] text-[#6f6264] uppercase font-semibold text-[10px] tracking-wider border-b border-[#f3ede7]">
            <tr>
              <th className="px-6 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Units sold</th>
              <th className="px-6 py-3 text-right">Total sales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3ede7]">
            {products && products.length > 0 ? (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-[#14090b] align-middle">
                    <span className="truncate block max-w-xs">{p.title}</span>
                  </td>
                  <td className="px-4 py-3.5 text-[#6f6264] font-mono text-[11px] align-middle whitespace-nowrap">{p.sku || "-"}</td>
                  <td className="px-4 py-3.5 text-right font-medium text-[#3b2f31] align-middle whitespace-nowrap">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-[#14090b] align-middle whitespace-nowrap">
                    {formatNumber(p.units_sold)}
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold text-[#14090b] align-middle whitespace-nowrap">
                    {formatCurrency(p.revenue_generated)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-xs text-[#6f6264]">
                  No products to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

