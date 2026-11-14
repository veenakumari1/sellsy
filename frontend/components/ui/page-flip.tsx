"use client";

/**
 * @author: @dorianbaffier (adapted for Sellsy & Tailwind 3)
 * @description: Page Flip from Kokonut UI
 * @license: MIT
 * @website: https://kokonutui.com
 */

import { animate, useReducedMotion } from "motion/react";
import React, {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface Pt {
  x: number;
  y: number;
}

/** A page being turned: which way, by which corner, and where that corner is. */
interface Turn {
  dir: 1 | -1;
  /** The corner's resting point, in book pixels. */
  corner: Pt;
  /** Where the corner is now. */
  at: Pt;
}

export interface PageFlipHandle {
  go: (dir: 1 | -1) => void;
  goTo: (spreadIndex: number) => void;
  spread: number;
  spreads: number;
  isSingle: boolean;
}

export interface PageFlipProps {
  /** Pages in reading order. The first is the cover, alone on the right. */
  pages?: ReactNode[];
  /** Called with the spread index after a page settles. */
  onSpreadChange?: (spread: number) => void;
  /** Programmatically jump to a target spread index. */
  targetSpread?: number | null;
  /** Whether to show the bottom pagination navigation buttons. */
  showControls?: boolean;
  className?: string;
}

/** Below this frame width (px), the book shows one page at a time. */
const SINGLE_BELOW = 520;
/** Marks a layer that isn't drawn. */
const HIDDEN = Symbol("hidden");

interface Layers {
  left?: ReactNode;
  right?: ReactNode;
  /** The page being turned, on its own side. */
  turning?: ReactNode;
  /** What's printed on the back of the turning page. */
  back?: ReactNode | typeof HIDDEN;
}

/** Two pages open: the cover alone on the right, then pairs. */
function twoPages(pages: ReactNode[], spread: number, dir?: 1 | -1): Layers {
  const leftOf = (s: number) => (s > 0 ? pages[2 * s - 1] : undefined);
  const rightOf = (s: number) => pages[2 * s];
  if (!dir) {
    return { left: leftOf(spread), right: rightOf(spread) };
  }
  // While turning, what shows under the page is the next spread's.
  const target = spread + dir;
  return dir === 1
    ? {
        left: leftOf(spread),
        right: rightOf(target),
        turning: rightOf(spread),
        back: leftOf(target),
      }
    : {
        left: leftOf(target),
        right: rightOf(spread),
        turning: leftOf(spread),
        back: rightOf(target),
      };
}

/**
 * One page at a time: a page turns off to the left with blank paper on its
 * back, and turning back brings the previous page in over the current one.
 */
function onePage(pages: ReactNode[], page: number, dir?: 1 | -1): Layers {
  if (dir === 1) {
    return { right: pages[page + 1], turning: pages[page], back: null };
  }
  if (dir === -1) {
    return { right: pages[page], back: pages[page - 1] ?? HIDDEN };
  }
  return { right: pages[page] };
}

/** How far to slide a closed book so its one page sits in the middle. */
function centerShift({ left, right }: Layers) {
  if (left === undefined) {
    return -0.25;
  }
  return right === undefined ? 0.25 : 0;
}

/** Corner the pointer has to be within (px) for the page to lift on hover. */
const PEEK_ZONE = 64;
/** How far a hovered corner lifts toward the pointer, at most (px). */
const PEEK_MAX = 34;
/** Pointer travel that turns a press into a drag (px). */
const DRAG_SLOP = 4;
const TURN = { duration: 0.6, ease: [0.32, 0.72, 0, 1] } as const;
const SETTLE = { duration: 0.32, ease: [0.23, 1, 0.32, 1] } as const;

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
const len = (a: Pt) => Math.hypot(a.x, a.y);
const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Keeps a point within `radius` of `center`. */
function within(p: Pt, center: Pt, radius: number): Pt {
  const d = sub(p, center);
  const l = len(d);
  if (l <= radius) {
    return p;
  }
  return { x: center.x + (d.x / l) * radius, y: center.y + (d.y / l) * radius };
}

/** The part of a polygon on one side of a line through `m` with normal `n`. */
function clipPolygon(poly: Pt[], m: Pt, n: Pt, keepNegative: boolean): Pt[] {
  const side = (p: Pt) => {
    const d = dot(sub(p, m), n);
    return keepNegative ? -d : d;
  };
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = side(a);
    const db = side(b);
    if (da >= 0) {
      out.push(a);
    }
    if (da >= 0 !== db >= 0) {
      out.push(lerp(a, b, da / (da - db)));
    }
  }
  return out;
}

