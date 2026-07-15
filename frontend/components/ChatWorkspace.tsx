"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowUp, Copy, RefreshCw, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Orb } from "@/components/Orb";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { source_title: string; chunk_text: string; score: number }[];
};

export function ChatWorkspace({
  chatId,
  ensureChat
}: {
  chatId: string | null;
  ensureChat: () => Promise<string>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = messages.length > 0 || !!chatId;
  const pulsing = loading || (focused && input.trim().length > 0);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    api
      .getMessages(chatId)
      .then((data) => setMessages(data))
      .catch(() => setMessages([]));
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  async function handleRegenerate(assistantMsgId: string) {
    if (!chatId || loading) return;
    const idx = messages.findIndex((m) => m.id === assistantMsgId);
    if (idx <= 0) return;
    const priorUser = [...messages.slice(0, idx)].reverse().find((m) => m.role === "user");
    if (!priorUser) return;

    setError(null);
    setLoading(true);
    try {
      const reply = await api.sendMessage(chatId, priorUser.content);
      setMessages((prev) => [...prev.slice(0, idx), reply]);
    } catch (e: any) {
      setError(e.message || "Regenerate failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const id = chatId ?? (await ensureChat());
      setMessages((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, role: "user", content }
      ]);
      const reply = await api.sendMessage(id, content);
      setMessages((prev) => [...prev, reply]);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LayoutGroup>
      <div className="space-bg relative flex h-full flex-1 flex-col overflow-hidden rounded-[32px] border border-white/[0.06]">
        {/* orb — docks from a big centered hero into a small pinned top-right badge once the chat is active */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className={
            active
              ? "absolute right-4 top-4 z-30 sm:right-6 sm:top-6"
              : "flex flex-1 items-center justify-center"
          }
        >
          <motion.div layout transition={{ type: "spring", stiffness: 220, damping: 24 }}>
            <Orb size={active ? 56 : 240} pulse={pulsing} />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {!active && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center px-6 pb-10 text-center"
            >
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                Your <span className="text-accent">AI</span> second brain.
              </h1>
              <p className="mt-2 max-w-md text-sm text-white/50">
                Ask anything — I&apos;ll answer only from what&apos;s in your Library.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {active && (
          <div
            ref={scrollRef}
            className="flex-1 space-y-6 overflow-y-auto px-6 py-8 no-scrollbar sm:px-14"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mx-auto flex max-w-4xl gap-3 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-white/10 text-white"
                        : "glass-panel text-white/90"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-white/10 pt-2">
                        {m.citations.map((c, i) => (
                          <div key={i} className="text-xs text-white/45">
                            [{i + 1}] {c.source_title}
                          </div>
                        ))}
                      </div>
                    )}

                    {m.role === "assistant" && (
                      <div className="mt-2 flex gap-2 text-white/40">
                        <button
                          className="hover:text-white/80"
                          onClick={() => navigator.clipboard.writeText(m.content)}
                          aria-label="Copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="hover:text-white/80 disabled:opacity-30"
                          onClick={() => handleRegenerate(m.id)}
                          disabled={loading}
                          aria-label="Regenerate"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="mx-auto max-w-4xl">
                <div className="glass-panel inline-flex items-center gap-1.5 rounded-2xl px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:0.2s]" />
                </div>
              </div>
            )}

            {error && (
              <p className="mx-auto max-w-4xl text-center text-xs text-ember">
                {error}
              </p>
            )}
          </div>
        )}

        <motion.div layout className="px-6 pb-8 sm:px-14">
          <div className="glass-panel mx-auto flex max-w-4xl items-end gap-2 rounded-2xl p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask i.vision anything..."
              rows={1}
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-background transition-opacity disabled:opacity-30"
              aria-label="Send"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
          {!active && error && (
            <p className="mt-3 text-center text-xs text-ember">{error}</p>
          )}
        </motion.div>
      </div>
    </LayoutGroup>
  );
}