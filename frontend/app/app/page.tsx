"use client";

import { useEffect, useState } from "react";
import { ChatWorkspace } from "@/components/ChatWorkspace";
import { LeftRail } from "@/components/LeftRail";
import { ChatHistoryDrawer } from "@/components/ChatHistoryDrawer";
import { LibraryPanel } from "@/components/LibraryPanel";
import { SettingsModal } from "@/components/SettingsModal";
import { api, clearToken, getStoredToken, setToken } from "@/lib/api";

export default function WorkspacePage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [chatId, setChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initializeSession() {
      setCheckingAuth(true);
      setSessionError(null);

      try {
        let profile: { id: string; email: string; full_name?: string | null } | null = null;
        if (getStoredToken()) {
          try {
            profile = await api.me();
          } catch {
            clearToken();
          }
        }

        if (!profile) {
          let sessionId = window.localStorage.getItem("ivision_guest_id");
          if (!sessionId) {
            sessionId = window.crypto.randomUUID();
            window.localStorage.setItem("ivision_guest_id", sessionId);
          }
          const guestSession = await api.createGuestSession(sessionId);
          setToken(guestSession.access_token);
          profile = await api.me();
        }

        if (cancelled) return;
        setUserName(profile.full_name || profile.email || "Guest");
        setCheckingAuth(false);
        api
          .getSettings()
          .then((settings) => {
            if (!cancelled) setVoiceEnabled(settings.voice_enabled);
          })
          .catch(() => {
            if (!cancelled) setVoiceEnabled(false);
          });
      } catch (error) {
        if (cancelled) return;
        setSessionError(error instanceof Error ? error.message : "Could not start a session.");
        setCheckingAuth(false);
      }
    }

    void initializeSession();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  async function ensureChat(): Promise<string> {
    const chat = await api.createChat("New Chat");
    setChatId(chat.id);
    return chat.id;
  }

  function handleNewChat() {
    setChatId(null);
    closeOverlays();
  }

  function closeOverlays() {
    setHistoryOpen(false);
    setLibraryOpen(false);
    setSettingsOpen(false);
  }

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-white/70">Could not connect to the workspace: {sessionError}</p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-background"
        >
          Retry
        </button>
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
            "radial-gradient(50% 40% at 50% 0%, rgba(0,235,225,0.06) 0%, rgba(2,3,4,0) 60%)"
        }}
      />

      <LeftRail
        historyOpen={historyOpen}
        onToggleHistory={() => {
          setHistoryOpen((v) => {
            const next = !v;
            if (next) {
              setLibraryOpen(false);
              setSettingsOpen(false);
            }
            return next;
          });
        }}
        libraryOpen={libraryOpen}
        onToggleLibrary={() => {
          setLibraryOpen((v) => {
            const next = !v;
            if (next) {
              setHistoryOpen(false);
              setSettingsOpen(false);
            }
            return next;
          });
        }}
        settingsOpen={settingsOpen}
        onToggleSettings={() => {
          setSettingsOpen((v) => {
            const next = !v;
            if (next) {
              setHistoryOpen(false);
              setLibraryOpen(false);
            }
            return next;
          });
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

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="relative flex h-full flex-col pl-20 pr-2 sm:pl-24">
        <ChatWorkspace
          chatId={chatId}
          ensureChat={ensureChat}
          userName={userName}
          voiceEnabled={voiceEnabled}
        />
      </main>
    </div>
  );
}