"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatWorkspace } from "@/components/ChatWorkspace";
import { LeftRail } from "@/components/LeftRail";
import { ChatHistoryDrawer } from "@/components/ChatHistoryDrawer";
import { LibraryPanel } from "@/components/LibraryPanel";
import { api, getStoredToken } from "@/lib/api";

export default function WorkspacePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/login");
      return;
    }
    // Verify the token is still valid against the backend, not just present.
    api
      .me()
      .then(() => setCheckingAuth(false))
      .catch(() => router.replace("/login"));
  }, [router]);

  async function ensureChat(): Promise<string> {
    const chat = await api.createChat("New Chat");
    setChatId(chat.id);
    return chat.id;
  }

  function handleNewChat() {
    setChatId(null);
    setHistoryOpen(false);
  }

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-emerald-300" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 0%, rgba(20,214,170,0.06) 0%, rgba(8,9,11,0) 60%)"
        }}
      />

      <LeftRail
        historyOpen={historyOpen}
        onToggleHistory={() => {
          setHistoryOpen((v) => !v);
          setLibraryOpen(false);
        }}
        libraryOpen={libraryOpen}
        onToggleLibrary={() => {
          setLibraryOpen((v) => !v);
          setHistoryOpen(false);
        }}
        onNewChat={handleNewChat}
      />

      <ChatHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        activeChatId={chatId}
        onSelectChat={(id) => setChatId(id || null)}
      />

      <LibraryPanel open={libraryOpen} onClose={() => setLibraryOpen(false)} />

      <main className="relative flex h-full flex-col pl-20 pr-2 sm:pl-24">
        <ChatWorkspace chatId={chatId} ensureChat={ensureChat} />
      </main>
    </div>
  );
}