"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import { Logo } from "@/components/Logo";
import {
  Store,
  TrendingUp,
  Package,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X
} from "lucide-react";

interface Slide {
  id: number;
  badge: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accentBg: string;
  accentBorder: string;
  iconColor: string;
  badgeColor: string;
  isLast?: boolean;
}

const slides: Slide[] = [
  {
    id: 1,
    badge: "Welcome",
    title: "Welcome to Sellsy",
    description: "Your store's sales, products and customers, all in one simple place.",
    icon: Store,
    accentBg: "bg-[#FBF1F3]",
    accentBorder: "border-[#EBC3CB]",
    iconColor: "text-[#7b1425]",
    badgeColor: "bg-[#7b1425]/10 text-[#7b1425]",
  },
  {
    id: 2,
    badge: "Sales",
    title: "See your sales clearly",
    description: "Know how much you sold today, this week and this month.",
    icon: TrendingUp,
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    iconColor: "text-emerald-700",
    badgeColor: "bg-emerald-100/70 text-emerald-800",
  },
  {
    id: 3,
    badge: "Products",
    title: "Know your best products",
    description: "Find out what sells most and what is running low.",
    icon: Package,
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    iconColor: "text-amber-700",
    badgeColor: "bg-amber-100/70 text-amber-900",
  },
  {
    id: 4,
    badge: "Customers",
    title: "Understand your customers",
    description: "See who buys from you and who comes back.",
    icon: Users,
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-200",
    iconColor: "text-purple-700",
    badgeColor: "bg-purple-100/70 text-purple-900",
  },
  {
    id: 5,
    badge: "AI Assistant",
    title: "Ask AI anything",
    description: "Ask questions about your store in plain words and get instant answers.",
    icon: Sparkles,
    accentBg: "bg-[#FBF1F3]",
    accentBorder: "border-[#EBC3CB]",
    iconColor: "text-[#7b1425]",
    badgeColor: "bg-[#7b1425]/10 text-[#7b1425]",
  },
  {
    id: 6,
    badge: "All Set",
    title: "Ready to try it?",
    description: "Step inside the live demo to explore your sales, products and AI assistant.",
    icon: ArrowRight,
    accentBg: "bg-[#14090b]",
    accentBorder: "border-[#14090b]",
    iconColor: "text-white",
    badgeColor: "bg-[#7b1425] text-white",
    isLast: true,
  },
];

export default function DemoPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const active = slides[currentSlide];
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleGoToDashboard();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setCurrentSlide(slides.length - 1);
  };

  const handleGoToDashboard = () => {
    if (ApiClient.isAuthenticated()) {
      router.push("/dashboard");
    } else {
      router.push("/login?redirect=/dashboard");
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentSlide > 0) {
          setCurrentSlide((prev) => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentSlide]);

  // Touch swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      // Swiped left -> next
      if (currentSlide < slides.length - 1) {
        setCurrentSlide((prev) => prev + 1);
      }
    } else if (diff < -50) {
      // Swiped right -> back
      if (currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1);
      }
    }
    setTouchStartX(null);
  };

  const IconComponent = active.icon;

  return (
    <div
      className="min-h-screen bg-[#faf8f5] flex flex-col justify-between select-none relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{
          background: "radial-gradient(ellipse 60% 70% at 50% -10%, rgba(123,20,37,.10), rgba(123,20,37,0) 70%)",
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 max-w-5xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center">
          <Logo size={30} />
        </Link>

        {!isLast ? (
          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-[#6f6264] hover:text-[#7b1425] px-3 py-1.5 rounded-full hover:bg-white border border-transparent hover:border-[#e8e2dc] transition-all cursor-pointer"
          >
            Skip to end
          </button>
        ) : (
          <Link
            href="/"
            className="text-xs font-semibold text-[#6f6264] hover:text-[#7b1425] px-3 py-1.5 rounded-full hover:bg-white border border-transparent hover:border-[#e8e2dc] transition-all inline-flex items-center gap-1"
          >
            <X size={14} />
            <span>Close</span>
          </Link>
        )}
      </header>

      {/* Main Flashcard Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-12 border border-[#e8e2dc]/90 shadow-sm flex flex-col items-center text-center transition-all duration-300">
          {/* Card Icon */}
          <div
            key={`icon-${active.id}`}
            className={`w-20 h-20 rounded-2xl ${active.accentBg} ${active.accentBorder} border flex items-center justify-center ${active.iconColor} shadow-xs mb-6 animate-in zoom-in-95 duration-200`}
          >
            <IconComponent size={36} />
          </div>

          {/* Badge */}
          <span
            key={`badge-${active.id}`}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${active.badgeColor} mb-3 animate-in fade-in duration-200`}
          >
            {active.badge}
          </span>

          {/* Title */}
          <h1
            key={`title-${active.id}`}
            className="text-2xl sm:text-3xl font-bold text-[#14090b] tracking-tight leading-snug animate-in fade-in duration-200"
          >
            {active.title}
          </h1>

          {/* Description */}
          <p
            key={`desc-${active.id}`}
            className="text-sm sm:text-base text-[#6f6264] leading-relaxed mt-3 max-w-sm animate-in fade-in duration-200"
          >
            {active.description}
          </p>

          {/* Final Action Button (Slide 6) or Next Button */}
          {isLast ? (
            <button
              onClick={handleGoToDashboard}
              className="mt-8 w-full py-3.5 px-6 rounded-2xl bg-[#7b1425] hover:bg-[#600f1c] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="mt-8 w-full flex items-center justify-between gap-3 pt-4 border-t border-[#f3ede7]">
              <button
                onClick={handleBack}
                disabled={isFirst}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isFirst
                    ? "opacity-0 pointer-events-none"
                    : "text-[#5a4e50] hover:text-[#14090b] hover:bg-[#faf8f5] cursor-pointer"
                }`}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-[#7b1425] hover:bg-[#600f1c] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Progress Dots & Counter */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentSlide === idx
                    ? "w-8 h-2.5 bg-[#7b1425]"
                    : "w-2.5 h-2.5 bg-[#e8e2dc] hover:bg-[#d4c9c2]"
                }`}
                title={`Slide ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-[#a89b99]">
            {currentSlide + 1} of {slides.length}
          </span>
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-[#a89b99]">
        Use left & right arrow keys to navigate slides
      </footer>
    </div>
  );
}

