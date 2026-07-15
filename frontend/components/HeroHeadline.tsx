"use client";

import { motion } from "framer-motion";

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
          href="/login"
          className="rounded-full bg-white px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
        >
          Get Started
        </a>
      </div>
    </motion.div>
  );
}
