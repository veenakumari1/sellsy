"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ApiClient } from "@/lib/api";
import { Logo } from "@/components/Logo";
import {
  Store,
  TrendingUp,
  Package,
  Users,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";

const PageFlip = dynamic(() => import("@/components/kokonutui/page-flip"), {
  ssr: false,
});

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,144,500..800,100,1;1,144,500..800,100,1&family=IBM+Plex+Mono:wght@400;500&display=swap";

const displayFont: React.CSSProperties = {
  fontFamily: '"Fraunces", Georgia, serif',
  fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
};

const monoFont: React.CSSProperties = {
  fontFamily: '"IBM Plex Mono", monospace',
};

interface Slide {
  id: number;
  badge: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const slides: Slide[] = [
  {
    id: 1,
    badge: "Welcome",
    title: "Welcome to Sellsy",
    description: "Your store's sales, products and customers, all in one simple place.",
    icon: Store,
  },
  {
    id: 2,
    badge: "Sales",
    title: "See your sales clearly",
    description: "Know how much you sold today, this week and this month.",
    icon: TrendingUp,
  },
  {
    id: 3,
    badge: "Products",
    title: "Know your best products",
    description: "Find out what sells most and what is running low.",
    icon: Package,
  },
  {
    id: 4,
    badge: "Customers",
    title: "Understand your customers",
    description: "See who buys from you and who comes back.",
    icon: Users,
  },
  {
    id: 5,
    badge: "AI Assistant",
    title: "Ask AI anything",
    description: "Ask questions about your store in plain words and get instant answers.",
    icon: Sparkles,
  },
  {
    id: 6,
    badge: "All Set",
    title: "Ready to try it?",
    description: "Step inside the live demo to explore your sales, products and AI assistant.",
    icon: ArrowRight,
  },
];

export default function ExploreDemoWalkthrough() {
  const router = useRouter();
  const [currentSpread, setCurrentSpread] = useState(0);
  const [targetSpread, setTargetSpread] = useState<number | null>(null);
  const [isSingle, setIsSingle] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsSingle(window.innerWidth < 520);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Escape key to close
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const handleGoToDashboard = () => {
    if (ApiClient.isAuthenticated()) {
      router.push("/dashboard");
    } else {
      router.push("/login?redirect=/dashboard");
    }
  };

  const lastTarget = isSingle ? 5 : 3;
  const isLastSpread = currentSpread >= lastTarget;

  const handleSkip = () => {
    setTargetSpread(lastTarget);
  };

  const onSpreadChange = (newSpread: number) => {
    setCurrentSpread(newSpread);
    setTargetSpread(null);
  };

  const bookPages = useMemo(() => {
    return [
      // Page 0 / Slide 1: Cover
      <div
        key="slide-1"
        className="flex size-full flex-col items-center justify-center p-6 sm:p-10 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-4 sm:mb-5">
          <Store size={32} />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-3">
          {slides[0].badge}
        </span>
        <h2
          style={displayFont}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[0].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2.5 max-w-xs">
          {slides[0].description}
        </p>
        <span className="mt-6 text-[10px] sm:text-[11px] uppercase tracking-widest text-white/60 font-medium">
          Flip corner to open →
        </span>
      </div>,

      // Page 1 / Slide 2: Sales
      <div
        key="slide-2"
        className="flex size-full flex-col items-center justify-center p-6 sm:p-10 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-4 sm:mb-5">
          <TrendingUp size={32} />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-3">
          {slides[1].badge}
        </span>
        <h2
          style={displayFont}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[1].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2.5 max-w-xs">
          {slides[1].description}
        </p>
      </div>,

      // Page 2 / Slide 3: Products
      <div
        key="slide-3"
        className="flex size-full flex-col items-center justify-center p-6 sm:p-10 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-4 sm:mb-5">
          <Package size={32} />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-3">
          {slides[2].badge}
        </span>
        <h2
          style={displayFont}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[2].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2.5 max-w-xs">
          {slides[2].description}
        </p>
      </div>,

      // Page 3 / Slide 4: Customers
      <div
        key="slide-4"
        className="flex size-full flex-col items-center justify-center p-6 sm:p-10 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-4 sm:mb-5">
          <Users size={32} />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-3">
          {slides[3].badge}
        </span>
        <h2
          style={displayFont}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[3].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2.5 max-w-xs">
          {slides[3].description}
        </p>
      </div>,

      // Page 4 / Slide 5: AI Assistant
      <div
        key="slide-5"
        className="flex size-full flex-col items-center justify-center p-6 sm:p-10 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-4 sm:mb-5">
          <Sparkles size={32} />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-3">
          {slides[4].badge}
        </span>
        <h2
          style={displayFont}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[4].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2.5 max-w-xs">
          {slides[4].description}
        </p>
      </div>,

      // Page 5 / Slide 6: Ready to try it?
      <div
        key="slide-6"
        className="flex size-full flex-col items-center justify-center p-6 sm:p-10 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-4 sm:mb-5">
          <ArrowRight size={32} />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-3">
          {slides[5].badge}
        </span>
        <h2
          style={displayFont}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[5].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2.5 max-w-xs">
          {slides[5].description}
        </p>
        <button
          onClick={handleGoToDashboard}
          className="mt-6 w-full max-w-xs py-3 px-6 rounded-2xl bg-white hover:bg-white/90 text-[#7b1425] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Go to Dashboard</span>
          <ArrowRight size={15} />
        </button>
      </div>,

      // Page 6: Plain maroon blank page to balance two-page spreads
      <div
        key="blank-last"
        className="flex size-full flex-col items-center justify-center p-6 sm:p-10 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="opacity-20 flex flex-col items-center gap-2.5">
          <Logo size={36} />
          <span style={monoFont} className="text-[10px] tracking-[0.25em] uppercase font-medium text-white">
            Sellsy Platform
          </span>
        </div>
      </div>,
    ];
  }, [isSingle]);

  return (
    <>
      <link rel="stylesheet" href={FONT_URL} />
      <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between select-none relative overflow-hidden">
        {/* Background ambient gradient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% -10%, rgba(123,20,37,.10), rgba(123,20,37,0) 70%)",
          }}
        />

        {/* Top Header */}
        <header className="relative z-10 max-w-5xl w-full mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Logo size={30} />
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {!isLastSpread && (
              <button
                onClick={handleSkip}
                className="text-xs font-semibold text-[#6f6264] hover:text-[#7b1425] px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white border border-[#e8e2dc] transition-all cursor-pointer shadow-xs"
              >
                Skip to end
              </button>
            )}

            <Link
              href="/"
              className="text-xs font-semibold text-[#6f6264] hover:text-[#7b1425] px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white border border-[#e8e2dc] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <X size={14} />
              <span>Close</span>
            </Link>
          </div>
        </header>

        {/* Main Book Container */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8 w-full max-w-5xl mx-auto">
          <PageFlip
            pages={bookPages}
            targetSpread={targetSpread}
            onSpreadChange={onSpreadChange}
            className="w-full"
          />
        </main>

        {/* Bottom Footer Note */}
        <footer className="relative z-10 py-4 text-center text-xs text-[#a89b99]">
          Click or drag page corners to flip · Press Esc to close
        </footer>
      </div>
    </>
  );
}

