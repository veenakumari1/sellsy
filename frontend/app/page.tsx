"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  LineChart,
  Users,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  BotMessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  Plug
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              S
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Sellsy</span>
            <span className="text-[10px] uppercase font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              AI Platform
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Capabilities</a>
            <a href="#agents" className="hover:text-blue-600 transition-colors">Multi-Agent Engine</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#integrations" className="hover:text-blue-600 transition-colors">Integrations</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Explore Demo</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-20 pb-16 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles size={14} className="text-blue-600" />
          <span>Next-Generation Multi-Agent E-commerce Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Turn Your Store Data Into <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Smarter Business Decisions.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Understand sales performance, discover customer behavior, predict trends, and grow your e-commerce business with AI-powered intelligence.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-7 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-2xs transition-colors"
          >
            Explore Features
          </a>
        </div>

        {/* 3. Product Dashboard Preview */}
        <div className="mt-14 relative rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl max-w-5xl mx-auto overflow-hidden">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-left">
            {/* Mock Dashboard Topbar */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  A
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Aura Living Essentials</h4>
                  <p className="text-[11px] text-emerald-600 font-medium">Verified Live Sync • 99 Orders</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                  Last 30 Days
                </span>
              </div>
            </div>

            {/* Mock KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Revenue</p>
                <p className="text-xl font-bold text-slate-900 mt-1">$11,585.38</p>
                <p className="text-[11px] font-semibold text-emerald-600 mt-1">+36.6% vs prior</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Orders</p>
                <p className="text-xl font-bold text-slate-900 mt-1">99</p>
                <p className="text-[11px] font-semibold text-emerald-600 mt-1">+28.5% volume</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Average Order Value</p>
                <p className="text-xl font-bold text-slate-900 mt-1">$117.02</p>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">Grounded AOV</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-400">Repeat Buyers</p>
                <p className="text-xl font-bold text-slate-900 mt-1">97.8%</p>
                <p className="text-[11px] font-semibold text-emerald-600 mt-1">VIP Retention</p>
              </div>
            </div>

            {/* Mock AI Insight Callout */}
            <div className="mt-5 p-4 rounded-lg bg-blue-50 border border-blue-200/80 flex items-start gap-3">
              <Sparkles size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-950">AI Orchestrator Diagnostic:</p>
                <p className="text-xs text-blue-900 mt-0.5 leading-relaxed">
                  "Weekend sales generate 58.4% of total turnover. The Ceramic Planter is your highest margin asset (66.7%). Recommend launching an automated VIP win-back flow offering bundle savings on Cedarwood Room Spray."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Key Platform Capabilities */}
      <section id="features" className="py-20 bg-white border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Built for Modern E-commerce
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Every Tool You Need to Drive Revenue
            </p>
            <p className="text-sm text-slate-500 mt-3">
              Replace fragmented spreadsheets and disconnected dashboards with real-time intelligence backed by mathematical proof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Sales Analytics</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Granular period-over-period revenue comparisons, day-of-week order volume patterns, and automated period delta tracking.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Package size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Product Intelligence</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                SKU-level margins, sales velocity classification, and automated detection of declining products requiring liquidation bundles.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Customer Insights</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                RFM segmentation (High-Value VIPs, Returning Loyalists, At-Risk Shoppers) with verified cohort repeat rates and churn prevention triggers.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4">
                <LineChart size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Statistical Forecasting</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Holt-Winters double exponential smoothing with 80% confidence bands. Predictive mathematical models rather than LLM halluncinations.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Sparkles size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Marketing Advisor</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Actionable marketing blueprints, hero product campaigns, cart threshold optimizations, and cross-sell pairing suggestions.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <BotMessageSquare size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Sellsy AI Assistant</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Conversational assistant powered by Model Context Protocol (MCP) tools and LangGraph multi-agent orchestration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Multi-Agent Engine Showcase */}
      <section id="agents" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <Layers size={14} />
            <span>LangGraph Multi-Agent Architecture</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Specialized AI Agents Working in Harmony
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Instead of a generic chatbot, Sellsy routes your questions through specialized autonomous agents governed by a Central Orchestrator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center mb-3">
              01
            </span>
            <h4 className="text-sm font-bold text-slate-900">Sales Agent</h4>
            <p className="text-xs text-slate-500 mt-1">Calculates period-over-period growth and detects revenue velocity shifts.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center mb-3">
              02
            </span>
            <h4 className="text-sm font-bold text-slate-900">Product Agent</h4>
            <p className="text-xs text-slate-500 mt-1">Tracks SKU velocity, identifies catalog stars, and flags declining inventory.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 text-xs font-bold flex items-center justify-center mb-3">
              03
            </span>
            <h4 className="text-sm font-bold text-slate-900">Customer Agent</h4>
            <p className="text-xs text-slate-500 mt-1">Segments buyers via RFM and calculates cohort repeat rates and churn risk.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="w-7 h-7 rounded-md bg-cyan-50 text-cyan-600 text-xs font-bold flex items-center justify-center mb-3">
              04
            </span>
            <h4 className="text-sm font-bold text-slate-900">Prediction Agent</h4>
            <p className="text-xs text-slate-500 mt-1">Models exponential smoothing projections with 80% confidence bands.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center mb-3">
              05
            </span>
            <h4 className="text-sm font-bold text-slate-900">Marketing Agent</h4>
            <p className="text-xs text-slate-500 mt-1">Synthesizes agent discoveries into actionable marketing campaigns.</p>
          </div>
        </div>
      </section>

      {/* 6. Integrations */}
      <section id="integrations" className="py-16 bg-slate-100/60 border-t border-slate-200 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900">Seamless Data Ingestion</h2>
          <p className="text-sm text-slate-600 mt-2">
            Connect your Shopify storefront in seconds, or upload your historical product, order, and customer CSV files with auto-detected mapping.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <Plug size={18} className="text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Shopify API Integration</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <FileSpreadsheet size={18} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-800">CSV Auto-Mapping Ingestion</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <Zap size={18} className="text-amber-600" />
              <span className="text-xs font-bold text-slate-800">Model Context Protocol (MCP)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA Section */}
      <section className="py-20 bg-blue-600 text-white px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Unlock Your Store's True Potential?
          </h2>
          <p className="mt-4 text-blue-100 text-base">
            Join forward-thinking e-commerce merchants making data-driven decisions every day.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-lg bg-white text-blue-600 font-bold text-sm shadow-md hover:bg-blue-50 transition-colors"
            >
              Explore Live Sellsy Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 text-xs px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              S
            </div>
            <span className="font-bold text-slate-200">Sellsy Intelligence</span>
            <span>• Understand Your Store. Make Smarter Decisions.</span>
          </div>
          <p>© 2026 Sellsy Inc. Enterprise Capstone Platform.</p>
        </div>
      </footer>
    </div>
  );
}
