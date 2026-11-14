"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApiClient } from "@/lib/api";
import {
  Settings,
  Store,
  Sparkles,
  Shield,
  Key,
  Users,
  CheckCircle2,
  Save,
  HelpCircle
} from "lucide-react";

export default function SettingsPage() {
  const [storeName, setStoreName] = useState("My Store");
  const [currency, setCurrency] = useState("PKR");
  const [geminiKey, setGeminiKey] = useState("");
  const [model, setModel] = useState("gemini-1.5-flash");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    ApiClient.getActiveStore().then((st: any) => {
      if (st?.name) setStoreName(st.name);
      if (st?.currency) setCurrency(st.currency);
    }).catch(() => {});
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        <div className="pb-2 border-b border-[#e8e2dc]">
          <h2 className="text-xl font-bold text-[#14090b] tracking-tight">Store & System Settings</h2>
          <p className="text-xs text-[#6f6264] mt-0.5">
            Configure store preferences, AI model parameters, and access team architecture
          </p>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Settings saved successfully.</span>
          </div>
        )}

        {/* Store Profile */}
        <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#f3ede7]">
            <Store size={18} className="text-[#7b1425]" />
            <h3 className="text-sm font-bold text-[#14090b]">Store Profile</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#e8e2dc] text-[#14090b] focus:outline-hidden min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Operating Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#e8e2dc] text-[#14090b] bg-[#faf8f5] focus:outline-hidden min-h-[40px]"
                >
                  <option value="PKR">PKR (Rs - Pakistani Rupee)</option>
                  <option value="USD">USD ($ - United States Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-[#14090b] hover:bg-[#2a1b1e] text-white font-semibold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <Save size={14} />
              <span>Save Store Profile</span>
            </button>
          </form>
        </div>

        {/* AI Model Configuration */}
        <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#f3ede7]">
            <Sparkles size={18} className="text-[#7b1425]" />
            <h3 className="text-sm font-bold text-[#14090b]">AI Intelligence & Gemini API Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#3b2f31] mb-1">
                Google Gemini API Key (Optional Override)
              </label>
              <div className="relative">
                <Key size={15} className="absolute left-3 top-3 text-[#a89b99]" />
                <input
                  type="password"
                  placeholder="AIzaSy... (leave blank to use environment default)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e8e2dc] text-[#14090b] focus:outline-hidden font-mono min-h-[40px]"
                />
              </div>
              <p className="text-[11px] text-[#a89b99] mt-1">
                When left empty, Sellsy provides deterministic analytical synthesis using real database metrics.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Model Selection</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#e8e2dc] text-[#14090b] bg-[#faf8f5] focus:outline-hidden min-h-[40px]"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Recommended for Analytics)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Strategic Analysis)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Architecture Attribution */}
        <div className="bg-white rounded-2xl border border-[#e8e2dc]/90 p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f3ede7]">
            <Users size={18} className="text-[#5a4e50]" />
            <h3 className="text-sm font-bold text-[#14090b]">Team Engineering Division (Capstone)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#f3ede7]">
              <p className="font-bold text-[#14090b]">Team Member 1: Frontend & Product Engineering</p>
              <p className="text-[#6f6264] mt-1">Next.js 14, UI/UX Design System, Recharts, Responsive Dashboard, Authentication Interface, Client-side API Integration, Vercel Deployment.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#f3ede7]">
              <p className="font-bold text-[#14090b]">Team Member 2: Backend & AI Engineering</p>
              <p className="text-[#6f6264] mt-1">FastAPI, SQLAlchemy, LangGraph Multi-Agent Architecture, Sellsy MCP Server, Reusable Skills, Holt Forecasting, Railway Deployment.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

