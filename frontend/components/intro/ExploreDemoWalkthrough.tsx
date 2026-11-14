"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Volume2,
  VolumeX,
} from "lucide-react";

const PageFlip = dynamic(() => import("@/components/kokonutui/page-flip"), {
  ssr: false,
});

const displayFont: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), "Fraunces", Georgia, serif',
  fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
};

const monoFont: React.CSSProperties = {
  fontFamily: 'var(--font-plex-mono), "IBM Plex Mono", monospace',
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

// Synthesize a short paper page-flip swish with Web Audio API (about 300 ms filtered noise)
function playPaperSwish(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;
    const duration = 0.3; // ~300ms
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Filtered noise with paper friction texture
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass filter centered around 1-3 kHz with slight random pitch per flip
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    const centerFreq = 1600 + (Math.random() - 0.5) * 800; // 1200 - 2000 Hz
    filter.frequency.setValueAtTime(centerFreq, now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(350, centerFreq * 0.65),
      now + duration
    );
    filter.Q.setValueAtTime(1.3, now);

    // Gain envelope: quick attack (~30ms), smooth decay, base gain ~0.25 with slight random volume
    const gainNode = ctx.createGain();
    const baseGain = 0.25;
    const peakGain = baseGain * (0.88 + Math.random() * 0.24); // ~0.22 - 0.28
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(now);
    source.stop(now + duration);
  } catch {
    // Ignore audio graph errors if browser audio policy intervenes
  }
}

