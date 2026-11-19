"use client";

/**
 * @author: @dorianbaffier (adapted for Storsy & Tailwind 3)
 * @description: Liquid Gauge from Kokonut UI
 * @license: MIT
 * @website: https://kokonutui.com
 */

import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn, formatCurrency } from "@/lib/utils";

// The surface is a row of columns joined by springs. Each column bobs
// around the fill line and pulls on its neighbours, so a push travels.
const COLUMNS = 28;
// Simulation, in px and seconds, on a fixed step.
const STEP = 1 / 120;
const SPREAD = 2600;
const RESTORE = 18;
const SURFACE_DAMPING = 2.2;
// The fill line follows the value on an underdamped spring, so a big change
// overshoots a little and settles, like a poured glass.
const LEVEL_STIFFNESS = 90;
const LEVEL_DAMPING = 11;
// How hard a sideways drag rocks the liquid, and how hard the pointer
// stirs it when moving through it.
const SLOSH = 4.5;
const STIR = 20;
const MAX_WAVE = 26;
// The meniscus: a lighter band riding just above the surface.
const RIM = 3;
// Bubbles rise while the level is climbing.
const BUBBLES = 10;
const BUBBLE_RATE = 0.06;
const REST_EPSILON = 0.02;

export interface LiquidGaugeProps {
  /** Controlled fill, 0 to 100. */
  value?: number;
  /** Initial fill when uncontrolled. */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Turns the gauge into a read-only display. */
  readOnly?: boolean;
  label?: string;
  /** Capacity shown in the subline, in `unit`. */
  total?: number;
  unit?: string;
  /** From this fill on, the liquid turns red. */
  warnAt?: number;
  /** If true, liquid turns red when value <= warnAt instead of >= warnAt */
  warnBelow?: boolean;
  /** Custom status string at the bottom */
  statusText?: string;
  /** Custom formatted subline */
  subline?: string;
  className?: string;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
  alive: boolean;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(6);
    } catch {
      // Ignored if device does not support or allow vibration
    }
  }
}

function surfacePolygon(
  heights: Float64Array,
  levelY: number,
  width: number,
  height: number,
  lift: number
) {
  let points = "";
  for (let i = 0; i < COLUMNS; i++) {
    const x = (i / (COLUMNS - 1)) * width;
    const y = clamp(levelY + heights[i] - lift, -40, height + 40);
    points += `${x.toFixed(1)}px ${y.toFixed(1)}px,`;
  }
  return `polygon(${points}${width}px ${height + 40}px,0px ${height + 40}px)`;
}

function flatPolygon(value: number, lift = 0) {
  const top = 100 - value;
  return `polygon(0% calc(${top}% - ${lift}px),100% calc(${top}% - ${lift}px),100% 100%,0% 100%)`;
}

function drawBubbles(
  bubbles: Bubble[],
  nodes: (HTMLSpanElement | null)[],
  time: number
) {
  bubbles.forEach((bubble, i) => {
    const node = nodes[i];
    if (!node) {
      return;
    }
    if (!bubble.alive) {
      node.style.opacity = "0";
      return;
    }
    const sway = Math.sin(time * 7 + bubble.phase) * 2.5;
    node.style.opacity = "1";
    node.style.transform = `translate3d(${(bubble.x + sway - bubble.r).toFixed(1)}px,${(bubble.y - bubble.r).toFixed(1)}px,0) scale(${(bubble.r / 4).toFixed(3)})`;
  });
}

function setText(nodes: (HTMLSpanElement | null)[], text: string) {
  for (const node of nodes) {
    if (node) {
      node.textContent = text;
    }
  }
}

function GaugeText({
  label,
  status,
  value,
  used,
  total,
  unit,
  subline,
  statusText,
  percentRef,
  usedRef,
}: {
  label: string;
  status: string;
  value: number;
  used: string;
  total: number;
  unit: string;
  subline?: string;
  statusText?: string;
  percentRef: (node: HTMLSpanElement | null) => void;
  usedRef: (node: HTMLSpanElement | null) => void;
}) {
  return (
    <>
      <div className="absolute inset-x-0 top-0 p-5 sm:p-6 select-none">
        <p className="font-semibold text-xs sm:text-sm tracking-tight">{label}</p>
        <p className="mt-2 sm:mt-3 font-bold text-5xl sm:text-6xl tabular-nums tracking-tight">
          <span ref={percentRef}>{Math.round(value)}</span>
          <span className="ml-0.5 font-medium text-2xl sm:text-3xl opacity-60">%</span>
        </p>
        <p className="mt-1 text-xs sm:text-sm tabular-nums opacity-75 truncate">
          {subline ? (
            <span>{subline}</span>
          ) : unit === "Rs" ? (
            <span>
              <span ref={usedRef}>{used}</span> of {formatCurrency(total)}
            </span>
          ) : (
            <span>
              <span ref={usedRef}>{used}</span> of {total} {unit}
            </span>
          )}
        </p>
      </div>
      <p className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 font-semibold text-xs sm:text-sm tracking-tight truncate max-w-[80%] select-none">
        {statusText ?? status}
      </p>
      {/* Every ten percent, a short tick on the right wall. */}
      <div className="absolute inset-y-0 right-0 w-4 pointer-events-none">
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((tick) => (
          <span
            className={cn(
              "absolute right-0 h-px bg-current opacity-30",
              tick === 50 ? "w-3" : "w-1.5"
            )}
            key={tick}
            style={{ top: `${100 - tick}%` }}
          />
        ))}
      </div>
    </>
  );
}

