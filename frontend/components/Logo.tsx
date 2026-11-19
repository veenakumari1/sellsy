import React from "react";
import Link from "next/link";

interface LogoProps {
  size?: number;
  className?: string;
  href?: string;
  light?: boolean;
}

export function Logo({ size = 30, className = "", href, light = false }: LogoProps) {
  const content = (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-fraunces), "Fraunces", Georgia, serif',
        fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
        fontStyle: "italic",
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: light ? "#faf8f5" : "#14090b",
        display: "inline-block",
      }}
    >
      <span style={{ color: "#7b1425" }}>S</span>tor<span>s</span>
      <span style={{ color: "#7b1425" }}>y</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;

