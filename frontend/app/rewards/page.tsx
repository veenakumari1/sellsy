"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import { realtimeClient } from "@/lib/realtime";
import { formatNumber, formatDate, formatCurrency } from "@/lib/utils";
import { LiquidGauge } from "@/components/ui/liquid-gauge";
import {
  Trophy,
  Award,
  Flame,
  Target,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Zap,
  ShoppingBag,
  Package,
  Bot,
  Store,
  RefreshCw,
  Crown,
  Users,
  ArrowRight,
  Check
} from "lucide-react";

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  category: string;
  icon_name: string;
  points_reward: number;
  is_unlocked: boolean;
  current_progress: number;
  target_progress: number;
  unlocked_at: string | null;
}

interface LeaderboardUser {
  rank: number;
  user_id: string;
  name: string;
  store_name: string;
  points: number;
  level: number;
  rank_title: string;
  badge_count: number;
  is_current_user: boolean;
}

interface Activity {
  id: string;
  activity_type: string;
  points_earned: number;
  description: string;
  created_at: string;
}

interface GamificationOverview {
  total_points: number;
  level: number;
  rank_title: string;
  streak_days: number;
  points_to_next_level: number;
  next_level_points: number;
  level_progress_pct: number;
  completed_achievements_count: number;
  total_achievements_count: number;
  achievements: Achievement[];
  recent_activities: Activity[];
}

