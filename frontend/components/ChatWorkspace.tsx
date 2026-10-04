"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowUp, Copy, RefreshCw, Square, Mic, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { api, type StreamDone } from "@/lib/api";
import { Orb3D } from "@/components/Orb3D";

type Citation = { source_title: string; chunk_text: string; score: number };
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

/** Memoized so that a token arriving for the actively-streaming message
 * doesn't re-render every other bubble in a long conversation — only the
 * bubble whose `message` prop actually changed re-renders. Depends on
 * onCopy/onRegenerate having stable identity (see useCallback below). */
const MessageBubble = memo(function MessageBubble({
  message,
  isStreamingThis,
  isCopied,
  streamingActive,
  onCopy,
  onRegenerate
}: {
  message: ChatMessage;
  isStreamingThis: boolean;
  isCopied: boolean;
  streamingActive: boolean;
  onCopy: (m: ChatMessage) => void;
  onRegenerate: (id: string) => void;
}) {
  const isThinking = isStreamingThis && message.content.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto flex max-w-4xl gap-3 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          message.role === "user" ? "bg-white/10 text-white" : "glass-panel text-white/90"
        }`}
      >
        {message.role === "user" ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : isThinking ? (
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:0.2s]" />
          </div>
        ) : (
          <div className="md-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </ReactMarkdown>
            {isStreamingThis && <span className="stream-cursor" />}
          </div>
        )}

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-white/10 pt-2">
            {message.citations.map((c, i) => (
              <div key={i} className="text-xs text-white/45">
                [{i + 1}] {c.source_title}
              </div>
            ))}
          </div>
        )}

        {message.role === "assistant" && !isStreamingThis && (
          <div className="mt-2 flex gap-2 text-white/40">
            <button className="hover:text-white/80" onClick={() => onCopy(message)} aria-label="Copy">
              {isCopied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              className="hover:text-white/80 disabled:opacity-30"
              onClick={() => onRegenerate(message.id)}
              disabled={streamingActive}
              aria-label="Regenerate"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export function ChatWorkspace({
  chatId,
  ensureChat,
  userName,
  voiceEnabled = false
}: {
  chatId: string | null;
  ensureChat: () => Promise<string>;
  userName?: string | null;
  voiceEnabled?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const active = messages.length > 0 || !!chatId;
  const orbState = streamingId
    ? "responding"
    : listening
    ? "listening"
    : focused && input.trim().length > 0
    ? "typing"
    : "idle";

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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // auto-grow the textarea as the user types, like ChatGPT's composer
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      abortRef.current?.abort();
    };
  }, []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice input isn't supported in this browser — try Chrome or Edge.");
      return;
    }
    setVoiceError(null);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setVoiceError("Microphone access was denied.");
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  /** Drives both "send" and "regenerate": streams tokens into the message
   * identified by `targetId`, then reconciles its id/citations once the
   * backend's completion event arrives. A null result means the user hit
   * stop — the partially-streamed text simply stays as-is.
   *
   * Incoming tokens are buffered and flushed at most once per animation
   * frame instead of on every single token — Groq can produce hundreds of
   * tokens/sec, and updating React state that often causes visible jank
   * for no visual benefit beyond ~60fps. */
  async function runStream(
    streamFn: (onChunk: (t: string) => void, signal: AbortSignal) => Promise<StreamDone | null>,
    targetId: string
  ) {
    setStreamingId(targetId);
    const controller = new AbortController();
    abortRef.current = controller;

    let buffer = "";
    let rafId: number | null = null;

    const flushNow = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (!buffer) return;
      const toAppend = buffer;
      buffer = "";
      setMessages((prev) =>
        prev.map((m) => (m.id === targetId ? { ...m, content: m.content + toAppend } : m))
      );
    };

    const onChunk = (chunk: string) => {
      buffer += chunk;
      if (rafId === null) rafId = requestAnimationFrame(flushNow);
    };

    try {
      const result = await streamFn(onChunk, controller.signal);
      flushNow(); // apply any trailing buffered text before reconciling id/citations

      if (result) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === targetId ? { ...m, id: result.id, citations: result.citations } : m
          )
        );
      }
    } catch (e: any) {
      flushNow();
      setError(e.message || "Something went wrong. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== targetId));
    } finally {
      setStreamingId(null);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  const handleRegenerate = useCallback(
    async (assistantMsgId: string) => {
      if (!chatId || streamingId) return;
      setError(null);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, content: "", citations: [] } : m))
      );
      await runStream(
        (onChunk, signal) => api.regenerateStream(chatId, assistantMsgId, onChunk, signal),
        assistantMsgId
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatId, streamingId]
  );

  const handleCopy = useCallback((msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId((c) => (c === msg.id ? null : c)), 1500);
  }, []);

  async function handleSend() {
    if (!input.trim() || streamingId) return;
    if (listening) recognitionRef.current?.stop();

    const content = input.trim();
    setInput("");
    setError(null);

    let id: string;
    try {
      id = chatId ?? (await ensureChat());
    } catch (e: any) {
      setError(e.message || "Couldn't start a new chat. Please try again.");
      return;
    }

    const userMsgId = `temp-user-${Date.now()}`;
    const placeholderId = `temp-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content },
      { id: placeholderId, role: "assistant", content: "", citations: [] }
    ]);

    await runStream((onChunk, signal) => api.sendMessageStream(id, content, onChunk, signal), placeholderId);
  }

  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <LayoutGroup>
      <div className="space-bg relative flex h-full flex-1 flex-col overflow-hidden rounded-[32px] border border-white/[0.06]">
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
            <Orb3D size={active ? 56 : 240} state={orbState} />
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
                Hey! <span className="text-accent">{firstName || "there"}</span>
              </h1>
              <p className="mt-2 max-w-md text-sm text-white/50">
                What can I <span className="text-accent">analyze</span> for you today?
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {active && (
          <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-8 no-scrollbar sm:px-14">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isStreamingThis={m.id === streamingId}
                  isCopied={copiedId === m.id}
                  streamingActive={!!streamingId}
                  onCopy={handleCopy}
                  onRegenerate={handleRegenerate}
                />
              ))}
            </AnimatePresence>

            {error && <p className="mx-auto max-w-4xl text-center text-xs text-ember">{error}</p>}
          </div>
        )}

        <motion.div layout className="px-6 pb-8 sm:px-14">
          <div className="glass-panel mx-auto flex max-w-4xl items-end gap-2 rounded-2xl p-2">
            {voiceEnabled && (
              <button
                type="button"
                onClick={toggleListening}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                title={listening ? "Stop voice input" : "Start voice input"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  listening
                    ? "animate-pulse bg-accent/20 text-accent"
                    : "text-white/50 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            <textarea
              ref={textareaRef}
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
              placeholder="Ask me anything..."
              rows={1}
              className="max-h-[200px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            {streamingId ? (
              <button
                onClick={handleStop}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25"
                aria-label="Stop generating"
                title="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-background transition-opacity disabled:opacity-30"
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
          {voiceError && <p className="mt-3 text-center text-xs text-white/40">{voiceError}</p>}
          {!active && error && <p className="mt-3 text-center text-xs text-ember">{error}</p>}
        </motion.div>
      </div>
    </LayoutGroup>
  );
}