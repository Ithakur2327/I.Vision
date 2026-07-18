"use client";

const ACCENT = "#21F1A8";

/**
 * Brand mark: a glossy 4-lobed "flower knot" ring with a small floating
 * sphere at its centre — matches the reference render, rebuilt as scalable
 * SVG (gradients + highlights) so it stays crisp at any sidebar size and
 * needs no external image asset.
 */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="i.vision"
    >
      <defs>
        <radialGradient id="logo-petal" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#e9fff7" />
          <stop offset="30%" stopColor={ACCENT} />
          <stop offset="70%" stopColor="#0b5c47" />
          <stop offset="100%" stopColor="#04120e" />
        </radialGradient>
        <radialGradient id="logo-core" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor={ACCENT} />
          <stop offset="100%" stopColor="#08231b" />
        </radialGradient>
        <radialGradient id="logo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.55" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft ambient glow */}
      <circle cx="50" cy="50" r="48" fill="url(#logo-glow)" />

      {/* four overlapping lobes forming the flower-knot ring */}
      <g>
        <path
          d="M50 8 C62 8 58 30 50 38 C42 30 38 8 50 8 Z"
          fill="url(#logo-petal)"
        />
        <path
          d="M92 50 C92 62 70 58 62 50 C70 42 92 38 92 50 Z"
          fill="url(#logo-petal)"
        />
        <path
          d="M50 92 C38 92 42 70 50 62 C58 70 62 92 50 92 Z"
          fill="url(#logo-petal)"
        />
        <path
          d="M8 50 C8 38 30 42 38 50 C30 58 8 62 8 50 Z"
          fill="url(#logo-petal)"
        />
        <path
          d="M50 38 C58 30 66 34 68 42 C70 50 66 58 58 62 C50 66 42 70 38 62 C34 54 34 46 38 38 C42 30 46 34 50 38 Z"
          fill="url(#logo-petal)"
          opacity="0.9"
        />
      </g>

      {/* rim light on the outer edge */}
      <path
        d="M50 6 C74 6 94 26 94 50 C94 74 74 94 50 94 C26 94 6 74 6 50 C6 26 26 6 50 6 Z"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.6"
      />

      {/* floating centre sphere */}
      <circle cx="50" cy="52" r="7.5" fill="url(#logo-core)" />
      <circle cx="47.5" cy="49" r="1.8" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}