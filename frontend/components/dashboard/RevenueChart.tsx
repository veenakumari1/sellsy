"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TimelinePoint {
  date: string;
  revenue: number;
  orders: number;
  aov: number;
}

interface RevenueChartProps {
  data: TimelinePoint[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-[#a89b99] text-sm">
        No sales data available for selected period.
      </div>
    );
  }

  // Format date labels e.g. "Nov 4"
  const formattedData = data.map((item) => {
    const parts = item.date.split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    return {
      ...item,
      displayDate: `${month} ${day}`,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-[#14090b] text-white p-3 rounded-lg shadow-lg text-xs space-y-1">
          <p className="font-semibold text-[#d4c9c2]">{p.date}</p>
          <p className="text-sm font-bold text-[#C26679]">
            Revenue: {formatCurrency(p.revenue)}
          </p>
          <p className="text-[#d4c9c2]">Orders: {p.orders}</p>
          <p className="text-[#a89b99]">AOV: {formatCurrency(p.aov)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7b1425" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7b1425" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#7b1425"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

