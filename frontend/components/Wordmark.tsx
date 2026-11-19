import React from "react";

interface WordmarkProps {
  size?: number;
  /** sirf "S" dikhane ke liye (collapsed sidebar) */
  compact?: boolean;
  className?: string;
}

export function Wordmark({ size = 28, compact = false, className = "" }: WordmarkProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
        fontStyle: "italic",
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: "#14090b",
        display: "inline-block",
      }}
    >
      <span style={{ color: "#7b1425" }}>S</span>
      {!compact && (
        <>
          tor<span>s</span>
          <span style={{ color: "#7b1425" }}>y</span>
        </>
      )}
    </span>
  );
}