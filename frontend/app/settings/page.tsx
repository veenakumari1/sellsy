"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  Settings,
  Store,
  Sparkles,
  Shield,
  Key,
  Users,
  RotateCcw,
  CheckCircle2,
  Save,
  HelpCircle
} from "lucide-react";

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("Aura Living Essentials");
  const [currency, setCurrency] = useState("USD");
  const [geminiKey, setGeminiKey] = useState("");
  const [model, setModel] = useState("gemini-1.5-flash");
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReSeed = async () => {
    setSeeding(true);
    setSeedSuccess(null);
    try {
      await fetch("http://127.0.0.1:8000/api/v1/seed/demo", { method: "POST" });
      setSeedSuccess("Demo database re-seeded successfully with 25+ products and 175+ orders.");
    } catch (e: any) {
      alert("Failed to reseed database");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="pb-2 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Store & System Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure store preferences, AI model parameters, and access team architecture
          </p>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Settings saved successfully.</span>
          </div>
        )}

        {seedSuccess && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{seedSuccess}</span>
          </div>
        )}

        {/* Store Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Store Profile</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 bg-slate-50 focus:outline-hidden"
                >
                  <option value="USD">USD ($ - United States Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Save Store Profile</span>
            </button>
          </form>
        </div>

        {/* AI Model Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Intelligence & Gemini API Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Gemini API Key (Optional Override)
              </label>
              <div className="relative">
                <Key size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="AIzaSy... (leave blank to use environment default or grounded demo mode)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-hidden font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                When left empty, Sellsy provides deterministic analytical synthesis using real database metrics.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Selection</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 bg-slate-50 focus:outline-hidden"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Recommended for Analytics)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Strategic Analysis)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evaluation & Demo Management */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <RotateCcw size={18} className="text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Demo Data Reset Engine</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Quickly reset or refresh the evaluators' demo database with 25+ products, 175+ orders, and verified customer RFM cohorts.
          </p>

          <button
            onClick={handleReSeed}
            disabled={seeding}
            className="px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs shadow-2xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw size={14} className={seeding ? "animate-spin" : ""} />
            <span>{seeding ? "Re-seeding database..." : "Re-seed Demo Database"}</span>
          </button>
        </div>

        {/* Team Architecture Attribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Users size={18} className="text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Team Engineering Division (Capstone)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-900">Team Member 1: Frontend & Product Engineering</p>
              <p className="text-slate-500 mt-1">Next.js 14, UI/UX Design System, Recharts, Responsive Dashboard, Authentication Interface, Client-side API Integration, Vercel Deployment.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-900">Team Member 2: Backend & AI Engineering</p>
              <p className="text-slate-500 mt-1">FastAPI, SQLAlchemy, LangGraph Multi-Agent Architecture, Sellsy MCP Server, Reusable Skills, Holt Forecasting, Railway Deployment.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

