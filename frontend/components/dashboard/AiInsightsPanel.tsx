"use client";

import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiInsight {
  id: string;
  category: string;
  title: string;
  observation: string;
  impact?: string;
  actionable_recommendation: string;
  confidence_score: number;
}

interface AiInsightsPanelProps {
  insights: AiInsight[];
}

export const AiInsightsPanel: React.FC<AiInsightsPanelProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e8e2dc] p-6 text-center text-[#6f6264]">
        <Sparkles size={24} className="mx-auto text-[#A3243A] mb-2" />
        <p className="text-sm font-medium">No alerts right now. Your store is running smoothly.</p>
      </div>
    );
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "sales":
        return "bg-[#F6E1E5] text-[#4D0C18] border-[#EBC3CB]";
      case "products":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "customers":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "marketing":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-[#f3ede7] text-[#2a1b1e] border-[#e8e2dc]";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e8e2dc]/90 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#f3ede7] flex items-center justify-between bg-gradient-to-r from-[#FBF1F3]/40 via-white to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7b1425]/10 flex items-center justify-center text-[#7b1425]">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#14090b]">AI Insights</h3>
            <p className="text-xs text-[#6f6264]">Suggestions based on your store data</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f3ede7] text-[11px] font-semibold text-[#3b2f31]">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Store data</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="flex flex-col justify-between p-4 rounded-xl border border-[#e8e2dc]/80 bg-[#faf8f5]/50 hover:bg-[#faf8f5]/90 transition-all hover:border-[#EBC3CB] shadow-2xs h-full"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                    getCategoryBadge(ins.category)
                  )}
                >
                  {ins.category}
                </span>
                <span className="text-[11px] font-semibold text-[#a89b99]">
                  {Math.round(ins.confidence_score * 100)}% Confidence
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#14090b] leading-snug">{ins.title}</h4>
              <p className="mt-2 text-xs text-[#5a4e50] leading-relaxed">{ins.observation}</p>
              {ins.impact && (
                <div className="mt-2 text-[11px] font-medium text-[#6f6264] flex items-center gap-1.5">
                  <span className="font-semibold text-[#3b2f31]">Impact:</span>
                  <span>{ins.impact}</span>
                </div>
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-[#e8e2dc]/60">
              <div className="flex items-start gap-1.5 text-xs text-[#380911] bg-[#FBF1F3]/80 p-2.5 rounded-lg border border-[#F6E1E5]">
                <CheckCircle2 size={15} className="text-[#7b1425] mt-0.5 flex-shrink-0" />
                <span className="font-medium leading-relaxed">{ins.actionable_recommendation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

