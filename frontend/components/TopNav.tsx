"use client";

import { motion } from "framer-motion";

const NAV_LINKS = ["Product", "Features", "Earn as You Build"];

export function TopNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-20 flex items-center justify-between px-8 py-6 md:px-12"
    >
      <div className="text-lg font-semibold tracking-tight text-white">
        i<span className="text-accent">.</span>vision
      </div>

      <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className="transition-colors hover:text-white"
          >
            {link}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button className="text-sm text-white/80 transition-colors hover:text-white">
          Log In
        </button>
        <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.03]">
          Sign Up
        </button>
      </div>
    </motion.header>
  );
}
