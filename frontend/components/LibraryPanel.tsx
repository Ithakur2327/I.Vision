"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  UploadCloud,
  FileText,
  Github,
  Youtube,
  Globe,
  Code2,
  Trash2,
  Loader2,
  Plus
} from "lucide-react";
import { api } from "@/lib/api";

type Doc = { id: string; type: string; title: string; status: string };
type LinkItem = { id: string; status: string; url?: string; username?: string };

const SECTIONS = [
  { key: "documents", label: "Documents", icon: FileText },
  { key: "github", label: "GitHub", icon: Github },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "websites", label: "Websites", icon: Globe },
  { key: "leetcode", label: "LeetCode", icon: Code2 }
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export function LibraryPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [section, setSection] = useState<SectionKey>("documents");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-3 top-6 bottom-6 z-50 mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c0e]/95 shadow-2xl backdrop-blur-2xl sm:inset-x-8 md:inset-x-16"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-lg font-semibold text-white">Library</h2>
                <p className="text-xs text-white/40">
                  Everything i.vision is allowed to answer from.
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close library"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-[calc(100%-65px)] flex-col sm:flex-row">
              <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 p-2 no-scrollbar sm:w-48 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3">
                {SECTIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSection(key)}
                    className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                      section === key
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "text-white/60 hover:bg-white/5 hover:text-white/90"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                {section === "documents" && <DocumentsSection />}
                {section === "github" && (
                  <LinkSection
                    title="GitHub repositories"
                    placeholder="https://github.com/user/repo"
                    fetchList={api.listGithub}
                    add={api.addGithub}
                    icon={Github}
                  />
                )}
                {section === "youtube" && (
                  <LinkSection
                    title="YouTube links"
                    placeholder="https://youtube.com/watch?v=..."
                    fetchList={api.listYoutube}
                    add={api.addYoutube}
                    icon={Youtube}
                  />
                )}
                {section === "websites" && (
                  <LinkSection
                    title="Website links"
                    placeholder="https://example.com/article"
                    fetchList={api.listWebsite}
                    add={api.addWebsite}
                    icon={Globe}
                  />
                )}
                {section === "leetcode" && (
                  <LinkSection
                    title="LeetCode profiles"
                    placeholder="leetcode-username"
                    fetchList={api.listLeetcode}
                    add={api.addLeetcode}
                    icon={Code2}
                    usernameMode
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DocumentsSection() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    api.listKnowledge().then(setDocs).catch(() => setDocs([]));
  }
  useEffect(refresh, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      await api.uploadDocument(file);
      refresh();
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await api.deleteKnowledge(id);
    refresh();
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-white/85">Documents</h3>
      <p className="mt-1 text-xs text-white/40">
        PDF, DOCX, PPTX, TXT, or Markdown — chunked, embedded, and searchable
        the moment processing finishes.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.pptx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-8 text-white/60 transition-colors hover:bg-white/[0.06]"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
        ) : (
          <UploadCloud className="h-5 w-5" />
        )}
        <span className="text-xs">
          {uploading ? "Processing..." : "Click to upload a file"}
        </span>
      </button>

      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      <div className="mt-4 space-y-2">
        {docs.length === 0 && (
          <p className="text-xs text-white/35">No documents yet.</p>
        )}
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-4 w-4 shrink-0 text-white/50" />
              <div className="min-w-0">
                <p className="truncate text-sm text-white/85">{d.title}</p>
                <p className="text-xs text-white/40">{d.status}</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(d.id)}
              className="shrink-0 text-white/40 hover:text-ember"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkSection({
  title,
  placeholder,
  fetchList,
  add,
  icon: Icon,
  usernameMode
}: {
  title: string;
  placeholder: string;
  fetchList: () => Promise<LinkItem[]>;
  add: (value: string) => Promise<any>;
  icon: React.ComponentType<{ className?: string }>;
  usernameMode?: boolean;
}) {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function refresh() {
    fetchList().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);

  async function handleAdd() {
    if (!value.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await add(value.trim());
      setValue("");
      setNotice(res?.note || null);
      refresh();
    } catch (e: any) {
      setError(e.message || "Could not add");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-white/85">{title}</h3>
      <p className="mt-1 text-xs text-white/40">
        Stored against your account. Indexing for this source type needs a
        backend credential — see note below once added.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/40"
        />
        <button
          onClick={handleAdd}
          disabled={submitting || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 disabled:opacity-40"
          aria-label="Add"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-ember">{error}</p>}
      {notice && <p className="mt-2 text-xs text-white/35">{notice}</p>}

      <div className="mt-4 space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-white/35">Nothing added yet.</p>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-white/50" />
              <p className="truncate text-sm text-white/85">
                {usernameMode ? it.username : it.url}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/45">
              {it.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