export function LiquidGauge({
  value: valueProp,
  defaultValue = 72,
  onValueChange,
  readOnly = false,
  label = "Storage",
  total = 128,
  unit = "GB",
  warnAt = 90,
  warnBelow = false,
  statusText,
  subline,
  className,
}: LiquidGaugeProps) {
  // Gracefully handle null, undefined, or NaN
  const sanitizedValueProp =
    valueProp !== undefined && valueProp !== null && !isNaN(Number(valueProp))
      ? clamp(Number(valueProp), 0, 100)
      : valueProp === undefined
      ? undefined
      : 0;

  const [internal, setInternal] = useState(defaultValue);
  const value = clamp(sanitizedValueProp ?? internal, 0, 100);
  const [dragging, setDragging] = useState(false);
  const [initial] = useState(value);

  const rootRef = useRef<HTMLDivElement>(null);
  const liquidRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const percentRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const usedRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const sim = useRef({
    heights: new Float64Array(COLUMNS),
    speeds: new Float64Array(COLUMNS),
    level: value,
    levelSpeed: 0,
    target: value,
    width: 0,
    height: 0,
    bubbles: Array.from(
      { length: BUBBLES },
      (): Bubble => ({ x: 0, y: 0, r: 0, speed: 0, phase: 0, alive: false })
    ),
    spawn: 0,
    shown: Math.round(value),
    raf: 0,
    last: 0,
    carry: 0,
    time: 0,
    pointerX: -1,
    pointerId: -1,
    visible: true,
    reduceMotion: false,
  });

  const totalRef = useRef(total);
  totalRef.current = total;
  const unitRef = useRef(unit);
  unitRef.current = unit;

  const setValue = useCallback(
    (next: number) => {
      const rounded = Math.round(clamp(next, 0, 100));
      if (sanitizedValueProp === undefined) {
        setInternal(rounded);
      }
      onValueChange?.(rounded);
    },
    [sanitizedValueProp, onValueChange]
  );

  const draw = useCallback(() => {
    const s = sim.current;
    const { width, height } = s;
    if (!(width && height)) {
      return;
    }
    const levelY = height * (1 - s.level / 100);
    if (liquidRef.current) {
      liquidRef.current.style.clipPath = surfacePolygon(
        s.heights,
        levelY,
        width,
        height,
        0
      );
    }
    if (rimRef.current) {
      rimRef.current.style.clipPath = surfacePolygon(
        s.heights,
        levelY,
        width,
        height,
        RIM
      );
    }
    drawBubbles(s.bubbles, bubbleRefs.current, s.time);
    const shown = Math.round(clamp(s.level, 0, 100));
    if (shown !== s.shown) {
      s.shown = shown;
      const rawUsed = (shown / 100) * totalRef.current;
      const formattedUsed =
        unitRef.current === "Rs"
          ? formatCurrency(rawUsed)
          : rawUsed.toFixed(1);
      setText(percentRefs.current, String(shown));
      setText(usedRefs.current, formattedUsed);
    }
  }, []);

  const spawnBubbles = useCallback((dt: number) => {
    const s = sim.current;
    s.spawn += Math.max(0, s.levelSpeed) * BUBBLE_RATE * dt;
    while (s.spawn >= 1) {
      s.spawn -= 1;
      const free = s.bubbles.find((b) => !b.alive);
      if (!free) {
        s.spawn = 0;
        break;
      }
      free.alive = true;
      free.x = s.width * (0.12 + Math.random() * 0.76);
      free.y = s.height - 6;
      free.r = 1.5 + Math.random() * 2.5;
      free.speed = 70 + Math.random() * 80;
      free.phase = Math.random() * Math.PI * 2;
    }
  }, []);

  const advanceBubbles = useCallback((dt: number) => {
    const s = sim.current;
    const levelY = s.height * (1 - s.level / 100);
    for (const b of s.bubbles) {
      if (!b.alive) {
        continue;
      }
      b.y -= b.speed * dt;
      if (b.y < levelY) {
        b.alive = false;
        const col = clamp(
          Math.round((b.x / s.width) * (COLUMNS - 1)),
          0,
          COLUMNS - 1
        );
        s.speeds[col] += b.r * 8;
      }
    }
  }, []);

  const stepPhysics = useCallback(
    (dt: number) => {
      const s = sim.current;
      s.time += dt;

      const levelDiff = s.target - s.level;
      s.levelSpeed +=
        (levelDiff * LEVEL_STIFFNESS - s.levelSpeed * LEVEL_DAMPING) * dt;
      s.level += s.levelSpeed * dt;

      for (let i = 0; i < COLUMNS; i++) {
        const h = s.heights[i];
        const v = s.speeds[i];
        s.speeds[i] += (-RESTORE * h - SURFACE_DAMPING * v) * dt;
        s.heights[i] += s.speeds[i] * dt;
      }

      for (let pass = 0; pass < 8; pass++) {
        for (let i = 0; i < COLUMNS; i++) {
          if (i > 0) {
            const pull = (s.heights[i] - s.heights[i - 1]) * SPREAD * dt * 0.125;
            s.speeds[i] -= pull;
            s.speeds[i - 1] += pull;
          }
          if (i < COLUMNS - 1) {
            const pull = (s.heights[i] - s.heights[i + 1]) * SPREAD * dt * 0.125;
            s.speeds[i] -= pull;
            s.speeds[i + 1] += pull;
          }
        }
      }

      for (let i = 0; i < COLUMNS; i++) {
        s.heights[i] = clamp(s.heights[i], -MAX_WAVE, MAX_WAVE);
      }

      spawnBubbles(dt);
      advanceBubbles(dt);
    },
    [advanceBubbles, spawnBubbles]
  );

  const isResting = useCallback(() => {
    const s = sim.current;
    if (
      Math.abs(s.level - s.target) > REST_EPSILON ||
      Math.abs(s.levelSpeed) > REST_EPSILON
    ) {
      return false;
    }
    for (let i = 0; i < COLUMNS; i++) {
      if (
        Math.abs(s.heights[i]) > REST_EPSILON ||
        Math.abs(s.speeds[i]) > REST_EPSILON
      ) {
        return false;
      }
    }
    return !s.bubbles.some((b) => b.alive);
  }, []);

  const wake = useCallback(() => {
    const s = sim.current;
    if (s.raf || !s.visible) {
      return;
    }
    s.last = performance.now();
    const tick = (nowMs: number) => {
      const dt = Math.min(0.1, (nowMs - s.last) / 1000);
      s.last = nowMs;

      if (s.reduceMotion) {
        s.level = s.target;
        s.levelSpeed = 0;
        s.heights.fill(0);
        s.speeds.fill(0);
        draw();
        s.raf = 0;
        return;
      }

      s.carry += dt;
      let steps = 0;
      while (s.carry >= STEP && steps < 6) {
        stepPhysics(STEP);
        s.carry -= STEP;
        steps++;
      }
      draw();

      if (isResting()) {
        s.level = s.target;
        s.levelSpeed = 0;
        s.heights.fill(0);
        s.speeds.fill(0);
        draw();
        s.raf = 0;
        return;
      }
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
  }, [draw, isResting, stepPhysics]);

  useEffect(() => {
    const s = sim.current;
    if (s.target !== value) {
      s.target = value;
      wake();
    }
  }, [value, wake]);

  useEffect(() => {
    const s = sim.current;
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    s.reduceMotion = motion.matches;
    const onMotion = () => {
      s.reduceMotion = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    const resize = new ResizeObserver(([entry]) => {
      s.width = entry.contentRect.width;
      s.height = entry.contentRect.height;
      draw();
    });
    resize.observe(root);

    const pause = () => {
      if (!s.visible && s.raf) {
        cancelAnimationFrame(s.raf);
        s.raf = 0;
        s.last = 0;
      } else if (s.visible) {
        wake();
      }
    };
    let onScreen = true;
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      s.visible = onScreen && !document.hidden;
      pause();
    });
    intersection.observe(root);
    const onVisibility = () => {
      s.visible = onScreen && !document.hidden;
      pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      motion.removeEventListener("change", onMotion);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [draw, wake]);

  const valueFromY = (clientY: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) {
      return value;
    }
    return (1 - (clientY - rect.top) / rect.height) * 100;
  };

  const disturb = (clientX: number, force: number, radius = 3) => {
    const s = sim.current;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || s.reduceMotion) {
      return;
    }
    const center = ((clientX - rect.left) / rect.width) * (COLUMNS - 1);
    for (let i = 0; i < COLUMNS; i++) {
      const d = Math.abs(i - center);
      if (d < radius) {
        s.speeds[i] += force * (1 - d / radius);
      }
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (readOnly || event.button !== 0) {
      return;
    }
    const s = sim.current;
    s.pointerId = event.pointerId;
    s.pointerX = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    haptic();

    const next = valueFromY(event.clientY);
    const kick = (next - value) * SLOSH;
    disturb(event.clientX, kick);
    setValue(next);
    wake();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const dx = s.pointerX < 0 ? 0 : event.clientX - s.pointerX;
    s.pointerX = event.clientX;

    if (s.pointerId === event.pointerId) {
      const next = valueFromY(event.clientY);
      const dy = next - value;
      disturb(event.clientX, dy * SLOSH + dx * 2);
      setValue(next);
      wake();
      return;
    }

    const rect = rootRef.current?.getBoundingClientRect();
    if (event.pointerType !== "mouse" || !rect || dx === 0) {
      return;
    }
    const levelY = rect.height * (1 - s.level / 100);
    if (event.clientY - rect.top > levelY + 8) {
      disturb(event.clientX, Math.abs(dx) * STIR, 2);
      wake();
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (s.pointerId !== event.pointerId) {
      return;
    }
    s.pointerId = -1;
    setDragging(false);
    haptic();
    wake();
  };

  const handlePointerLeave = () => {
    if (sim.current.pointerId < 0) {
      sim.current.pointerX = -1;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) {
      return;
    }
    const steps: Record<string, number> = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: 10,
      PageDown: -10,
    };
    let next: number | undefined;
    if (event.key in steps) {
      next = value + steps[event.key] * (event.shiftKey ? 10 : 1);
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = 100;
    }
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      disturb(rect.left + rect.width / 2, next > value ? 120 : -120, 4);
    }
    setValue(next);
    wake();
  };

  // Warning threshold calculation
  const warn = warnBelow ? value <= warnAt : value >= warnAt;
  const status = warn ? "Warning" : `${100 - Math.round(value)}% remaining`;
  const rawUsed = (Math.round(value) / 100) * total;
  const used = unit === "Rs" ? formatCurrency(rawUsed) : rawUsed.toFixed(1);

  const textProps = {
    label,
    status,
    value: initial,
    used: unit === "Rs" ? formatCurrency((Math.round(initial) / 100) * total) : ((Math.round(initial) / 100) * total).toFixed(1),
    total,
    unit,
    subline,
    statusText,
  };

  return (
    <div
      aria-label={label}
      aria-orientation="vertical"
      aria-readonly={readOnly || undefined}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${Math.round(value)}%, ${used} of ${total} ${unit}`}
      className={cn(
        "relative h-72 sm:h-80 w-full max-w-[280px] touch-none select-none overflow-hidden rounded-2xl border border-[#e8e2dc] bg-white text-[#14090b] shadow-xs outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#7b1425]/40 focus-visible:ring-offset-2",
        !readOnly && (dragging ? "cursor-grabbing" : "cursor-ns-resize"),
        className
      )}
      onKeyDown={handleKeyDown}
      onLostPointerCapture={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={rootRef}
      role="slider"
      tabIndex={readOnly ? -1 : 0}
    >
      <GaugeText
        {...textProps}
        percentRef={(node) => {
          percentRefs.current[0] = node;
        }}
        usedRef={(node) => {
          usedRefs.current[0] = node;
        }}
      />

      {/* The meniscus, a lighter band just above the liquid */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-colors duration-300 ease-out",
          warn ? "bg-red-300 dark:bg-red-900" : "bg-[#f3cfd6] dark:bg-[#7b1425]/40"
        )}
        ref={rimRef}
        style={{ clipPath: flatPolygon(initial, RIM) }}
      />

      {/* The liquid with Storsy burgundy/maroon branding, turning red on warning */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-colors duration-300 ease-out",
          warn
            ? "bg-red-500 text-white"
            : "bg-[#7b1425] text-white"
        )}
        ref={liquidRef}
        style={{ clipPath: flatPolygon(initial) }}
      >
        <GaugeText
          {...textProps}
          percentRef={(node) => {
            percentRefs.current[1] = node;
          }}
          usedRef={(node) => {
            usedRefs.current[1] = node;
          }}
        />
        {Array.from({ length: BUBBLES }, (_, i) => (
          <span
            className="absolute top-0 left-0 w-2 h-2 rounded-full border border-current bg-current/20 opacity-0 pointer-events-none"
            key={`bubble-${i.toString()}`}
            ref={(node) => {
              bubbleRefs.current[i] = node;
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default LiquidGauge;

