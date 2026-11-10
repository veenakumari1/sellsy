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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
          <p className="text-xs text-slate-500">Live order feed synced from store</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">Order Number</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-6 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-3.5 font-semibold text-blue-600 font-mono">
                  {o.order_number}
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800">{o.customer_name}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={11} />
                    <span>Paid</span>
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center text-slate-600">{o.items_count}</td>
                <td className="px-4 py-3.5 text-slate-500">{formatDate(o.created_at)}</td>
                <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                  {formatCurrency(o.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
