"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ApiClient.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await ApiClient.demoLogin();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to launch demo account.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#7b1425] flex items-center justify-center text-white font-bold text-xl shadow-sm">
            S
          </div>
          <span className="font-extrabold text-2xl text-[#14090b] tracking-tight">Sellsy</span>
        </Link>
        <h2 className="text-2xl font-bold text-[#14090b] tracking-tight">
          Sign In to Your Workspace
        </h2>
        <p className="mt-1.5 text-xs text-[#6f6264]">
          Access your real-time store analytics and AI intelligence agents
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-[#e8e2dc]/90 shadow-sm space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Demo Evaluation Shortcut */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#FBF1F3] to-[#FBF1F3]/50 border border-[#EBC3CB]/80">
            <div className="flex items-center gap-2 text-[#380911] text-xs font-bold mb-1">
              <ShieldCheck size={16} className="text-[#7b1425]" />
              <span>Evaluation Mode (One-Click Demo)</span>
            </div>
            <p className="text-[11px] text-[#4D0C18]/80 leading-relaxed">
              Explore pre-seeded live store metrics with 25+ products, 175+ real orders, and active multi-agent workflows.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="mt-3 w-full py-2.5 px-4 rounded-lg bg-[#7b1425] hover:bg-[#620F1E] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {demoLoading ? (
                <span>Loading Demo Store...</span>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Launch Instant Demo Account</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e8e2dc]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#a89b99] font-semibold text-[10px]">
                Or Sign In With Email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-[#a89b99]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e8e2dc] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20 focus:border-[#7b1425] transition-all text-[#14090b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-[#a89b99]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e8e2dc] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20 focus:border-[#7b1425] transition-all text-[#14090b]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#14090b] hover:bg-[#2a1b1e] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In to Workspace"}
            </button>
          </form>

          <p className="text-center text-xs text-[#6f6264]">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-[#7b1425] hover:text-[#620F1E]">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

