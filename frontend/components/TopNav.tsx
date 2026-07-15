"use client";

import { motion } from "framer-motion";
import Link from "next/link";

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

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-white/80 transition-colors hover:text-white"
        >
          Log In
        </Link>
        <Link
          href="/login"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
        >
          Sign Up
        </Link>
      </div>
    </motion.header>
  );
}
