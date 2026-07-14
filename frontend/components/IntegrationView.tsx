"use client";

import { useState } from "react";
import { api } from "@/lib/api";

const CONFIG: Record<
  string,
  { title: string; placeholder: string; type: "url" | "username"; endpoint: "github" | "youtube" | "website" | "leetcode" }
> = {
  github: { title: "GitHub", placeholder: "https://github.com/user/repo", type: "url", endpoint: "github" },
  youtube: { title: "YouTube", placeholder: "https://youtube.com/watch?v=...", type: "url", endpoint: "youtube" },
  websites: { title: "Websites", placeholder: "https://docs.example.com", type: "url", endpoint: "website" },
  leetcode: { title: "LeetCode", placeholder: "your-leetcode-username", type: "username", endpoint: "leetcode" }
};

export function IntegrationView({ view }: { view: string }) {
  const config = CONFIG[view];
  const [value, setValue] = useState("");
  const [note, setNote] = useState<string | null>(null);

  if (!config) return null;

  async function handleAdd() {
    if (!value.trim()) return;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = window.localStorage.getItem("ivision_token");
    const res = await fetch(`${API_BASE}/api/integrations/${config.endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(
        config.type === "url" ? { url: value } : { username: value }
      )
    });
    const data = await res.json();
    setNote(data.note || "Added.");
    setValue("");
  }

  return (
    <div className="flex h-full flex-1 flex-col px-6 py-8 sm:px-12">
      <h1 className="text-2xl font-semibold text-white">{config.title}</h1>
      <p className="mt-1 max-w-lg text-sm text-white/50">
        This module is architected end-to-end (database model + API route +
        UI) but not yet activated — it needs an external API credential on
        the backend to actually fetch and index real data.
      </p>

      <div className="glass-panel mt-6 flex max-w-lg items-center gap-2 rounded-xl p-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={config.placeholder}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/85 hover:bg-white/15"
        >
          Add
        </button>
      </div>

      {note && <p className="mt-3 max-w-lg text-xs text-white/45">{note}</p>}
    </div>
  );
}
