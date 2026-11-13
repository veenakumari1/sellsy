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

interface ForecastChartProps {
  data: any[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-[#14090b] text-white p-3 rounded-lg shadow-lg text-xs space-y-1">
          <p className="font-semibold text-[#d4c9c2]">Date: {p.date}</p>
          {p.actualRevenue !== null && (
            <p className="text-[#C26679] font-bold">
              Actual Sales: {formatCurrency(p.actualRevenue)}
            </p>
          )}
          {p.projectedRevenue !== null && (
            <>
              <p className="text-emerald-400 font-bold">
                Projected: {formatCurrency(p.projectedRevenue)}
              </p>
              <p className="text-[#a89b99]">
                Range: {formatCurrency(p.lowerBound)} – {formatCurrency(p.upperBound)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} dy={8} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="actualRevenue" stroke="#7b1425" strokeWidth={2.5} fill="#FBF1F3" fillOpacity={0.4} name="Actual Revenue" />
          <Area type="monotone" dataKey="projectedRevenue" stroke="#10B981" strokeWidth={2.5} strokeDasharray="5 5" fill="url(#forecastArea)" name="Projected Revenue" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

