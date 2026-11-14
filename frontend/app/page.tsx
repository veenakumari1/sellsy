"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  LineChart,
  Users,
  Package,
  ArrowRight,
  Zap,
  BotMessageSquare,
  FileSpreadsheet,
  Plug,
  Sparkles,
} from "lucide-react";
import SellsyIntro from "@/components/intro/SellsyIntro";
import ChatWidget from "@/components/ChatWidget";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";

const InkBackground = dynamic(
  () => import("@/components/kokonutui/ink-background"),
  {
    ssr: false,
    loading: () => (
      <div className="relative mx-auto flex justify-center text-center mt-6">
        <h1
          style={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
          }}
          className="text-[2.6rem] sm:text-6xl lg:text-[5.4rem] font-semibold tracking-[-0.03em] leading-[1.02]"
        >
          <span className="block text-[#14090b]">Turn your store data into</span>
          <span className="block italic font-extrabold text-[#7b1425]">
            smarter business decisions.
          </span>
        </h1>
      </div>
    ),
  }
);

/*
  Theme: white · burgundy · black
  paper #faf8f5 | ink #14090b | burgundy #7b1425 | burgundy-light #a3243a | mute #6f6264
*/

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,144,500..800,100,1;1,144,500..800,100,1&family=IBM+Plex+Mono:wght@400;500&display=swap";

const display: React.CSSProperties = {
  fontFamily: '"Fraunces", Georgia, serif',
  fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
};
const mono: React.CSSProperties = { fontFamily: '"IBM Plex Mono", monospace' };

const features = [
  { icon: TrendingUp, title: "Sales Analytics", text: "Granular period-over-period revenue comparisons, day-of-week order volume patterns, and automated period delta tracking." },
  { icon: Package, title: "Product Intelligence", text: "SKU-level margins, sales velocity classification, and automated detection of declining products requiring liquidation bundles." },
  { icon: Users, title: "Customer Insights", text: "RFM segmentation (High-Value VIPs, Returning Loyalists, At-Risk Shoppers) with verified cohort repeat rates and churn prevention triggers." },
  { icon: LineChart, title: "Statistical Forecasting", text: "Holt-Winters double exponential smoothing with 80% confidence bands. Predictive mathematical models rather than LLM hallucinations." },
  { icon: Sparkles, title: "AI Marketing Advisor", text: "Actionable marketing blueprints, hero product campaigns, cart threshold optimizations, and cross-sell pairing suggestions." },
  { icon: BotMessageSquare, title: "Sellsy AI Assistant", text: "Conversational assistant powered by Model Context Protocol (MCP) tools and LangGraph multi-agent orchestration." },
];

const agents = [
  { n: "01", name: "Sales Agent", text: "Calculates period-over-period growth and detects revenue velocity shifts." },
  { n: "02", name: "Product Agent", text: "Tracks SKU velocity, identifies catalog stars, and flags declining inventory." },
  { n: "03", name: "Customer Agent", text: "Segments buyers via RFM and calculates cohort repeat rates and churn risk." },
  { n: "04", name: "Prediction Agent", text: "Models exponential smoothing projections with 80% confidence bands." },
  { n: "05", name: "Marketing Agent", text: "Synthesizes agent discoveries into actionable marketing campaigns." },
];

const steps = [
  { n: "1", title: "Connect", text: "Link your Shopify store or upload product, order and customer CSVs. Columns are mapped automatically." },
  { n: "2", title: "Analyze", text: "Five specialized agents read your data and compute growth, margins, segments and forecasts." },
  { n: "3", title: "Decide", text: "Get clear, number-backed recommendations and ask follow-up questions in plain language." },
];

function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p style={mono} className={`text-[11px] uppercase tracking-[0.16em] font-medium ${light ? "text-[#faf8f5]/80" : "text-[#7b1425]"}`}>
      {children}
    </p>
  );
}

const shouldSkipIntro = () => {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem("sellsyIntroSeen") === "true") return true;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  } catch (e) {}
  return false;
};