export default function RewardsPage() {
  const [overview, setOverview] = useState<GamificationOverview | null>(() =>
    ApiClient.getCached("/api/v1/gamification/overview")
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() =>
    ApiClient.getCached("/api/v1/gamification/leaderboard") || []
  );
  const [loading, setLoading] = useState(() => !ApiClient.getCached("/api/v1/gamification/overview"));
  const [error, setError] = useState<string | null>(null);
  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async (force = false) => {
    if (force || !overview) {
      setLoading(true);
    }
    setError(null);
    try {
      const [ovData, lbData] = await Promise.all([
        ApiClient.getGamificationOverview(force),
        ApiClient.getLeaderboard(force),
      ]);
      setOverview(ovData);
      setLeaderboard(lbData);
    } catch (err) {
      console.error("Failed to load rewards data", err);
      setError("We couldn't load your rewards right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live real-time WebSocket events
    if (realtimeClient) {
      const unsub = realtimeClient.subscribe((event) => {
        if (event.type === "NOTIFICATION" || event.type === "METRIC_UPDATE") {
          loadData(true);
        }
      });
      return () => unsub();
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleClaimTask = async (taskKey: string, taskTitle: string) => {
    setClaimingKey(taskKey);
    try {
      const res = await ApiClient.claimGamificationTask(taskKey, taskTitle);
      if (res && res.overview) {
        setOverview(res.overview);
      } else {
        await loadData(true);
      }
      showToast(`Completed "${taskTitle}"! +${res.points_awarded || 25} Growth Points`);
    } catch (err) {
      console.error("Failed to claim task", err);
    } finally {
      setClaimingKey(null);
    }
  };

  const handleSimulateOrder = async () => {
    setSimulating(true);
    try {
      const res = await ApiClient.simulateLiveOrder();
      const amt = res.total != null ? res.total : (res.order?.total_amount || 0);
      showToast(`Live order ${res.order_number || ""} simulated (${formatCurrency(amt)})! Real-time metric & points broadcast dispatched.`);
      await loadData(true);
    } catch (err) {
      console.error("Simulation error", err);
    } finally {
      setSimulating(false);
    }
  };

  const mono: React.CSSProperties = {
    fontFamily: "var(--font-plex-mono), ui-monospace, monospace",
  };

  const getAchievementIcon = (name: string, unlocked: boolean) => {
    const cls = unlocked ? "text-[#7b1425]" : "text-[#a89b99]";
    switch (name) {
      case "store":
        return <Store size={22} className={cls} />;
      case "trending-up":
        return <TrendingUp size={22} className={cls} />;
      case "package":
        return <Package size={22} className={cls} />;
      case "target":
        return <Target size={22} className={cls} />;
      case "bot":
        return <Bot size={22} className={cls} />;
      case "flame":
        return <Flame size={22} className={cls} />;
      default:
        return <Award size={22} className={cls} />;
    }
  };

  // Check if a task is already claimed
  const isTaskClaimed = (taskKey: string) => {
    if (!overview?.recent_activities) return false;
    return overview.recent_activities.some((act) => act.activity_type === taskKey);
  };

  const actionableTasks = [
    {
      key: "set_forecast",
      title: "Generate 30-Day Sales Forecast",
      description: "Run statistical forecasting models to anticipate inventory requirements and predict revenue velocity.",
      points: 30,
      link: "/forecasting",
      actionLabel: "Open Forecasting",
    },
    {
      key: "review_insights",
      title: "Audit Low-Velocity Product Catalog",
      description: "Review declining products and discover inventory health alerts before stock degrades.",
      points: 35,
      link: "/products",
      actionLabel: "Open Products",
    },
    {
      key: "bundle_declining",
      title: "Design Bundle Strategy for Slow SKUs",
      description: "Pair lower velocity items with high-converting top sellers to accelerate liquidation.",
      points: 50,
      link: "/marketing",
      actionLabel: "AI Advisor",
    },
    {
      key: "activate_marketing",
      title: "Activate Retention Marketing Playbook",
      description: "Deploy automated targeted customer segment win-back campaign advised by the Marketing Agent.",
      points: 75,
      link: "/marketing",
      actionLabel: "Launch Playbook",
    },
    {
      key: "audit_rfm",
      title: "Inspect Customer Segmentation & LTV",
      description: "Analyze Champions, At-Risk, and Churn Risk cohorts to safeguard repeat purchase rate.",
      points: 40,
      link: "/customers",
      actionLabel: "Customer Insights",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#14090b] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-[#7b1425]/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <Sparkles size={18} className="text-[#f6e1e5]" />
            <span className="text-xs font-semibold">{toast}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e8e2dc]">
          <div>
            <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Rewards</h2>
            <p className="text-xs text-[#6f6264] mt-0.5">
              Earn points and badges as you grow your store
            </p>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleSimulateOrder}
                disabled={simulating}
                className="h-9 inline-flex items-center gap-2 px-3.5 rounded-lg border border-[#7b1425]/30 bg-white hover:bg-[#FBF1F3] text-xs font-semibold text-[#7b1425] transition-colors shadow-2xs disabled:opacity-50 whitespace-nowrap"
                title="Test order ingestion & points award"
              >
                {simulating ? <RefreshCw size={14} className="animate-spin flex-shrink-0" /> : <Zap size={14} className="flex-shrink-0" />}
                <span>Simulate Order</span>
              </button>
            </div>
          )}
        </div>

        {error && !overview ? (
          <div className="p-6 bg-white rounded-xl border border-[#e8e2dc] text-center space-y-3">
            <p className="text-sm text-[#5a4e50]">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="px-4 py-2 bg-[#7b1425] text-white text-xs font-semibold rounded-lg hover:bg-[#600f1c] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading && !overview ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 bg-white rounded-xl border border-[#e8e2dc]/80 h-36 animate-pulse" />
              <div className="bg-white rounded-xl border border-[#e8e2dc]/80 h-36 animate-pulse" />
              <div className="bg-white rounded-xl border border-[#e8e2dc]/80 h-36 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8e2dc]/80 h-64 animate-pulse" />
              <div className="bg-white rounded-xl border border-[#e8e2dc]/80 h-64 animate-pulse" />
            </div>
          </div>
        ) : overview ? (
          <>
            {/* Level & Rank Executive Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
              {/* Level & Rank */}
              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs md:col-span-2 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      style={mono}
                      className="text-[10px] uppercase font-bold tracking-[0.14em] text-[#7b1425] bg-[#7b1425]/10 px-2 py-0.5 rounded"
                    >
                      Level {overview.level}
                    </span>
                    <h3 className="text-2xl font-bold text-[#14090b] mt-2">
                      {overview.rank_title}
                    </h3>
                    <p className="text-xs text-[#6f6264] mt-1">
                      {overview.points_to_next_level > 0
                        ? `${overview.points_to_next_level} points until Level ${overview.level + 1}`
                        : "Maximum level reached!"}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-[#FBF1F3] border border-[#7b1425]/20 flex items-center justify-center text-[#7b1425] flex-shrink-0 shadow-2xs">
                    <Trophy size={28} />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span style={mono} className="text-[#14090b]">
                      {overview.total_points} PTS
                    </span>
                    <span style={mono} className="text-[#6f6264]">
                      {overview.next_level_points} PTS NEXT LEVEL
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#f3ede7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7b1425] transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, overview.level_progress_pct))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Activity Streak */}
              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Streak</p>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
                      <Flame size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#14090b] mt-2">
                    {overview.streak_days} Days
                  </p>
                  <p className="text-xs text-[#6f6264] mt-1">
                    Days in a row checking your store
                  </p>
                </div>
                <div className="pt-3 border-t border-[#f3ede7] flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                  <span>Current streak: Active</span>
                </div>
              </div>

              {/* Badges Count */}
              <div className="bg-white p-5 rounded-xl border border-[#e8e2dc]/80 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#a89b99] uppercase tracking-wider">Badges</p>
                    <div className="p-1.5 rounded-lg bg-[#FBF1F3] text-[#7b1425] flex-shrink-0">
                      <Award size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#14090b] mt-2">
                    {overview.completed_achievements_count} / {overview.total_achievements_count}
                  </p>
                  <p className="text-xs text-[#6f6264] mt-1">
                    Badges unlocked
                  </p>
                </div>
                <div className="pt-3 border-t border-[#f3ede7] flex items-center justify-between text-xs">
                  <span className="text-[#6f6264]">Completion</span>
                  <span style={mono} className="font-semibold text-[#7b1425]">
                    {Math.round((overview.completed_achievements_count / (overview.total_achievements_count || 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Grid: Left (Playbooks & Badges) / Right (Leaderboard & Activities) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 Cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Actionable Growth Playbooks */}
                <div className="bg-white rounded-xl border border-[#e8e2dc]/80 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-[#f3ede7] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#14090b]">Suggested tasks</h3>
                      <p className="text-xs text-[#6f6264] mt-0.5">
                        Complete tasks to earn points and level up
                      </p>
                    </div>
                    <Target size={18} className="text-[#7b1425]" />
                  </div>

                  <div className="divide-y divide-[#f3ede7]">
                    {actionableTasks.map((task) => {
                      const claimed = isTaskClaimed(task.key);
                      const isClaiming = claimingKey === task.key;

                      return (
                        <div
                          key={task.key}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#faf8f5]/60 transition-colors"
                        >
                          <div className="space-y-1 max-w-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#14090b]">{task.title}</span>
                              <span
                                style={mono}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold"
                              >
                                +{task.points} PTS
                              </span>
                            </div>
                            <p className="text-xs text-[#6f6264] leading-relaxed">
                              {task.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link
                              href={task.link}
                              className="h-8 inline-flex items-center gap-1 px-3 rounded-lg border border-[#e8e2dc] hover:bg-white text-xs font-medium text-[#5a4e50] transition-colors whitespace-nowrap"
                            >
                              <span>{task.actionLabel}</span>
                              <ChevronRight size={12} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleClaimTask(task.key, task.title)}
                              disabled={claimed || isClaiming}
                              className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                                claimed
                                  ? "bg-emerald-100 text-emerald-800 cursor-default"
                                  : "bg-[#7b1425] hover:bg-[#620F1E] text-white shadow-2xs disabled:opacity-50"
                              }`}
                            >
                              {claimed ? (
                                <>
                                  <Check size={13} />
                                  <span>Claimed</span>
                                </>
                              ) : isClaiming ? (
                                <>
                                  <RefreshCw size={13} className="animate-spin" />
                                  <span>Claiming...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={13} />
                                  <span>Claim Points</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Achievement Badges Grid */}
                <div className="bg-white rounded-xl border border-[#e8e2dc]/80 shadow-xs p-5">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f3ede7]">
                    <div>
                      <h3 className="text-sm font-bold text-[#14090b]">Achievement Badges</h3>
                      <p className="text-xs text-[#6f6264] mt-0.5">
                        Key store performance milestones across catalog, retention, and diagnostics
                      </p>
                    </div>
                    <span style={mono} className="text-xs font-semibold text-[#7b1425]">
                      {overview.completed_achievements_count} / {overview.total_achievements_count} Unlocked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
                    {overview.achievements.map((ach) => (
                      <div
                        key={ach.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between h-full ${
                          ach.is_unlocked
                            ? "bg-[#FBF1F3]/40 border-[#7b1425]/20 shadow-2xs"
                            : "bg-[#faf8f5]/50 border-[#e8e2dc]/70 opacity-65"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-xl flex-shrink-0 border ${
                              ach.is_unlocked
                                ? "bg-white border-[#7b1425]/20 shadow-xs"
                                : "bg-white/80 border-[#e8e2dc]"
                            }`}
                          >
                            {getAchievementIcon(ach.icon_name, ach.is_unlocked)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4
                                className={`text-xs truncate ${
                                  ach.is_unlocked ? "font-bold text-[#14090b]" : "font-semibold text-[#6f6264]"
                                }`}
                              >
                                {ach.title}
                              </h4>
                              <span
                                style={mono}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  ach.is_unlocked
                                    ? "bg-[#7b1425]/10 text-[#7b1425]"
                                    : "bg-[#e8e2dc]/60 text-[#a89b99]"
                                }`}
                              >
                                +{ach.points_reward} PTS
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6f6264] mt-1 leading-relaxed">
                              {ach.description}
                            </p>
                            <div className="mt-2.5 flex items-center justify-between text-[10px]">
                              <span
                                style={mono}
                                className={`font-semibold ${
                                  ach.is_unlocked ? "text-emerald-700" : "text-[#a89b99]"
                                }`}
                              >
                                {ach.is_unlocked ? "✓ Unlocked" : "In Progress"}
                              </span>
                              {ach.unlocked_at && (
                                <span className="text-[#a89b99]">{formatDate(ach.unlocked_at)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (1 Col): Leaderboard & Recent Activity */}
              <div className="space-y-6">
                {/* Next Level Progress Liquid Gauge */}
                <div className="flex justify-center">
                  <LiquidGauge
                    label="Next level progress"
                    value={overview.level_progress_pct ?? 0}
                    total={overview.next_level_points ?? 100}
                    unit="pts"
                    readOnly={true}
                    subline={`${overview.total_points ?? 0} of ${overview.next_level_points ?? 100} pts`}
                    statusText={
                      overview.points_to_next_level > 0
                        ? `${overview.points_to_next_level} pts until Level ${overview.level + 1}`
                        : "Max level reached!"
                    }
                    className="w-full max-w-full h-80 rounded-xl border-[#e8e2dc]/80"
                  />
                </div>

                {/* Leaderboard Benchmarking */}
                <div className="bg-white rounded-xl border border-[#e8e2dc]/80 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-[#f3ede7] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Crown size={16} className="text-amber-600" />
                        <h3 className="text-sm font-bold text-[#14090b]">Leaderboard</h3>
                      </div>
                      <p className="text-[11px] text-[#6f6264] mt-0.5">
                        Top stores this month
                      </p>
                    </div>
                    <span
                      style={mono}
                      className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold"
                    >
                      Top 25%
                    </span>
                  </div>

                  <div className="divide-y divide-[#f3ede7]">
                    {leaderboard.map((user) => (
                      <div
                        key={user.user_id}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          user.is_current_user
                            ? "bg-[#FBF1F3]/80 font-medium"
                            : "hover:bg-[#faf8f5]/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            style={mono}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              user.rank === 1
                                ? "bg-amber-400 text-amber-950 shadow-2xs"
                                : user.rank === 2
                                ? "bg-slate-300 text-slate-800"
                                : user.rank === 3
                                ? "bg-amber-700/20 text-amber-800"
                                : "bg-[#f3ede7] text-[#6f6264]"
                            }`}
                          >
                            {user.rank}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-[#14090b] truncate">
                                {user.name}
                              </p>
                              {user.is_current_user && (
                                <span
                                  style={mono}
                                  className="px-1.5 py-0.2 rounded bg-[#7b1425] text-white text-[9px] font-bold uppercase"
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#6f6264] truncate">
                              {user.store_name} • {user.rank_title}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p style={mono} className="text-xs font-bold text-[#14090b]">
                            {user.points} pts
                          </p>
                          <p className="text-[10px] text-[#a89b99]">
                            {user.badge_count} badges
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Verified Activities */}
                <div className="bg-white rounded-xl border border-[#e8e2dc]/80 shadow-xs p-5">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#f3ede7]">
                    <h3 className="text-sm font-bold text-[#14090b]">Recent Points Activity</h3>
                    <Sparkles size={15} className="text-[#7b1425]" />
                  </div>

                  <div className="space-y-3">
                    {overview.recent_activities && overview.recent_activities.length > 0 ? (
                      overview.recent_activities.slice(0, 6).map((act) => (
                        <div key={act.id} className="flex items-start justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-medium text-[#14090b] truncate">
                              {act.description}
                            </p>
                            <p className="text-[10px] text-[#a89b99] mt-0.5">
                              {formatDate(act.created_at)}
                            </p>
                          </div>
                          <span
                            style={mono}
                            className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] flex-shrink-0"
                          >
                            +{act.points_earned}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#a89b99] py-3 text-center">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-[#e8e2dc]">
            <p className="text-xs text-[#6f6264]">Unable to load merchant rewards profile.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
