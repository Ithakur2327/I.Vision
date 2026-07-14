"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileText, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type Source = {
  id: string;
  type: string;
  title: string;
  status: string;
};

export function KnowledgeView() {
  const [sources, setSources] = useState<Source[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    api
      .listKnowledge()
      .then(setSources)
      .catch(() => setSources([]));
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
    <div className="flex h-full flex-1 flex-col px-6 py-8 sm:px-12">
      <h1 className="text-2xl font-semibold text-white">Knowledge</h1>
      <p className="mt-1 text-sm text-white/50">
        Upload documents to make them instantly searchable in chat.
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
        className="glass-panel mt-6 flex flex-col items-center justify-center gap-2 rounded-2xl border-dashed py-12 text-white/60 transition-colors hover:bg-white/8"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        ) : (
          <UploadCloud className="h-6 w-6" />
        )}
        <span className="text-sm">
          {uploading ? "Processing..." : "Click to upload PDF, DOCX, PPTX, TXT, or Markdown"}
        </span>
      </button>

      {error && <p className="mt-3 text-xs text-ember">{error}</p>}

      <div className="mt-6 space-y-2">
        {sources.length === 0 && (
          <p className="text-sm text-white/35">No knowledge sources yet.</p>
        )}
        {sources.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-white/60" />
              <div>
                <p className="text-sm text-white/85">{s.title}</p>
                <p className="text-xs text-white/40">{s.status}</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(s.id)}
              className="text-white/40 hover:text-ember"
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
