"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
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

  useEffect(() => {
    if (!open) return;
    api
      .listChats()
      .then(setChats)
      .catch((e) => setError(e.message || "Could not load chats"));
  }, [open]);

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
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectChat(c.id);
                    onClose();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    activeChatId === c.id
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white/90"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/40" />
                  <span className="truncate">{c.title}</span>
                </button>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}