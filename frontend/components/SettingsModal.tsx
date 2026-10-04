"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mic, Cpu, LogOut, Loader2 } from "lucide-react";
import { api, clearToken } from "@/lib/api";

type Profile = { email: string; full_name?: string | null };
type Settings = { theme: string; ai_model: string; voice_enabled: boolean };

const MODEL_LABELS: Record<string, string> = {
  "llama-3.3-70b-versatile": "Llama 3.3 70B (via Groq)"
};

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    api.me().then(setProfile).catch(() => setProfile(null));
    api.getSettings().then(setSettings).catch(() => setError("Could not load settings"));
  }, [open]);

  async function toggleVoice() {
    if (!settings || saving) return;
    const next = !settings.voice_enabled;
    setSettings({ ...settings, voice_enabled: next }); // optimistic
    setSaving(true);
    try {
      const updated = await api.updateSettings({ voice_enabled: next });
      setSettings(updated);
    } catch {
      setSettings(settings); // revert
      setError("Could not save — please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearToken();
    window.location.assign("/");
  }

  const initial = (profile?.full_name || profile?.email || "?").charAt(0).toUpperCase();

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
            className="fixed inset-x-3 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c0e]/95 shadow-2xl backdrop-blur-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* account */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-accent/30 to-teal-700/30 text-sm font-medium text-accent">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-white/90">
                    {profile?.full_name || "Your account"}
                  </p>
                  <p className="truncate text-xs text-white/40">{profile?.email || "—"}</p>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              {/* preferences */}
              {!settings ? (
                <div className="flex items-center justify-center py-4 text-white/40">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Mic className="h-4 w-4 text-white/50" />
                      <div>
                        <p className="text-sm text-white/85">Voice input</p>
                        <p className="text-xs text-white/40">
                          Show the mic button in chat to talk instead of type.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleVoice}
                      role="switch"
                      aria-checked={settings.voice_enabled}
                      aria-label="Toggle voice input"
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        settings.voice_enabled ? "bg-accent" : "bg-white/15"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          settings.voice_enabled ? "translate-x-[22px]" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <Cpu className="h-4 w-4 shrink-0 text-white/50" />
                    <div className="min-w-0">
                      <p className="text-sm text-white/85">Model</p>
                      <p className="truncate text-xs text-white/40">
                        {MODEL_LABELS[settings.ai_model] || settings.ai_model}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-ember">{error}</p>}

              {!profile?.email.startsWith("guest-") && (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}