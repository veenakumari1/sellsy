"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { User, Lock, Mail, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ApiClient.register(email, password, fullName);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
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
          Create Your Merchant Account
        </h2>
        <p className="mt-1.5 text-xs text-[#6f6264]">
          Get started with AI-driven store insights and predictive forecasting
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
              <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-[#a89b99]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e8e2dc] focus:outline-hidden focus:ring-2 focus:ring-[#7b1425]/20 focus:border-[#7b1425] transition-all text-[#14090b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3b2f31] mb-1">Store / Business Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-[#a89b99]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@yourstore.com"
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
                  minLength={6}
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
              className="w-full py-2.5 px-4 rounded-lg bg-[#7b1425] hover:bg-[#620F1E] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account & Workspace"}
            </button>
          </form>

          <p className="text-center text-xs text-[#6f6264]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#7b1425] hover:text-[#620F1E]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

