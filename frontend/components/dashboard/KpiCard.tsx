"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  deltaPct: number;
  trend: "up" | "down" | "neutral" | string;
  subtext: string;
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  deltaPct,
  trend,
  subtext,
  icon,
}) => {
  const isUp = trend === "up" || deltaPct > 0;
  const isDown = trend === "down" || deltaPct < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
            isUp
              ? "bg-emerald-50 text-emerald-700"
              : isDown
              ? "bg-rose-50 text-rose-700"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {isUp ? (
            <TrendingUp size={13} />
          ) : isDown ? (
            <TrendingDown size={13} />
          ) : (
            <Minus size={13} />
          )}
          <span>{deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">{subtext}</p>
    </div>
  );
};