export default function ExploreDemoWalkthrough() {
  const router = useRouter();
  const [currentSpread, setCurrentSpread] = useState(0);
  const [targetSpread, setTargetSpread] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [bookWidth, setBookWidth] = useState<number>(0);

  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef<boolean>(false);
  const reduceMotionRef = useRef<boolean>(false);
  const lastPlayTimeRef = useRef<number>(0);
  const turnStartedRef = useRef<boolean>(false);

  // Web Audio Context initialization and resume helper
  const getOrCreateAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Unlock AudioContext on first user gesture (pointerdown/touchstart/keydown, capture phase)
  useEffect(() => {
    const handleUserGesture = () => {
      getOrCreateAudioContext();
    };

    window.addEventListener("pointerdown", handleUserGesture, { capture: true });
    window.addEventListener("touchstart", handleUserGesture, { capture: true });
    window.addEventListener("keydown", handleUserGesture, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", handleUserGesture, { capture: true });
      window.removeEventListener("touchstart", handleUserGesture, { capture: true });
      window.removeEventListener("keydown", handleUserGesture, { capture: true });
    };
  }, [getOrCreateAudioContext]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mql.matches;
    const handler = (e: MediaQueryListEvent) => {
      reduceMotionRef.current = e.matches;
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Mute preference in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sellsy_demo_muted");
      if (saved !== null) {
        const val = saved === "true";
        setIsMuted(val);
        mutedRef.current = val;
      }
    } catch {}
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      try {
        localStorage.setItem("sellsy_demo_muted", String(next));
      } catch {}
      if (!next) {
        getOrCreateAudioContext();
      }
      return next;
    });
  };

  // Play swish sound with 150 ms debounce
  const playFlipSound = useCallback(() => {
    if (mutedRef.current) return;
    if (reduceMotionRef.current) return;

    const now = Date.now();
    if (now - lastPlayTimeRef.current < 150) {
      return;
    }
    lastPlayTimeRef.current = now;

    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => playPaperSwish(ctx)).catch(() => {});
    } else {
      playPaperSwish(ctx);
    }
  }, [getOrCreateAudioContext]);

  const handleFlipStart = useCallback(() => {
    turnStartedRef.current = true;
    playFlipSound();
  }, [playFlipSound]);

  // Lock body scroll on this page
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Scale whole book to available width and height via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      if (availW <= 0 || availH <= 0) return;

      const maxH = Math.max(80, availH - 8);
      const maxW = Math.max(80, availW - 8);

      if (maxW < 520) {
        // Single page mode (aspect ratio 3:4 => w : h = 0.75)
        const w = Math.min(maxW, maxH * 0.75);
        setBookWidth(Math.floor(w));
      } else {
        // Two-page mode (aspect ratio 3:2 => w : h = 1.5, max-w-4xl = 896px)
        let w = Math.min(maxW, 896, maxH * 1.5);
        if (w < 520) {
          // If available height forced width below 520px, PageFlip uses single-page mode
          w = Math.min(maxW, maxH * 0.75, 480);
        }
        setBookWidth(Math.floor(w));
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
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

  const isSingle = (bookWidth > 0 ? bookWidth : (typeof window !== "undefined" ? window.innerWidth : 1200)) < 520;
  const lastTarget = isSingle ? 5 : 3;
  const isLastSpread = currentSpread >= lastTarget;

  const handleSkip = () => {
    setTargetSpread(lastTarget);
  };

  const onSpreadChange = (newSpread: number) => {
    setCurrentSpread(newSpread);
    setTargetSpread(null);
    if (!turnStartedRef.current) {
      playFlipSound();
    }
    turnStartedRef.current = false;
  };

  const bookPages = useMemo(() => {
    return [
      // Page 0 / Slide 1: Cover
      <div
        key="slide-1"
        className="flex size-full flex-col items-center justify-center p-5 sm:p-8 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-3 sm:mb-4">
          <Store size={28} className="sm:w-8 sm:h-8" />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-2.5">
          {slides[0].badge}
        </span>
        <h2
          style={displayFont}
          className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[0].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2 max-w-xs">
          {slides[0].description}
        </p>
        <span className="mt-4 sm:mt-5 text-[10px] sm:text-[11px] uppercase tracking-widest text-white/60 font-medium">
          Flip corner to open →
        </span>
      </div>,

      // Page 1 / Slide 2: Sales
      <div
        key="slide-2"
        className="flex size-full flex-col items-center justify-center p-5 sm:p-8 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-3 sm:mb-4">
          <TrendingUp size={28} className="sm:w-8 sm:h-8" />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-2.5">
          {slides[1].badge}
        </span>
        <h2
          style={displayFont}
          className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[1].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2 max-w-xs">
          {slides[1].description}
        </p>
      </div>,

      // Page 2 / Slide 3: Products
      <div
        key="slide-3"
        className="flex size-full flex-col items-center justify-center p-5 sm:p-8 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-3 sm:mb-4">
          <Package size={28} className="sm:w-8 sm:h-8" />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-2.5">
          {slides[2].badge}
        </span>
        <h2
          style={displayFont}
          className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[2].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2 max-w-xs">
          {slides[2].description}
        </p>
      </div>,

      // Page 3 / Slide 4: Customers
      <div
        key="slide-4"
        className="flex size-full flex-col items-center justify-center p-5 sm:p-8 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-3 sm:mb-4">
          <Users size={28} className="sm:w-8 sm:h-8" />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-2.5">
          {slides[3].badge}
        </span>
        <h2
          style={displayFont}
          className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[3].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2 max-w-xs">
          {slides[3].description}
        </p>
      </div>,

      // Page 4 / Slide 5: AI Assistant
      <div
        key="slide-5"
        className="flex size-full flex-col items-center justify-center p-5 sm:p-8 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-3 sm:mb-4">
          <Sparkles size={28} className="sm:w-8 sm:h-8" />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-2.5">
          {slides[4].badge}
        </span>
        <h2
          style={displayFont}
          className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[4].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2 max-w-xs">
          {slides[4].description}
        </p>
      </div>,

      // Page 5 / Slide 6: Ready to try it?
      <div
        key="slide-6"
        className="flex size-full flex-col items-center justify-center p-5 sm:p-8 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner mb-3 sm:mb-4">
          <ArrowRight size={28} className="sm:w-8 sm:h-8" />
        </div>
        <span className="px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white text-[#7b1425] shadow-xs mb-2.5">
          {slides[5].badge}
        </span>
        <h2
          style={displayFont}
          className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug"
        >
          {slides[5].title}
        </h2>
        <p className="text-xs sm:text-sm text-white/85 leading-relaxed mt-2 max-w-xs">
          {slides[5].description}
        </p>
        <button
          onClick={handleGoToDashboard}
          className="mt-5 w-full max-w-xs py-2.5 sm:py-3 px-6 rounded-2xl bg-white hover:bg-white/90 text-[#7b1425] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Go to Dashboard</span>
          <ArrowRight size={15} />
        </button>
      </div>,

      // Page 6: Plain maroon back cover to balance two-page spreads
      <div
        key="blank-last"
        className="flex size-full flex-col items-center justify-center p-5 sm:p-8 text-center select-none relative overflow-hidden bg-[#7b1425] text-white"
      >
        <div className="flex flex-col items-center gap-2.5 sm:gap-3">
          <span
            style={{
              fontFamily: 'var(--font-fraunces), "Fraunces", Georgia, serif',
              fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
              fontStyle: "italic",
              fontWeight: 800,
              fontSize: 38,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              display: "inline-block",
            }}
            className="px-4 text-white"
          >
            Sellsy
          </span>
          <span
            style={monoFont}
            className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-medium text-white/75"
          >
            SELLSY PLATFORM
          </span>
        </div>
      </div>,
    ];
  }, []);

  return (
    <div
      ref={overlayRef}
      style={{ height: "100dvh" }}
      className="h-screen h-dvh bg-[#faf8f5] flex flex-col justify-between select-none relative overflow-hidden"
    >
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
      <header className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <Link href="/" className="inline-flex items-center">
          <Logo size={30} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mute/Unmute sound button */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            title={isMuted ? "Unmute sound" : "Mute sound"}
            className="text-xs font-semibold text-[#6f6264] hover:text-[#7b1425] px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white border border-[#e8e2dc] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? "Muted" : "Sound"}</span>
          </button>

          {!isLastSpread && (
            <button
              type="button"
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
      <main
        ref={containerRef}
        className="relative z-10 flex-1 min-h-0 flex items-center justify-center px-4 w-full max-w-5xl mx-auto overflow-hidden"
      >
        <div
          style={{ width: bookWidth > 0 ? `${bookWidth}px` : undefined }}
          className="w-full max-w-4xl flex justify-center items-center"
        >
          <PageFlip
            pages={bookPages}
            targetSpread={targetSpread}
            onSpreadChange={onSpreadChange}
            onFlipStart={handleFlipStart}
            className="w-full"
          />
        </div>
      </main>

      {/* Bottom Footer Note with 24px bottom breathing room */}
      <footer className="relative z-10 pt-1 pb-6 text-center text-[11px] sm:text-xs text-[#a89b99] shrink-0">
        Click or drag page corners to flip · Press Esc to close
      </footer>
    </div>
  );
}
