"use client";

import { useEffect } from "react";
import { RefreshCw, Home } from "lucide-react";

export default function WorkspaceError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="text-sm font-medium text-white/85">Something went wrong</p>
        <p className="mt-1.5 text-xs text-white/45">
          The workspace hit an unexpected error. You can try again, or head back home.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-medium text-background"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
          <a
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/5"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </a>
        </div>
      </div>
    </div>
  );
}