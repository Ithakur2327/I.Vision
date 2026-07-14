"use client";

import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  LayoutGrid,
  Folder,
  GitBranch,
  ArrowLeftRight,
  BarChart2
} from "lucide-react";

const CHECK_ITEMS = [
  "Documents indexed",
  "GitHub repository synced",
  "Embeddings generated"
];

const PROGRESS_ROWS = [
  ["Chunking complete", "Vectors stored"],
  ["Memory updated", "Index refreshed"]
];

export function KnowledgePanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="relative w-full max-w-md"
    >
      {/* Icon dock with connecting bracket */}
      <div className="relative mb-3 flex justify-center">
        <div className="absolute top-6 h-16 w-[85%] rounded-b-3xl border border-t-0 border-white/8 bg-white/[0.03]" />
        <div className="relative z-10 flex gap-3">
          <IconChip icon={<LayoutGrid className="h-4 w-4" />} />
          <IconChip icon={<GitBranch className="h-4 w-4" />} active />
          <IconChip icon={<Folder className="h-4 w-4" />} />
        </div>
      </div>

      {/* Checklist panel */}
      <div className="relative mt-10 flex items-start gap-2">
        <div className="mt-1 flex shrink-0 flex-col items-center gap-3 text-white/40">
          <ArrowLeftRight className="h-4 w-4" />
          <BarChart2 className="h-4 w-4" />
        </div>

        <div className="glass-panel flex-1 rounded-2xl p-4">
          <ul className="space-y-2.5">
            {CHECK_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-2.5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/90 text-background">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-sm text-white/85">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 h-10 rounded-xl bg-white/5" />
        </div>
      </div>

      {/* Description card with vertical accent bar */}
      <div className="glass-panel mt-4 flex items-start gap-3 rounded-2xl p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Sparkles className="h-4 w-4 text-accent" />
        </span>
        <p className="text-xs leading-relaxed text-white/60">
          i.vision is an AI-powered assistant where your documents, code, and
          notes become searchable knowledge — instantly, in one place.
        </p>
        <div className="ml-auto h-16 w-1.5 shrink-0 self-stretch rounded-full bg-gradient-to-b from-ember to-accent/60" />
      </div>

      {/* Progress panel */}
      <div className="glass-panel mt-4 rounded-2xl p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white" />
          <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-ember via-accent/70 to-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {PROGRESS_ROWS.flat().map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/50">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              <span className="truncate text-xs text-white/50">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function IconChip({
  icon,
  active
}: {
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
        active
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-white/10 bg-white/5 text-white/70"
      }`}
    >
      {icon}
    </div>
  );
}

