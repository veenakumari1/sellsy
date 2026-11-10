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
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
        <Sparkles size={24} className="mx-auto text-blue-500 mb-2" />
        <p className="text-sm font-medium">No active AI alerts. Store operations are performing optimally.</p>
      </div>
    );
  }

  const getCategoryBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "sales":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "products":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "customers":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "marketing":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/40 via-white to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Business Intelligence Engine</h3>
            <p className="text-xs text-slate-500">Synthesized directly from verified store transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Grounded Database Evidence</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/90 transition-all hover:border-blue-200 shadow-2xs"
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
                <span className="text-[11px] font-semibold text-slate-400">
                  {Math.round(ins.confidence_score * 100)}% Confidence
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{ins.title}</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">{ins.observation}</p>
              {ins.impact && (
                <div className="mt-2 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Impact:</span>
                  <span>{ins.impact}</span>
                </div>
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-200/60">
              <div className="flex items-start gap-1.5 text-xs text-blue-900 bg-blue-50/80 p-2.5 rounded-lg border border-blue-100">
                <CheckCircle2 size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="font-medium leading-relaxed">{ins.actionable_recommendation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

