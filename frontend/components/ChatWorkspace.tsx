"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Copy, RefreshCw, Square } from "lucide-react";
import { api } from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { source_title: string; chunk_text: string; score: number }[];
};

export function ChatWorkspace({ chatId }: { chatId: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  async function handleSend() {
    if (!input.trim() || !chatId || loading) return;
    const content = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, role: "user", content }
    ]);
    setLoading(true);
    try {
      const reply = await api.sendMessage(chatId, content);
      setMessages((prev) => [...prev, reply]);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!chatId) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center px-8 text-center">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Your <span className="text-accent">AI</span> second brain.
        </h1>
        <p className="mt-3 max-w-md text-sm text-white/50">
          Start a new chat, or upload knowledge first so i.vision has
          something to reason over.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto px-6 py-8 no-scrollbar sm:px-12"
      >
        {messages.length === 0 && (
          <div className="mx-auto max-w-lg pt-16 text-center">
            <h2 className="text-2xl font-semibold text-white">
              Ask me anything about your knowledge.
            </h2>
            <p className="mt-2 text-sm text-white/50">
              I&apos;ll search your documents, code, and notes before I
              answer.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mx-auto flex max-w-2xl gap-3 ${
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
                    <button className="hover:text-white/80" aria-label="Regenerate">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="mx-auto max-w-2xl">
            <div className="glass-panel inline-flex items-center gap-1.5 rounded-2xl px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:0.2s]" />
            </div>
          </div>
        )}

        {error && (
          <p className="mx-auto max-w-2xl text-center text-xs text-ember">
            {error}
          </p>
        )}
      </div>

      <div className="px-6 pb-6 sm:px-12">
        <div className="glass-panel mx-auto flex max-w-2xl items-end gap-2 rounded-2xl p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
              <Square className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
