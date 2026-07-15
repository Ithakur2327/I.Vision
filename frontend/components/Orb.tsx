"use client";

import { motion } from "framer-motion";
import { useId } from "react";

/**
 * An advanced, photoreal-leaning "liquid glass" orb.
 *
 * Built from layered SVG (feTurbulence + feDisplacementMap to fake glass
 * refraction/caustics) plus CSS radial/conic gradients for bloom, sheen and
 * specular highlights. No external image assets.
 *
 *  - `active`: slow, heavy "breathing" swirl (idle / empty chat state)
 *  - `pulse`: faster, tighter turbulence used while typing / generating
 */
export function Orb({
  size = 260,
  pulse = false
}: {
  size?: number;
  pulse?: boolean;
}) {
  const uid = useId().replace(/[:]/g, "");
  const breatheDuration = pulse ? 1.2 : 6;
  const rotateDuration = pulse ? 6 : 22;
  const turbDuration = pulse ? 4 : 14;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* ambient far bloom */}
      <motion.div
        className="absolute inset-[-70%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(20,214,170,0.38), rgba(20,214,170,0) 70%)"
        }}
        animate={{
          opacity: pulse ? [0.5, 1, 0.5] : [0.4, 0.75, 0.4],
          scale: pulse ? [1, 1.16, 1] : [1, 1.08, 1]
        }}
        transition={{ duration: breatheDuration, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* cooler secondary bloom */}
      <motion.div
        className="absolute inset-[-40%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(59,130,246,0.22), rgba(59,130,246,0) 70%)"
        }}
        animate={{ opacity: [0.28, 0.55, 0.28], scale: [1, 1.06, 1] }}
        transition={{ duration: breatheDuration * 1.3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* SVG glass/water sphere — the main event */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        style={{ filter: `drop-shadow(0 0 ${size * 0.14}px rgba(20,214,170,0.45))` }}
      >
        <defs>
          {/* base body gradient, teal core → near-black edge, like a deep glass ball */}
          <radialGradient id={`body-${uid}`} cx="34%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#eafff8" stopOpacity="0.95" />
            <stop offset="12%" stopColor="#a9ffe8" stopOpacity="0.85" />
            <stop offset="32%" stopColor="#16d6aa" stopOpacity="0.95" />
            <stop offset="58%" stopColor="#0a5c50" />
            <stop offset="82%" stopColor="#031311" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* watery turbulence used to displace the inner swirl layer */}
          <filter id={`water-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.028"
              numOctaves={3}
              seed={4}
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur={`${turbDuration}s`}
                values="0.010 0.024;0.018 0.034;0.010 0.024"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={pulse ? 26 : 16}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* finer ripple filter for the caustic highlight layer */}
          <filter id={`ripple-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.05"
              numOctaves={2}
              seed={9}
              result="n2"
            >
              <animate
                attributeName="baseFrequency"
                dur={`${turbDuration * 0.7}s`}
                values="0.02 0.04;0.04 0.07;0.02 0.04"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n2" scale={pulse ? 14 : 8} />
          </filter>

          <linearGradient id={`sheen-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <clipPath id={`clip-${uid}`}>
            <circle cx="100" cy="100" r="88" />
          </clipPath>
        </defs>

        {/* base glass sphere */}
        <circle cx="100" cy="100" r="88" fill={`url(#body-${uid})`} />

        <g clipPath={`url(#clip-${uid})`}>
          {/* swirling internal "water" bands, distorted by turbulence filter */}
          <g filter={`url(#water-${uid})`}>
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: rotateDuration, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
            >
              <ellipse cx="100" cy="70" rx="90" ry="30" fill="#ffffff" opacity="0.14" />
              <ellipse cx="100" cy="130" rx="95" ry="24" fill="#0ea5e9" opacity="0.22" />
              <ellipse cx="70" cy="100" rx="26" ry="90" fill="#34d399" opacity="0.16" />
            </motion.g>
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: rotateDuration * 1.7, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
            >
              <ellipse cx="120" cy="95" rx="70" ry="18" fill="#a7f3d0" opacity="0.2" />
              <ellipse cx="85" cy="115" rx="18" ry="60" fill="#ffffff" opacity="0.1" />
            </motion.g>
          </g>

          {/* fine caustic ripple layer on top, screen-blended for glassy sparkle */}
          <g filter={`url(#ripple-${uid})`} style={{ mixBlendMode: "screen" }}>
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: rotateDuration * 0.8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
            >
              <path
                d="M20 90 Q100 40 180 90"
                stroke="#e0fff6"
                strokeWidth="3"
                fill="none"
                opacity="0.35"
              />
              <path
                d="M25 120 Q100 165 175 120"
                stroke="#ffffff"
                strokeWidth="2"
                fill="none"
                opacity="0.25"
              />
            </motion.g>
          </g>

          {/* diagonal glass sheen sweep */}
          <motion.rect
            x="-40"
            y="-40"
            width="280"
            height="280"
            fill={`url(#sheen-${uid})`}
            animate={{ x: [-60, 60, -60], y: [-60, 60, -60] }}
            transition={{ duration: breatheDuration * 2, repeat: Infinity, ease: "easeInOut" }}
            opacity={0.5}
          />

          {/* inner shadow for depth / edge falloff (glass thickness feel) */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="#000000"
            strokeWidth="30"
            opacity="0.35"
            style={{ filter: "blur(10px)" }}
          />
        </g>

        {/* rim light */}
        <circle
          cx="100"
          cy="100"
          r="87"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.2"
        />
      </svg>

      {/* primary specular highlight (crisp glass "hot spot") */}
      <motion.div
        className="absolute rounded-full blur-[2px]"
        style={{
          width: size * 0.16,
          height: size * 0.1,
          top: size * 0.18,
          left: size * 0.26,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.98), rgba(255,255,255,0) 80%)",
          transform: "rotate(-20deg)"
        }}
        animate={{ opacity: pulse ? [0.7, 1, 0.7] : [0.85, 1, 0.85] }}
        transition={{ duration: breatheDuration * 0.7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* secondary micro highlight */}
      <div
        className="absolute rounded-full blur-[1px]"
        style={{
          width: size * 0.045,
          height: size * 0.045,
          bottom: size * 0.26,
          right: size * 0.24,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.65), rgba(255,255,255,0) 80%)"
        }}
      />
    </div>
  );
}