"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  Zap,
  Target,
  CheckCircle2,
  RefreshCw,
  ShoppingBag
} from "lucide-react";

export default function MarketingAdvisorPage() {
  const [strategy, setStrategy] = useState<any>(() => ApiClient.getCached("/api/v1/marketing/strategy"));
  const [loading, setLoading] = useState(() => !ApiClient.getCached("/api/v1/marketing/strategy"));
  const [error, setError] = useState<string | null>(null);

  const loadStrategy = async (force = false) => {
    const cached = ApiClient.getCached("/api/v1/marketing/strategy");
    if (force || !cached) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await ApiClient.getMarketingStrategy(force);
      setStrategy(data);
    } catch (e) {
      console.error(e);
      setError("We couldn't load your marketing suggestions right now. Please try again.");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Marketing</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Recommendations to help you sell more and reach more buyers
            </p>
          </div>
          <button
            onClick={() => loadStrategy(true)}
            className="h-10 sm:h-9 min-h-[40px] inline-flex items-center gap-1.5 px-3 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-xs font-semibold text-[#3b2f31] shadow-2xs transition-colors self-start sm:self-auto whitespace-nowrap flex-shrink-0"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh suggestions</span>
          </button>
        </div>

        {error && !strategy ? (
          <div className="p-6 bg-white rounded-xl border border-[#e8e2dc] text-center space-y-3">
            <p className="text-sm text-[#5a4e50]">{error}</p>
            <button
              onClick={() => loadStrategy(true)}
              className="px-4 py-2 bg-[#7b1425] text-white text-xs font-semibold rounded-lg hover:bg-[#600f1c] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading && !strategy ? (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#e8e2dc] h-32 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#e8e2dc] h-64 animate-pulse" />
              <div className="bg-white rounded-2xl border border-[#e8e2dc] h-64 animate-pulse" />
            </div>
          </div>
        ) : strategy ? (
          <>
            {/* Strategic Focus Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#7b1425] via-[#7b1425] to-[#620F1E] text-white shadow-sm">
              <div className="flex items-center gap-2 text-[#EBC3CB] text-xs font-bold uppercase tracking-wider">
                <Target size={15} />
                <span>Main recommendation</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">{strategy.strategic_focus}</h3>
              <p className="mt-2 text-xs text-[#F6E1E5] max-w-3xl leading-relaxed">{strategy.summary}</p>
            </div>

            {/* Campaign Blueprints */}
            <div>
              <h3 className="text-base font-bold text-[#14090b] mb-4">Suggested campaigns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {strategy.campaigns.map((camp: any) => (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-6 shadow-xs flex flex-col justify-between hover:border-[#DC9AA7] transition-colors h-full"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#FBF1F3] text-[#620F1E] border border-[#EBC3CB]">
                          {camp.target_segment}
                        </span>
                        <span className="text-[11px] text-[#a89b99] font-medium">
                          {camp.recommended_channels.join(" • ")}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#14090b] leading-snug">{camp.title}</h4>
                      <p className="mt-2 text-xs text-[#5a4e50] leading-relaxed font-medium">{camp.objective}</p>

                      <div className="mt-4 p-3 rounded-xl bg-[#faf8f5] border border-[#f3ede7]">
                        <p className="text-[10px] uppercase font-bold text-[#a89b99]">Special offer</p>
                        <p className="text-xs font-semibold text-[#14090b] mt-0.5">{camp.offer_summary}</p>
                      </div>

                      <div className="mt-3 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <span className="font-bold">Expected result: </span>
                        <span>{camp.expected_impact}</span>
                      </div>

                      {/* Action Steps Checklist */}
                      <div className="mt-4">
                        <p className="text-[11px] font-bold text-[#3b2f31] uppercase tracking-wider mb-2">
                          Steps to take:
                        </p>
                        <div className="space-y-1.5">
                          {camp.action_steps.map((step: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-[#5a4e50]">
                              <CheckCircle2 size={13} className="text-[#7b1425] mt-0.5 flex-shrink-0" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Quick Wins */}
              <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-6 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#14090b]">Quick tips</h3>
                      <p className="text-xs text-[#6f6264]">Easy steps to try this week</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {strategy.quick_wins.map((qw: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#faf8f5] border border-[#f3ede7] flex items-start gap-2.5 text-xs text-[#3b2f31]">
                        <span className="w-5 h-5 rounded-full bg-[#F6E1E5] text-[#620F1E] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed font-medium">{qw}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cross-Sell Opportunities */}
              <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-6 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#14090b]">Products bought together</h3>
                      <p className="text-xs text-[#6f6264]">Suggested product combinations to increase order value</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {strategy.cross_sell_opportunities.map((cs: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#faf8f5] border border-[#f3ede7] space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#14090b] truncate max-w-[140px]">{cs.trigger_product}</span>
                          <span className="text-[#7b1425] font-bold">+</span>
                          <span className="font-bold text-[#14090b] truncate max-w-[140px]">{cs.recommended_cross_sell}</span>
                        </div>
                        <p className="text-[11px] text-[#6f6264] leading-relaxed">{cs.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

