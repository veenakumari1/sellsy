"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiClient } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { Lock, Mail, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ApiClient.isAuthenticated()) {
      router.replace(redirectUrl);
    }
  }, [redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ApiClient.login(email, password);
      router.push(redirectUrl);
    } catch (err: any) {
      const msg = err.message || "";
      setError(msg || "Invalid email or password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Link href="/" className="inline-flex items-center">
            <Logo size={36} />
          </Link>
        </div>
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
                  placeholder="you@example.com"
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
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#14090b] hover:bg-[#2a1b1e] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In to Workspace"}
            </button>
          </form>

          <p className="text-center text-xs text-[#6f6264]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-[#7b1425] hover:text-[#620F1E]">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#7b1425] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
