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
  const validDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct) ? deltaPct : 0;
  const isUp = (trend === "up" && validDelta > 0) || validDelta > 0;
  const isDown = (trend === "down" && validDelta < 0) || validDelta < 0;

  return (
    <div className="bg-white rounded-xl border border-[#e8e2dc]/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <p className="text-xs font-semibold text-[#6f6264] uppercase tracking-wider truncate">{title}</p>
          {icon && <div className="text-[#a89b99] flex-shrink-0">{icon}</div>}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold text-[#14090b] tracking-tight whitespace-nowrap">{value}</p>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0",
              isUp
                ? "bg-emerald-50 text-emerald-700"
                : isDown
                ? "bg-rose-50 text-rose-700"
                : "bg-[#f3ede7] text-[#5a4e50]"
            )}
          >
            {isUp ? (
              <TrendingUp size={13} className="flex-shrink-0" />
            ) : isDown ? (
              <TrendingDown size={13} className="flex-shrink-0" />
            ) : (
              <Minus size={13} className="flex-shrink-0" />
            )}
            <span>{validDelta > 0 ? `+${validDelta}%` : `${validDelta}%`}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#a89b99] truncate">{subtext}</p>
    </div>
  );
};

