"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock } from "lucide-react";

interface OrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  total_price: number;
  financial_status: string;
  fulfillment_status: string;
  items_count: number;
  created_at: string;
}

interface RecentOrdersTableProps {
  orders: OrderItem[];
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders }) => {
  return (
    <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden flex flex-col justify-between h-full">
      <div className="px-6 py-4 border-b border-[#f3ede7] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#14090b]">Recent orders</h3>
          <p className="text-xs text-[#6f6264]">Latest orders from your store</p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#faf8f5] text-[#6f6264] uppercase font-semibold text-[10px] tracking-wider border-b border-[#f3ede7]">
            <tr>
              <th className="px-6 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3ede7]">
            {orders && orders.length > 0 ? (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-[#7b1425] font-mono align-middle whitespace-nowrap">
                    {o.order_number}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-[#2a1b1e] align-middle whitespace-nowrap">{o.customer_name}</td>
                  <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                    {o.financial_status === "refunded" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">
                        <span>Refunded</span>
                      </span>
                    ) : o.financial_status === "pending" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                        <Clock size={11} className="flex-shrink-0" />
                        <span>Pending</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={11} className="flex-shrink-0" />
                        <span>Paid</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#5a4e50] align-middle whitespace-nowrap">{o.items_count}</td>
                  <td className="px-4 py-3.5 text-[#6f6264] align-middle whitespace-nowrap">{formatDate(o.created_at)}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-[#14090b] align-middle whitespace-nowrap">
                    {formatCurrency(o.total_price)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-xs text-[#6f6264]">
                  No recent orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

