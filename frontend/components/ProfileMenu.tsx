"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { api, clearToken } from "@/lib/api";

export function ProfileMenu({
  variant = "floating"
}: {
  /** "floating": original fixed top-right badge. "rail": sits inline at the
   * bottom of the sidebar and pops its menu upward/to the side instead. */
  variant?: "floating" | "rail";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ email: string; full_name?: string | null } | null>(
    null
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.me().then(setProfile).catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  const initial = (profile?.full_name || profile?.email || "?").charAt(0).toUpperCase();

  const isRail = variant === "rail";

  return (
    <div
      ref={ref}
      className={isRail ? "relative flex items-center justify-center" : "fixed right-4 top-4 z-40"}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-emerald-400/30 to-teal-600/30 text-sm font-medium text-emerald-200 backdrop-blur-xl transition-transform hover:scale-105"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: isRail ? 8 : -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isRail ? 8 : -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={
              isRail
                ? "absolute bottom-0 left-full ml-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e10]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
                : "absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e10]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
            }
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm text-white/90">
                {profile?.full_name || "Your account"}
              </p>
              <p className="truncate text-xs text-white/40">
                {profile?.email || "—"}
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}