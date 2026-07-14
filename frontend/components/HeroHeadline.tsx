"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function HeroHeadline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      className="max-w-xl"
    >
      <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
        Your <span className="text-accent">AI</span>
        <br />
        second brain.
        <br />
        Your knowledge.
        <br />
        Fully connected.
      </h1>

      <div className="mt-8 flex items-center gap-4">
        <a
          href="/app"
          className="rounded-full bg-white px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
        >
          Get Started
        </a>
        <button className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white/85 transition-colors hover:bg-white/5">
          <Play className="h-3.5 w-3.5" />
          Watch video
        </button>
      </div>
    </motion.div>
  );
}
