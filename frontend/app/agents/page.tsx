"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  BrainCircuit,
  TrendingUp,
  Boxes,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Flame,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentsTeamPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [activeRun, setActiveRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runningStep, setRunningStep] = useState<number>(0); // 0: idle, 1: sales, 2: inventory, 3: marketing, 4: manager
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (force = false) => {
    try {
      setError(null);
      const data = await ApiClient.getAiTeamHistory(20, force);
      setHistory(data || []);
      if (data && data.length > 0 && !activeRun) {
        setActiveRun(data[0]);
      }
    } catch (e: any) {
      console.error(e);
      setError("Unable to load previous AI team cycles. Click retry to reconnect.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRunAiTeam = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setError(null);
    setRunningStep(1);

    // Sequential simulation animation while API executes
    const stepTimer1 = setTimeout(() => setRunningStep(2), 700);
    const stepTimer2 = setTimeout(() => setRunningStep(3), 1400);
    const stepTimer3 = setTimeout(() => setRunningStep(4), 2100);

    try {
      const newRun = await ApiClient.runAiTeam();
      // Ensure smooth visual step transition before showing final results
      setTimeout(() => {
        setActiveRun(newRun);
        setHistory((prev) => [newRun, ...prev.filter((item) => item.id !== newRun.id)]);
        setIsRunning(false);
        setRunningStep(0);
      }, 2600);
    } catch (e: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsRunning(false);
      setRunningStep(0);
      setError("AI Team run encountered an issue. Please try again.");
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const salesFinding = activeRun?.sales_finding;
  const inventoryFinding = activeRun?.inventory_finding;
  const marketingFinding = activeRun?.marketing_finding;
  const managerPlan = activeRun?.manager_plan;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Run Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e2dc]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#F6E1E5] text-[#620F1E] rounded-md">
                Autonomous Specialists
              </span>
              <span className="text-xs text-[#8a7c7e]">Weekly Planning Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-[#14090b] tracking-tight mt-1 flex items-center gap-2">
              <BrainCircuit className="text-[#7b1425]" size={26} />
              Multi-Agent AI Team
            </h1>
            <p className="text-xs text-[#6f6264] mt-0.5 max-w-2xl">
              Three autonomous specialist agents continuously monitor your sales velocity, warehouse stock, and shopper cohorts.
              The General Manager agent synthesizes their findings into an actionable weekly sprint plan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
            <button
              onClick={() => loadHistory(true)}
              disabled={isRunning || loading}
              className="h-10 px-3 rounded-lg border border-[#e8e2dc] bg-white hover:bg-[#faf8f5] text-xs font-semibold text-[#3b2f31] transition-colors inline-flex items-center gap-1.5"
              title="Refresh past runs"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleRunAiTeam}
              disabled={isRunning}
              className={cn(
                "h-10 px-4 rounded-lg bg-[#7b1425] hover:bg-[#600f1c] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2",
                isRunning && "opacity-90 cursor-wait"
              )}
            >
              <BrainCircuit size={16} className={isRunning ? "animate-spin" : ""} />
              <span>{isRunning ? "AI Team Analyzing..." : "Run AI Team"}</span>
            </button>
          </div>
        </div>

        {/* Live Running Progress Stepper */}
        {isRunning && (
          <div className="p-5 rounded-2xl bg-[#FBF1F3] border border-[#EBC3CB] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7b1425] animate-ping" />
                <h3 className="text-xs font-bold text-[#620F1E] uppercase tracking-wider">
                  Multi-Agent Intelligence Cycle in Progress
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#7b1425]">Step {runningStep} of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {[
                { step: 1, name: "Sales Specialist", desc: "Analyzing 30-day velocity & hero items" },
                { step: 2, name: "Inventory Specialist", desc: "Auditing stock levels & safety limits" },
                { step: 3, name: "Marketing Specialist", desc: "Segmenting customer churn cohorts" },
                { step: 4, name: "General Manager", desc: "Synthesizing prioritized sprint plan" },
              ].map((s) => (
                <div
                  key={s.step}
                  className={cn(
                    "p-3 rounded-xl border text-xs transition-all",
                    runningStep === s.step
                      ? "bg-white border-[#7b1425] shadow-sm text-[#14090b]"
                      : runningStep > s.step
                      ? "bg-white/70 border-[#EBC3CB] text-[#5a4e50]"
                      : "bg-white/40 border-transparent text-[#a89b99]"
                  )}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{s.name}</span>
                    {runningStep > s.step && <CheckCircle2 size={13} className="text-[#7b1425]" />}
                  </div>
                  <p className="text-[11px] leading-tight opacity-80">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadHistory(true)}
              className="text-xs font-bold underline hover:text-red-700 ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !activeRun && !isRunning ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="h-56 bg-white rounded-2xl border border-[#e8e2dc] animate-pulse" />
              <div className="h-56 bg-white rounded-2xl border border-[#e8e2dc] animate-pulse" />
              <div className="h-56 bg-white rounded-2xl border border-[#e8e2dc] animate-pulse" />
            </div>
            <div className="h-64 bg-white rounded-2xl border border-[#e8e2dc] animate-pulse" />
          </div>
        ) : activeRun ? (
          <>
            {/* Timestamp & Active Run Banner */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-[#e8e2dc] rounded-xl text-xs text-[#5a4e50]">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#7b1425]" />
                <span>
                  Active Brief generated on:{" "}
                  <strong className="text-[#14090b]">{formatDate(activeRun.created_at)}</strong>
                </span>
              </div>
              <span className="text-[11px] text-[#8a7c7e]">Store ID: {activeRun.store_id?.slice(0, 8)}...</span>
            </div>

            {/* 3 Specialist Agent Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* Agent 1: Sales Agent */}
              <div className="bg-white rounded-2xl border border-[#e8e2dc] p-5 flex flex-col justify-between hover:border-[#DC9AA7] transition-all shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center font-bold">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14090b] leading-tight">Sales Specialist</h3>
                        <p className="text-[10px] text-[#8a7c7e]">Revenue & Product Velocity</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      96% Conf.
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    <div className="p-2.5 rounded-lg bg-[#faf8f5] border border-[#f0eae4] text-xs">
                      <p className="font-semibold text-[#14090b] text-[11px] leading-snug">
                        {salesFinding?.headline || "Steady 30-day sales momentum."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-1">
                      <div className="p-2 bg-[#faf8f5] rounded-lg border border-[#f0eae4]">
                        <p className="text-[10px] text-[#8a7c7e]">30d Revenue</p>
                        <p className="text-xs font-bold text-[#14090b]">
                          Rs {salesFinding?.metrics?.revenue_30d?.toLocaleString() || "0"}
                        </p>
                      </div>
                      <div className="p-2 bg-[#faf8f5] rounded-lg border border-[#f0eae4]">
                        <p className="text-[10px] text-[#8a7c7e]">Orders</p>
                        <p className="text-xs font-bold text-[#14090b]">
                          {salesFinding?.metrics?.order_count ?? 0}
                        </p>
                      </div>
                      <div className="p-2 bg-[#faf8f5] rounded-lg border border-[#f0eae4]">
                        <p className="text-[10px] text-[#8a7c7e]">AOV</p>
                        <p className="text-xs font-bold text-[#14090b]">
                          Rs {salesFinding?.metrics?.aov?.toLocaleString() || "0"}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#5a4e50] leading-relaxed">
                      {salesFinding?.key_finding}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f3ede7]">
                  <p className="text-[10px] uppercase font-bold text-[#7b1425] tracking-wider mb-1">
                    Specialist Recommendation
                  </p>
                  <p className="text-xs text-[#2a1b1e] font-medium leading-snug">
                    {salesFinding?.recommendation}
                  </p>
                </div>
              </div>

              {/* Agent 2: Inventory Agent */}
              <div className="bg-white rounded-2xl border border-[#e8e2dc] p-5 flex flex-col justify-between hover:border-[#DC9AA7] transition-all shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center font-bold">
                        <Boxes size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14090b] leading-tight">Inventory Specialist</h3>
                        <p className="text-[10px] text-[#8a7c7e]">Stock Health & Safety Buffers</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      94% Conf.
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    <div className="p-2.5 rounded-lg bg-[#faf8f5] border border-[#f0eae4] text-xs">
                      <p className="font-semibold text-[#14090b] text-[11px] leading-snug">
                        {inventoryFinding?.headline || "Catalog inventory auditing active."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-1">
                      <div className="p-2 bg-[#faf8f5] rounded-lg border border-[#f0eae4]">
                        <p className="text-[10px] text-[#8a7c7e]">Total SKUs</p>
                        <p className="text-xs font-bold text-[#14090b]">
                          {inventoryFinding?.metrics?.total_skus ?? 0}
                        </p>
                      </div>
                      <div className="p-2 bg-[#FBF1F3] rounded-lg border border-[#EBC3CB]">
                        <p className="text-[10px] text-[#7b1425]">Low Stock</p>
                        <p className="text-xs font-bold text-[#7b1425]">
                          {inventoryFinding?.metrics?.low_stock_count ?? 0}
                        </p>
                      </div>
                      <div className="p-2 bg-[#faf8f5] rounded-lg border border-[#f0eae4]">
                        <p className="text-[10px] text-[#8a7c7e]">Out of Stock</p>
                        <p className="text-xs font-bold text-red-600">
                          {inventoryFinding?.metrics?.out_of_stock_count ?? 0}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#5a4e50] leading-relaxed">
                      {inventoryFinding?.key_finding}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f3ede7]">
                  <p className="text-[10px] uppercase font-bold text-[#7b1425] tracking-wider mb-1">
                    Specialist Recommendation
                  </p>
                  <p className="text-xs text-[#2a1b1e] font-medium leading-snug">
                    {inventoryFinding?.recommendation}
                  </p>
                </div>
              </div>

              {/* Agent 3: Marketing Agent */}
              <div className="bg-white rounded-2xl border border-[#e8e2dc] p-5 flex flex-col justify-between hover:border-[#DC9AA7] transition-all shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center font-bold">
                        <Users size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14090b] leading-tight">Marketing Specialist</h3>
                        <p className="text-[10px] text-[#8a7c7e]">Customer Cohorts & Retention</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      92% Conf.
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    <div className="p-2.5 rounded-lg bg-[#faf8f5] border border-[#f0eae4] text-xs">
                      <p className="font-semibold text-[#14090b] text-[11px] leading-snug">
                        {marketingFinding?.headline || "Shopper cohort health audited."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-1">
                      <div className="p-2 bg-[#faf8f5] rounded-lg border border-[#f0eae4]">
                        <p className="text-[10px] text-[#8a7c7e]">Customers</p>
                        <p className="text-xs font-bold text-[#14090b]">
                          {marketingFinding?.metrics?.total_customers ?? 0}
                        </p>
                      </div>
                      <div className="p-2 bg-[#faf8f5] rounded-lg border border-[#f0eae4]">
                        <p className="text-[10px] text-[#8a7c7e]">Repeat Rate</p>
                        <p className="text-xs font-bold text-emerald-700">
                          {marketingFinding?.metrics?.repeat_rate_pct ?? 0}%
                        </p>
                      </div>
                      <div className="p-2 bg-[#FBF1F3] rounded-lg border border-[#EBC3CB]">
                        <p className="text-[10px] text-[#7b1425]">At Risk</p>
                        <p className="text-xs font-bold text-[#7b1425]">
                          {marketingFinding?.metrics?.at_risk_customers_count ?? 0}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#5a4e50] leading-relaxed">
                      {marketingFinding?.key_finding}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f3ede7]">
                  <p className="text-[10px] uppercase font-bold text-[#7b1425] tracking-wider mb-1">
                    Specialist Recommendation
                  </p>
                  <p className="text-xs text-[#2a1b1e] font-medium leading-snug">
                    {marketingFinding?.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Manager Agent Weekly Action Plan */}
            <div className="bg-white rounded-2xl border border-[#e8e2dc] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f3ede7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7b1425] text-white flex items-center justify-center font-bold">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F6E1E5] text-[#620F1E]">
                        Synthesis Output
                      </span>
                      <h2 className="text-base font-bold text-[#14090b]">Manager Weekly Action Plan</h2>
                    </div>
                    <p className="text-xs text-[#6f6264] mt-0.5">
                      Theme:{" "}
                      <strong className="text-[#14090b]">
                        {managerPlan?.weekly_theme || "Weekly Growth Execution"}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#6f6264] bg-[#faf8f5] px-3 py-1.5 rounded-lg border border-[#f0eae4] self-start sm:self-auto">
                  Prioritized: <strong>{managerPlan?.actions?.length || 0} Actions</strong>
                </div>
              </div>

              {/* Executive Summary */}
              {managerPlan?.executive_summary && (
                <div className="my-4 p-4 rounded-xl bg-[#faf8f5] border border-[#e8e2dc] text-xs text-[#3b2f31] leading-relaxed">
                  <p>
                    <strong className="text-[#14090b] font-semibold">Executive Diagnosis: </strong>
                    {managerPlan.executive_summary}
                  </p>
                </div>
              )}

              {/* Prioritized Actions List */}
              <div className="space-y-3 mt-4">
                {managerPlan?.actions?.map((act: any, idx: number) => {
                  const isHigh = act.priority?.toLowerCase() === "high";
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                        isHigh
                          ? "bg-white border-[#e8e2dc] hover:border-[#DC9AA7]"
                          : "bg-[#faf8f5]/60 border-[#e8e2dc]/70"
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
                            isHigh ? "bg-[#7b1425] text-white" : "bg-[#e8e2dc] text-[#5a4e50]"
                          )}
                        >
                          {idx + 1}
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                isHigh
                                  ? "bg-[#FBF1F3] text-[#7b1425] border border-[#EBC3CB]"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              )}
                            >
                              {act.priority || "Action"}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#faf8f5] text-[#5a4e50] border border-[#e8e2dc]">
                              {act.action_category?.toUpperCase() || "GENERAL"}
                            </span>
                            <h4 className="text-sm font-bold text-[#14090b]">{act.title}</h4>
                          </div>

                          <p className="text-xs text-[#5a4e50] max-w-3xl leading-relaxed">
                            {act.description}
                          </p>
                        </div>
                      </div>

                      {act.expected_impact && (
                        <div className="sm:text-right flex-shrink-0 sm:pl-4 sm:border-l sm:border-[#f3ede7]">
                          <span className="text-[10px] text-[#8a7c7e] uppercase font-bold block">
                            Expected Impact
                          </span>
                          <span className="text-xs font-semibold text-emerald-700">
                            {act.expected_impact}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Past Runs Drawer / History Section */}
            {history.length > 1 && (
              <div className="bg-white rounded-2xl border border-[#e8e2dc] p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#f3ede7]">
                  <h3 className="text-sm font-bold text-[#14090b]">Previous AI Planning Cycles</h3>
                  <span className="text-xs text-[#8a7c7e]">{history.length} runs recorded</span>
                </div>

                <div className="divide-y divide-[#f3ede7] mt-2">
                  {history.map((run) => {
                    const isSelected = run.id === activeRun?.id;
                    return (
                      <div
                        key={run.id}
                        onClick={() => setActiveRun(run)}
                        className={cn(
                          "py-3 px-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors",
                          isSelected
                            ? "bg-[#FBF1F3] text-[#620F1E] font-semibold"
                            : "hover:bg-[#faf8f5] text-[#5a4e50]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className={isSelected ? "text-[#7b1425]" : "text-[#8a7c7e]"} />
                          <div>
                            <p className="text-xs font-bold text-[#14090b]">
                              {run.manager_plan?.weekly_theme || "Weekly Action Plan"}
                            </p>
                            <p className="text-[11px] text-[#8a7c7e]">{formatDate(run.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-[#e8e2dc] text-[#5a4e50]">
                            {run.manager_plan?.actions?.length || 0} Actions
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-[#7b1425] uppercase tracking-wider">
                              Viewing
                            </span>
                          )}
                          <ChevronRight size={14} className="text-[#8a7c7e]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="p-12 bg-white rounded-2xl border border-[#e8e2dc] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FBF1F3] text-[#7b1425] flex items-center justify-center mx-auto">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#14090b]">No AI Team Run Found</h3>
              <p className="text-xs text-[#6f6264] max-w-md mx-auto mt-1">
                Your store currently has no recorded AI Team cycles. Click below to launch your specialist agents.
              </p>
            </div>
            <button
              onClick={handleRunAiTeam}
              className="px-4 py-2.5 rounded-lg bg-[#7b1425] text-white text-xs font-bold hover:bg-[#600f1c] transition-colors"
            >
              Run AI Team Now
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

