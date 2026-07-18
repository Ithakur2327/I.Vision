"use client";

import { PanelLeft, Library, SquarePen } from "lucide-react";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Logo } from "@/components/Logo";

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
      className="fixed left-3 top-4 bottom-4 z-40 flex w-14 flex-col items-center rounded-[26px] border border-white/10 bg-[#0c0e10]/80 py-4 backdrop-blur-xl sm:left-4"
      aria-label="Primary"
    >
      {/* brand mark */}
      <div className="mb-4 flex items-center justify-center" title="i.vision">
        <Logo size={34} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <RailButton
          active={historyOpen}
          label="Chat history"
          onClick={onToggleHistory}
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </RailButton>

        <RailButton label="New chat" onClick={onNewChat}>
          <SquarePen className="h-[18px] w-[18px]" />
        </RailButton>

        <div className="my-1 h-px w-6 bg-white/10" />

        <RailButton active={libraryOpen} label="Library" onClick={onToggleLibrary}>
          <Library className="h-[18px] w-[18px]" />
        </RailButton>
      </div>

      {/* spacer pushes profile to the bottom of the rail */}
      <div className="flex-1" />

      <ProfileMenu variant="rail" />
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