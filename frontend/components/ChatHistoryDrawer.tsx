"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

type Chat = {
  id: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
};

export function ChatHistoryDrawer({
  open,
  onClose,
  activeChatId,
  onSelectChat
}: {
  open: boolean;
  onClose: () => void;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
}) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api
      .listChats()
      .then(setChats)
      .catch((e) => setError(e.message || "Could not load chats"));
  }, [open]);

  useEffect(() => {
    if (!open) setConfirmingId(null);
  }, [open]);

  async function handleDelete(chatId: string) {
    setDeletingId(chatId);
    try {
      await api.deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) onSelectChat("");
    } catch (e) {
      // silently keep the row if delete failed; user can retry
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          />
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed left-[84px] top-4 bottom-4 z-40 w-[280px] rounded-3xl border border-white/10 bg-[#0b0c0e]/95 p-4 shadow-2xl backdrop-blur-2xl sm:left-[100px]"
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 className="text-sm font-medium text-white/85">Chats</h2>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
              {error && <p className="px-2 text-xs text-ember">{error}</p>}
              {!error && chats.length === 0 && (
                <p className="px-2 text-xs text-white/35">No chats yet.</p>
              )}
              {chats.map((c) => {
                const isConfirming = confirmingId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      activeChatId === c.id
                        ? "bg-white/10 text-white"
                        : "text-white/65 hover:bg-white/5 hover:text-white/90"
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectChat(c.id);
                        onClose();
                      }}
                      className="flex flex-1 items-center gap-2.5 overflow-hidden text-left"
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="truncate">{c.title || "Untitled chat"}</span>
                    </button>

                    {isConfirming ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="rounded-md bg-red-500/20 px-2 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                        >
                          {deletingId === c.id ? "…" : "Delete"}
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="rounded-md px-2 py-1 text-[11px] text-white/50 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(c.id)}
                        aria-label="Delete chat"
                        className="shrink-0 rounded-lg p-1.5 text-white/0 transition-colors hover:bg-red-500/15 hover:text-red-300 group-hover:text-white/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}