export default function LandingPage() {
  const [phase, setPhase] = useState<"splash" | "intro" | "done">(() => {
    return shouldSkipIntro() ? "done" : "splash";
  });

  useEffect(() => {
    const markSeen = () => {
      try {
        sessionStorage.setItem("sellsyIntroSeen", "true");
      } catch (e) {}
    };

    window.addEventListener("beforeunload", markSeen);
    window.addEventListener("pagehide", markSeen);

    return () => {
      window.removeEventListener("beforeunload", markSeen);
      window.removeEventListener("pagehide", markSeen);
    };
  }, []);

  useEffect(() => {
    if (phase !== "done") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [phase]);

  return (
    <>
      <link rel="stylesheet" href={FONT_URL} />
      <SellsyIntro
        phase={phase}
        once={true}
        onEnter={() => setPhase("intro")}
        onDone={() => setPhase("done")}
      />

      {/* Chat widget: "Ask Sellsy" button */}
      {phase === "done" && <ChatWidget />}

      <div
        suppressHydrationWarning
        className="min-h-screen bg-[#faf8f5] text-[#14090b] flex flex-col"
        style={{
          display: phase === "done" ? "flex" : "none",
        }}
      >
        {/* 1. Navigation */}
        <header className="sticky top-0 z-50 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#14090b]/10">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Logo size={30} />
              <span style={mono} className="hidden sm:inline text-[10px] uppercase tracking-[0.14em] text-[#6f6264] border-l border-[#14090b]/20 pl-3">
                AI Platform
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#14090b]/70">
              <a href="#features" className="hover:text-[#7b1425] transition-colors">Capabilities</a>
              <a href="#agents" className="hover:text-[#7b1425] transition-colors">Multi-Agent Engine</a>
              <a href="#how-it-works" className="hover:text-[#7b1425] transition-colors">How It Works</a>
              <a href="#integrations" className="hover:text-[#7b1425] transition-colors">Integrations</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-[#14090b]/80 hover:text-[#7b1425] px-3 py-1.5 transition-colors">
                Sign In
              </Link>
              <Link
                href="/demo"
                className="px-4 py-2 text-sm font-semibold rounded-full bg-[#14090b] hover:bg-[#7b1425] text-white transition-colors flex items-center gap-1.5"
              >
                <span>Explore Demo</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </header>

        {/* 2. Hero Section */}
        <section className="relative pt-24 pb-20 px-6 text-center overflow-hidden">
          <div className="relative max-w-5xl mx-auto">
            <Kicker>Multi-agent e-commerce intelligence</Kicker>

            <InkBackground
              lines={[
                { text: "Turn your store data into", color: "#14090b", fontWeight: 600 },
                { text: "smarter business decisions.", color: "#7b1425", fontWeight: 800, fontStyle: "italic" },
              ]}
              accent="#7b1425"
              className="mt-6"
            />

            <p className="mt-7 text-lg sm:text-xl text-[#14090b]/65 max-w-2xl mx-auto leading-relaxed">
              Understand sales performance, discover customer behavior, predict trends, and grow your e-commerce business with AI-powered intelligence.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#7b1425] hover:bg-[#14090b] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[#14090b]/40 hover:bg-[#14090b] hover:text-white text-[#14090b] font-semibold text-sm transition-colors"
              >
                Explore Features
              </a>
            </div>
          </div>
        </section>

        {/* 3. Capabilities - Reveal & Stagger */}
        <section id="features" className="py-24 bg-white border-y border-[#14090b]/10 px-6">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="max-w-2xl mb-16">
                <Kicker>Built for modern e-commerce</Kicker>
                <h2 style={display} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.025em] leading-[1.05]">
                  Every tool you need to <span className="italic font-extrabold text-[#7b1425]">drive revenue.</span>
                </h2>
                <p className="text-base text-[#14090b]/65 mt-4">
                  Replace fragmented spreadsheets and disconnected dashboards with real-time intelligence backed by mathematical proof.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-14">
              {features.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="border-t border-[#14090b] pt-6 group">
                    <div className="flex items-center justify-between">
                      <span style={display} className="italic text-3xl font-extrabold text-[#7b1425]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Icon size={20} className="text-[#14090b]/50 group-hover:text-[#7b1425] transition-colors" />
                    </div>
                    <h3 style={display} className="mt-5 text-2xl font-semibold tracking-[-0.01em]">{title}</h3>
                    <p className="mt-2 text-sm text-[#14090b]/65 leading-relaxed">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Multi-agent engine - Reveal & Stagger */}
        <section id="agents" className="py-24 px-6 bg-[#f3ede7]">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="max-w-2xl mb-14">
                <Kicker>LangGraph multi-agent architecture</Kicker>
                <h2 style={display} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.025em] leading-[1.05]">
                  Specialized AI agents, <span className="italic font-extrabold text-[#7b1425]">working in harmony.</span>
                </h2>
                <p className="text-base text-[#14090b]/65 mt-4">
                  Instead of a generic chatbot, Sellsy routes your questions through specialized autonomous agents governed by a Central Orchestrator.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {agents.map((a, i) => (
                <Reveal key={a.n} delay={i * 0.08}>
                  <div className="bg-white p-6 rounded-xl border border-[#14090b]/10 hover:border-[#7b1425] transition-colors h-full">
                    <span style={display} className="italic text-4xl font-extrabold text-[#7b1425]">{a.n}</span>
                    <h4 className="text-sm font-bold mt-4">{a.name}</h4>
                    <p className="text-xs text-[#14090b]/65 mt-1.5 leading-relaxed">{a.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 5. How it works - Reveal & Stagger */}
        <section id="how-it-works" className="py-24 px-6 bg-white border-y border-[#14090b]/10">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="max-w-2xl mb-14">
                <Kicker>How it works</Kicker>
                <h2 style={display} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.025em] leading-[1.05]">
                  From raw data to <span className="italic font-extrabold text-[#7b1425]">clear decisions.</span>
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.08}>
                  <div className="flex gap-5">
                    <span style={display} className="italic text-7xl font-extrabold leading-none text-[#7b1425]">{s.n}</span>
                    <div className="pt-2">
                      <h3 style={display} className="text-2xl font-semibold">{s.title}</h3>
                      <p className="mt-2 text-sm text-[#14090b]/65 leading-relaxed">{s.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Integrations - Reveal */}
        <section id="integrations" className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <h2 style={display} className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">Seamless data ingestion</h2>
              <p className="text-sm text-[#14090b]/65 mt-3 max-w-2xl mx-auto">
                Connect your Shopify storefront in seconds, or upload your historical product, order, and customer CSV files with auto-detected mapping.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {[
                  { icon: Plug, label: "Shopify API Integration" },
                  { icon: FileSpreadsheet, label: "CSV Auto-Mapping Ingestion" },
                  { icon: Zap, label: "Model Context Protocol (MCP)" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-white border border-[#14090b]/15">
                    <Icon size={17} className="text-[#7b1425]" />
                    <span className="text-xs font-bold">{label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* 7. CTA - Reveal */}
        <section className="py-24 bg-[#7b1425] text-[#faf8f5] px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <h2 style={display} className="text-4xl sm:text-6xl font-semibold tracking-[-0.03em] leading-[1.04]">
                Ready to unlock your store's <span className="italic font-extrabold">true potential?</span>
              </h2>
              <p className="mt-5 text-[#faf8f5]/80 text-base">
                Join forward-thinking e-commerce merchants making data-driven decisions every day.
              </p>
              <div className="mt-9 flex justify-center">
                <Link
                  href="/dashboard"
                  className="px-8 py-3.5 rounded-full bg-[#faf8f5] text-[#7b1425] font-bold text-sm hover:bg-[#14090b] hover:text-white transition-colors"
                >
                  Explore Live Sellsy Dashboard
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 8. Footer */}
        <footer className="mt-auto py-8 bg-[#faf8f5] text-[#6f6264] text-xs px-6 border-t border-[#14090b]/10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo size={24} />
              <span>• Understand your store. Make smarter decisions.</span>
            </div>
            <p>© 2026 Sellsy Inc. Enterprise Capstone Platform.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
