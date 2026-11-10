"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
  Share2,
  RefreshCw,
  Gift,
  Flame,
  ShoppingBag
} from "lucide-react";

export default function MarketingAdvisorPage() {
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStrategy = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getMarketingStrategy();
      setStrategy(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategy();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Marketing Advisor & Growth Playbooks</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Actionable campaigns, cross-sell bundles, and retention playbooks synthesized from verified store performance
            </p>
          </div>
          <button
            onClick={loadStrategy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Regenerate Strategy</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Synthesizing catalog velocity and cohort retention playbooks...</p>
          </div>
        ) : strategy ? (
          <>
            {/* Strategic Focus Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-sm">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
                <Target size={15} />
                <span>Primary Strategic Focus</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{strategy.strategic_focus}</h3>
              <p className="mt-2 text-xs text-blue-100 max-w-3xl leading-relaxed">{strategy.summary}</p>
            </div>

            {/* Campaign Blueprints */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-4">Recommended Campaign Blueprints</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {strategy.campaigns.map((camp: any) => (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {camp.target_segment}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {camp.recommended_channels.join(" • ")}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">{camp.title}</h4>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">{camp.objective}</p>

                      <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Hero Offer</p>
                        <p className="text-xs font-semibold text-slate-900 mt-0.5">{camp.offer_summary}</p>
                      </div>

                      <div className="mt-3 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <span className="font-bold">Expected Lift: </span>
                        <span>{camp.expected_impact}</span>
                      </div>

                      {/* Action Steps Checklist */}
                      <div className="mt-4">
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Execution Checklist:
                        </p>
                        <div className="space-y-1.5">
                          {camp.action_steps.map((step: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                              <CheckCircle2 size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins & Cross-Sell Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Wins */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">High-Impact Quick Wins</h3>
                    <p className="text-xs text-slate-500">Immediate optimizations to execute this week</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {strategy.quick_wins.map((qw: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{qw}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-Sell Opportunities */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Cross-Selling Pairings</h3>
                    <p className="text-xs text-slate-500">Catalog affinity pairings to lift basket AOV</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {strategy.cross_sell_opportunities.map((cs: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 truncate max-w-[140px]">{cs.trigger_product}</span>
                        <span className="text-blue-600 font-bold">pairs with</span>
                        <span className="font-bold text-slate-900 truncate max-w-[140px]">{cs.recommended_cross_sell}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{cs.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
