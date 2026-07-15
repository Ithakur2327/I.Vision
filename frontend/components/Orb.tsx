"use client";

import { motion } from "framer-motion";

/**
 * A layered, glass-like animated orb built entirely from CSS radial/conic
 * gradients + framer-motion (no images/assets). Reacts to two states:
 *  - `active`: subtle idle breathing (default / empty chat state)
 *  - `pulse`: faster, tighter pulsing used while the user is typing or the
 *     assistant is generating a reply
 */
export function Orb({
  size = 260,
  pulse = false
}: {
  size?: number;
  pulse?: boolean;
}) {
  const breatheDuration = pulse ? 1.1 : 5.5;
  const rotateDuration = pulse ? 5 : 16;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* far ambient bloom */}
      <motion.div
        className="absolute inset-[-55%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(20,214,170,0.4), rgba(20,214,170,0) 70%)"
        }}
        animate={{
          opacity: pulse ? [0.55, 1, 0.55] : [0.45, 0.8, 0.45],
          scale: pulse ? [1, 1.14, 1] : [1, 1.07, 1]
        }}
        transition={{ duration: breatheDuration, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* secondary cooler bloom for depth */}
      <motion.div
        className="absolute inset-[-30%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(59,130,246,0.28), rgba(59,130,246,0) 70%)"
        }}
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: breatheDuration * 1.3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* rotating conic sheen — liquid-glass surface motion */}
      <motion.div
        className="absolute inset-[4%] rounded-full opacity-80 blur-[6px]"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(34,211,238,0.55), rgba(16,185,129,0.12), rgba(99,102,241,0.45), rgba(16,185,129,0.12), rgba(34,211,238,0.55))"
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: rotateDuration, repeat: Infinity, ease: "linear" }}
      />

      {/* second counter-rotating sheen for extra dimensionality */}
      <motion.div
        className="absolute inset-[14%] rounded-full opacity-60 blur-[3px] mix-blend-screen"
        style={{
          background:
            "conic-gradient(from 180deg, rgba(255,255,255,0.35), transparent 30%, rgba(20,214,170,0.4) 55%, transparent 80%)"
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: rotateDuration * 1.6, repeat: Infinity, ease: "linear" }}
      />

      {/* core glass sphere */}
      <motion.div
        className="absolute inset-[12%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 26%, rgba(255,255,255,0.98) 0%, rgba(190,255,235,0.6) 10%, rgba(20,214,170,0.92) 30%, rgba(8,110,95,0.96) 58%, rgba(2,12,11,1) 100%)",
          boxShadow:
            "inset -20px -26px 55px rgba(0,0,0,0.6), inset 12px 12px 34px rgba(255,255,255,0.28), 0 0 70px rgba(20,214,170,0.5)"
        }}
        animate={{ scale: pulse ? [1, 1.05, 1] : [1, 1.02, 1] }}
        transition={{ duration: breatheDuration, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* primary specular highlight */}
      <motion.div
        className="absolute rounded-full blur-[2px]"
        style={{
          width: size * 0.17,
          height: size * 0.11,
          top: size * 0.19,
          left: size * 0.27,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0) 80%)",
          transform: "rotate(-20deg)"
        }}
        animate={{ opacity: pulse ? [0.7, 1, 0.7] : [0.85, 1, 0.85] }}
        transition={{ duration: breatheDuration * 0.7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* secondary micro highlight */}
      <div
        className="absolute rounded-full blur-[1px]"
        style={{
          width: size * 0.05,
          height: size * 0.05,
          bottom: size * 0.24,
          right: size * 0.26,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.6), rgba(255,255,255,0) 80%)"
        }}
      />

      {/* thin rim ring for edge definition */}
      <div
        className="absolute inset-[12%] rounded-full"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.14)" }}
      />
    </div>
  );
}