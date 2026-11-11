"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CategoryRevenue {
  category_id?: string;
  category_name: string;
  revenue: number;
  percentage: number;
  orders_count: number;
}

interface CategoryDonutProps {
  data: CategoryRevenue[];
}

const COLORS = ["#7b1425", "#06B6D4", "#8B5CF6", "#F59E0B", "#10B981"];

export const CategoryDonut: React.FC<CategoryDonutProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-[#a89b99] text-xs">
        No category revenue data.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-[#14090b] text-white p-2.5 rounded-lg shadow-lg text-xs">
          <p className="font-semibold text-[#e8e2dc]">{p.category_name}</p>
          <p className="font-bold text-[#C26679]">{formatCurrency(p.revenue)}</p>
          <p className="text-[#a89b99]">{p.percentage}% of catalog sales</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="w-48 h-48 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              dataKey="revenue"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 w-full space-y-2">
        {data.map((cat, idx) => (
          <div key={cat.category_name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="font-medium text-[#3b2f31] truncate max-w-[120px]">
                {cat.category_name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-[#14090b]">{formatCurrency(cat.revenue)}</span>
              <span className="ml-1.5 text-[#a89b99] font-medium">({cat.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