const polygon = (points: Pt[], dx: number) =>
  points.length
    ? `polygon(${points.map((p) => `${(p.x - dx).toFixed(2)}px ${p.y.toFixed(2)}px`).join(", ")})`
    : "polygon(0 0)";

/**
 * Where everything goes for a corner at `at`: the fold is the line halfway
 * between the corner's rest and where it is now. The page keeps the spine
 * side, and the flap (its back) is mirrored across the fold.
 */
function foldStyles(turn: Turn, w: number, h: number) {
  const x0 = turn.dir === 1 ? w : 0;
  const page = [
    { x: x0, y: 0 },
    { x: x0 + w, y: 0 },
    { x: x0 + w, y: h },
    { x: x0, y: h },
  ];
  const d = sub(turn.at, turn.corner);
  const l = len(d);
  if (l < 0.5) {
    return null;
  }
  const n = { x: d.x / l, y: d.y / l };
  const m = lerp(turn.corner, turn.at, 0.5);
  const front = clipPolygon(page, m, n, false);
  const flap = clipPolygon(page, m, n, true);
  // Reflection across the fold: X -> A X + b.
  const a = 1 - 2 * n.x * n.x;
  const bc = -2 * n.x * n.y;
  const dd = 1 - 2 * n.y * n.y;
  const k = 2 * dot(m, n);
  const bx = k * n.x;
  const by = k * n.y;
  // The flap element sits at the page's spot; CSS moves it from there.
  const e = a * x0 + bx - x0;
  const f = bc * x0 + by;
  return {
    front: { clipPath: polygon(front, x0) } satisfies CSSProperties,
    flap: {
      clipPath: polygon(flap, x0),
      transform: `matrix(${a}, ${bc}, ${bc}, ${dd}, ${e}, ${f})`,
    } satisfies CSSProperties,
    /** How far through the turn, for the shadow. */
    progress: Math.min(1, l / (2 * w)),
  };
}

