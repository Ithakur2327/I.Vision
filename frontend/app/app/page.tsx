"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWorkspace } from "@/components/ChatWorkspace";
import { KnowledgeView } from "@/components/KnowledgeView";
import { IntegrationView } from "@/components/IntegrationView";
import { SettingsView } from "@/components/SettingsView";
import { api } from "@/lib/api";

export default function WorkspacePage() {
  const [active, setActive] = useState("chats");
  const [chatId, setChatId] = useState<string | null>(null);

  async function handleNewChat() {
    try {
      const chat = await api.createChat("New Chat");
      setChatId(chat.id);
      setActive("chats");
    } catch {
      // Not authenticated yet — chat creation requires a logged-in user.
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar active={active} onSelect={setActive} onNewChat={handleNewChat} />

      <main className="flex flex-1 flex-col overflow-hidden">
        {active === "chats" && <ChatWorkspace chatId={chatId} />}
        {(active === "knowledge" || active === "documents") && <KnowledgeView />}
        {["github", "youtube", "websites", "leetcode"].includes(active) && (
          <IntegrationView view={active} />
        )}
        {active === "projects" && (
          <div className="flex h-full flex-1 items-center justify-center text-white/40">
            Projects — coming in the next iteration.
          </div>
        )}
        {active === "settings" && <SettingsView />}
      </main>
    </div>
  );
}
