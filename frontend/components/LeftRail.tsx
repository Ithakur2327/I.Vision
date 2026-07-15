"use client";

import { PanelLeft, Library, Plus } from "lucide-react";

export function LeftRail({
  historyOpen,
  onToggleHistory,
  libraryOpen,
  onToggleLibrary,
  onNewChat
}: {
  historyOpen: boolean;
  onToggleHistory: () => void;
  libraryOpen: boolean;
  onToggleLibrary: () => void;
  onNewChat: () => void;
}) {
  return (
    <nav
      className="fixed left-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/10 bg-[#0c0e10]/80 py-4 px-2 backdrop-blur-xl sm:left-4"
      aria-label="Primary"
    >
      <RailButton
        active={historyOpen}
        label="Chat history"
        onClick={onToggleHistory}
      >
        <PanelLeft className="h-[18px] w-[18px]" />
      </RailButton>

      <RailButton label="New chat" onClick={onNewChat}>
        <Plus className="h-[18px] w-[18px]" />
      </RailButton>

      <div className="my-1 h-px w-6 bg-white/10" />

      <RailButton active={libraryOpen} label="Library" onClick={onToggleLibrary}>
        <Library className="h-[18px] w-[18px]" />
      </RailButton>
    </nav>
  );
}

function RailButton({
  children,
  active,
  label,
  onClick
}: {
  children: React.ReactNode;
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        active
          ? "bg-emerald-400/15 text-emerald-300"
          : "text-white/60 hover:bg-white/8 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