const PageFlip = forwardRef<PageFlipHandle, PageFlipProps>(function PageFlip(
  {
    pages = [],
    onSpreadChange,
    targetSpread,
    showControls = false,
    className,
  },
  ref
) {
  const reduceMotion = useReducedMotion();
  const bookRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  /** Narrow frames show one page at a time; the spine sits off to the left. */
  const [single, setSingle] = useState(false);
  const singleRef = useRef(false);
  // The spread on two pages, or the page on one.
  const [spread, setSpread] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  /** The spread a committed turn is heading for, so the book recenters with it. */
  const [heading, setHeading] = useState<number | null>(null);
  const turnRef = useRef<Turn | null>(null);
  const pressRef = useRef<{
    start: Pt;
    dragging: boolean;
    back?: boolean;
  } | null>(null);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const playingRef = useRef(false);
  /** A turn that will finish on its own: presses wait for it. */
  const committingRef = useRef(false);
  const onSpreadChangeRef = useRef(onSpreadChange);
  onSpreadChangeRef.current = onSpreadChange;

  const spreads = single ? pages.length : Math.floor(pages.length / 2) + 1;

  useLayoutEffect(() => {
    const book = bookRef.current;
    const frame = frameRef.current;
    if (!(book && frame)) {
      return;
    }
    const measure = () => {
      const narrow = frame.clientWidth < SINGLE_BELOW;
      if (narrow !== singleRef.current) {
        singleRef.current = narrow;
        setSingle(narrow);
        // Keep the same page in view when the layout changes.
        setSpread((s) => (narrow ? Math.max(0, 2 * s - 1) : Math.ceil(s / 2)));
      }
      setSize({ w: book.clientWidth / 2, h: book.clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(book);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => animRef.current?.stop(), []);

  const stop = () => {
    animRef.current?.stop();
    playingRef.current = false;
  };

  const setAt = useCallback((next: Turn | null) => {
    turnRef.current = next;
    setTurn(next);
  }, []);

  /** Keeps the corner where paper can reach: the page stays on its spine. */
  const reach = useCallback(
    (p: Pt, corner: Pt) => {
      const { w, h } = size;
      const spineSame = { x: w, y: corner.y };
      const spineOther = { x: w, y: corner.y === 0 ? h : 0 };
      return within(within(p, spineSame, w), spineOther, Math.hypot(w, h));
    },
    [size]
  );

  const cornerFor = (dir: 1 | -1, y: number): Pt => ({
    x: dir === 1 ? 2 * size.w : 0,
    y: y < size.h / 2 ? 0 : size.h,
  });

  /** Runs the corner from where it is to `to`, lifting it on the way over. */
  const run = (from: Turn, to: Pt, complete: boolean) => {
    stop();
    const start = from.at;
    const lift = complete ? size.h * 0.14 * (from.corner.y === 0 ? 1 : -1) : 0;
    committingRef.current = complete;
    const next = spread + from.dir;
    if (complete) {
      setHeading(next);
    }
    playingRef.current = true;
    animRef.current = animate(0, 1, {
      ...(complete ? TURN : SETTLE),
      onUpdate: (t) => {
        const p = lerp(start, to, t);
        setAt({
          ...from,
          at: { x: p.x, y: p.y + Math.sin(Math.PI * t) * lift },
        });
      },
      onComplete: () => {
        playingRef.current = false;
        committingRef.current = false;
        setAt(null);
        setHeading(null);
        if (complete) {
          setSpread(next);
          onSpreadChangeRef.current?.(next);
        }
      },
    });
  };

  const canTurn = (dir: 1 | -1) =>
    dir === 1 ? spread < spreads - 1 : spread > 0;

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!(canTurn(dir) && size.w) || committingRef.current) {
        return;
      }
      if (reduceMotion) {
        setSpread((s) => {
          const next = s + dir;
          onSpreadChangeRef.current?.(next);
          return next;
        });
        return;
      }
      const corner = cornerFor(dir, size.h);
      run(
        { dir, corner, at: { x: corner.x - dir * 1, y: corner.y - 1 } },
        { x: corner.x - dir * 2 * size.w, y: corner.y },
        true
      );
    },
    [spread, spreads, size, reduceMotion]
  );

  const goTo = useCallback(
    (targetSpread: number) => {
      const clamped = Math.max(0, Math.min(spreads - 1, targetSpread));
      if (clamped === spread || committingRef.current) return;
      if (reduceMotion) {
        setSpread(clamped);
        onSpreadChangeRef.current?.(clamped);
        return;
      }
      const dir: 1 | -1 = clamped > spread ? 1 : -1;
      const corner = cornerFor(dir, size.h);
      run(
        { dir, corner, at: { x: corner.x - dir * 1, y: corner.y - 1 } },
        { x: corner.x - dir * 2 * size.w, y: corner.y },
        true
      );
      setSpread(clamped);
      onSpreadChangeRef.current?.(clamped);
    },
    [spread, spreads, size, reduceMotion]
  );

  useImperativeHandle(
    ref,
    () => ({
      go,
      goTo,
      spread,
      spreads,
      isSingle: single,
    }),
    [go, goTo, spread, spreads, single]
  );

  useEffect(() => {
    if (targetSpread !== null && targetSpread !== undefined) {
      goTo(targetSpread);
    }
  }, [targetSpread, goTo]);

  const local = (event: PointerEvent): Pt => {
    const rect = bookRef.current?.getBoundingClientRect();
    return rect
      ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
      : { x: 0, y: 0 };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // If clicking a button or link inside the page, let it handle the click!
    if ((event.target as HTMLElement).closest("a, button, input, textarea")) {
      return;
    }
    if (event.button !== 0 || !size.w || committingRef.current) {
      return;
    }
    const p = local(event);
    // On one page, its left edge goes back and the rest turns forward.
    const backZone = single && p.x < size.w * 1.3;
    const dir: 1 | -1 = p.x >= size.w && !backZone ? 1 : -1;
    if (!canTurn(dir)) {
      return;
    }
    if (reduceMotion) {
      go(dir);
      return;
    }
    stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    pressRef.current = { start: p, dragging: false };
    if (single && dir === -1) {
      pressRef.current = { start: p, dragging: false, back: true };
      return;
    }
    const current = turnRef.current;
    const corner = current?.dir === dir ? current.corner : cornerFor(dir, p.y);
    setAt({ dir, corner, at: current?.dir === dir ? current.at : corner });
  };

  /** A corner near the pointer lifts a little, inviting the turn. */
  const peek = (p: Pt) => {
    const dir: 1 | -1 = p.x >= size.w ? 1 : -1;
    const corner = cornerFor(dir, p.y);
    const near = canTurn(dir) && len(sub(p, corner)) < PEEK_ZONE;
    const current = turnRef.current;
    if (!near) {
      if (current) {
        run(current, current.corner, false);
      }
      return;
    }
    stop();
    const toward = sub(p, corner);
    const l = Math.max(1, len(toward));
    const lift = Math.min(PEEK_MAX, l * 0.6 + 14);
    setAt({
      dir,
      corner,
      at: reach(
        {
          x: corner.x + (toward.x / l) * lift,
          y: corner.y + (toward.y / l) * lift,
        },
        corner
      ),
    });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const p = local(event);
    const press = pressRef.current;
    const current = turnRef.current;
    if (press?.back) {
      press.dragging ||= len(sub(p, press.start)) >= DRAG_SLOP;
      return;
    }
    if (press && current) {
      if (!press.dragging && len(sub(p, press.start)) < DRAG_SLOP) {
        return;
      }
      press.dragging = true;
      setAt({ ...current, at: reach(p, current.corner) });
      return;
    }
    if (event.pointerType === "mouse" && !playingRef.current && !reduceMotion) {
      peek(p);
    }
  };

  const onPointerUp = () => {
    const press = pressRef.current;
    const current = turnRef.current;
    pressRef.current = null;
    if (press?.back) {
      if (!press.dragging) {
        go(-1);
      }
      return;
    }
    if (!(press && current)) {
      return;
    }
    const crossed =
      current.dir === 1 ? current.at.x < size.w : current.at.x > size.w;
    const complete = press.dragging ? crossed : true;
    run(
      current,
      complete
        ? {
            x: current.corner.x - current.dir * 2 * size.w,
            y: current.corner.y,
          }
        : current.corner,
      complete
    );
  };

  const onPointerLeave = () => {
    const current = turnRef.current;
    if (!pressRef.current && current && !playingRef.current) {
      run(current, current.corner, false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      go(event.key === "ArrowRight" ? 1 : -1);
    }
  };

  const fold = turn && size.w ? foldStyles(turn, size.w, size.h) : null;
  const { left, right, turning, back } = single
    ? onePage(pages, spread, turn?.dir)
    : twoPages(pages, spread, turn?.dir);
  const shift = single ? 0 : centerShift(twoPages(pages, heading ?? spread));
  const first = single ? spread + 1 : Math.max(1, 2 * spread);
  const last = single ? spread + 1 : Math.min(pages.length, 2 * spread + 1);

  return (
    <div
      className={cn(
        "flex w-full max-w-4xl flex-col items-center overflow-x-clip select-none",
        className
      )}
      ref={frameRef}
    >
      <div
        className={cn(
          "shrink-0 rounded-md motion-reduce:transition-none drop-shadow-2xl",
          single
            ? "w-[200%] self-start"
            : "w-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        )}
        style={{ transform: `translateX(${single ? -50 : shift * 100}%)` }}
      >
        <div
          className="relative aspect-[3/2] w-full touch-none select-none rounded-md"
          onPointerCancel={onPointerUp}
          onPointerDown={onPointerDown}
          onPointerLeave={onPointerLeave}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          ref={bookRef}
        >
          {left !== undefined && <Paper side="left">{left}</Paper>}
          {right !== undefined && <Paper side="right">{right}</Paper>}
          {turn && fold && turning !== undefined && (
            <Paper side={turn.dir === 1 ? "right" : "left"} style={fold.front}>
              {turning}
            </Paper>
          )}
          {turn && !fold && turning !== undefined && (
            <Paper side={turn.dir === 1 ? "right" : "left"}>{turning}</Paper>
          )}
          {turn && fold && back !== undefined && back !== HIDDEN && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                filter: `drop-shadow(0 ${3 + fold.progress * 8}px ${8 + fold.progress * 14}px rgba(0, 0, 0, ${0.25 + (1 - fold.progress) * 0.15}))`,
              }}
            >
              <Paper
                back
                side={turn.dir === 1 ? "right" : "left"}
                style={fold.flap}
              >
                {back}
              </Paper>
            </div>
          )}
        </div>
      </div>

      {showControls && (
        <div className="mt-5 flex items-center gap-3 text-xs text-white/70">
          <NavButton
            disabled={spread === 0}
            label="Previous page"
            onClick={() => go(-1)}
            onKeyDown={onKeyDown}
          >
            <path d="M10 4 6 8l4 4" />
          </NavButton>
          <span aria-live="polite" className="min-w-24 text-center tabular-nums">
            {first === last ? `${first}` : `${first}–${last}`} of {pages.length}
          </span>
          <NavButton
            disabled={spread === spreads - 1}
            label="Next page"
            onClick={() => go(1)}
            onKeyDown={onKeyDown}
          >
            <path d="m6 4 4 4-4 4" />
          </NavButton>
        </div>
      )}
    </div>
  );
});

export default PageFlip;

function Paper({
  side,
  back = false,
  style,
  children,
}: {
  side: "left" | "right";
  back?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute top-0 h-full w-1/2 origin-top-left overflow-hidden text-white",
        back
          ? "bg-[#5c0f1c]" // slightly deeper maroon for the back of sheet
          : "bg-[#7b1425]", // rich Sellsy burgundy/maroon for page front
        side === "left"
          ? "left-0 rounded-l-md shadow-[inset_-2px_0_6px_rgba(0,0,0,0.35)]"
          : "left-1/2 rounded-r-md shadow-[inset_2px_0_6px_rgba(0,0,0,0.35)]",
        "ring-1 ring-black/30"
      )}
      style={style}
    >
      {/* The back of a page reads the right way round once it's folded over. */}
      <div className={cn("size-full", back && "-scale-x-100")}>
        <div className="size-full">{children}</div>
      </div>
      {/* The gutter: paper curving into the spine (Tailwind 3 compatible gradients). */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 w-[10%] z-20",
          side === "left"
            ? "right-0 bg-gradient-to-l from-black/45 via-black/15 to-transparent"
            : "left-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent"
        )}
      />
    </div>
  );
}

function NavButton({
  children,
  label,
  disabled,
  onClick,
  onKeyDown,
}: {
  children: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      aria-disabled={disabled || undefined}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full text-white ring-1 ring-white/20 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 aria-disabled:cursor-default aria-disabled:text-white/30 aria-disabled:hover:bg-transparent"
      onClick={disabled ? undefined : onClick}
      onKeyDown={onKeyDown}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        viewBox="0 0 16 16"
      >
        {children}
      </svg>
    </button>
  );
}
