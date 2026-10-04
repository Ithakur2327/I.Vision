"use client";

import { ArrowUpRight } from "lucide-react";

const ACCENT = "#00EBE1";

/**
 * Brand mark — a solid rounded-square badge with an outward arrow glyph,
 * matching the reference design: a confident, simple mark rather than the
 * previous decorative flower-knot render.
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="i.vision"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: `linear-gradient(155deg, ${ACCENT} 0%, #06c7be 100%)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.14), 0 6px 18px -6px ${ACCENT}99`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}
    >
      <ArrowUpRight
        size={Math.round(size * 0.56)}
        color="#04211f"
        strokeWidth={2.5}
      />
    </div>
  );
}