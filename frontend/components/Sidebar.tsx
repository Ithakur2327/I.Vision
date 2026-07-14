"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Brain,
  FileText,
  Github,
  Code2,
  Globe,
  Youtube,
  FolderKanban,
  Search,
  Settings,
  Plus
} from "lucide-react";

const NAV_ITEMS = [
  { key: "chats", label: "Chats", icon: MessageSquare },
  { key: "knowledge", label: "Knowledge", icon: Brain },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "github", label: "GitHub", icon: Github },
  { key: "leetcode", label: "LeetCode", icon: Code2 },
  { key: "websites", label: "Websites", icon: Globe },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "projects", label: "Projects", icon: FolderKanban }
];

export function Sidebar({
  active,
  onSelect,
  onNewChat
}: {
  active: string;
  onSelect: (key: string) => void;
  onNewChat: () => void;
}) {
  const [search, setSearch] = useState("");

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/8 bg-[#0B0C0E] px-4 py-5">
      <div className="mb-6 flex items-center justify-between px-1">
        <span className="text-base font-semibold text-white">
          i<span className="text-accent">.</span>vision
        </span>
        <button
          onClick={onNewChat}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 text-white/80 transition-colors hover:bg-white/15"
          aria-label="New chat"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Universal search"
          className="w-full rounded-lg border border-white/8 bg-white/5 py-2 pl-8 pr-3 text-xs text-white/85 placeholder:text-white/35 focus:border-accent/40 focus:outline-none"
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active === key
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white/90"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <button
        onClick={() => onSelect("settings")}
        className={`mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          active === "settings"
            ? "bg-white/10 text-white"
            : "text-white/60 hover:bg-white/5 hover:text-white/90"
        }`}
      >
        <Settings className="h-4 w-4" />
        Settings
      </button>
    </aside>
  );
}
