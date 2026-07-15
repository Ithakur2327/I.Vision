"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { api, setToken } from "@/lib/api";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email aur password dono zaroori hain.");
      return;
    }
    if (isSignup && !fullName.trim()) {
      setError("Naam daalna zaroori hai.");
      return;
    }
    if (password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }

    setLoading(true);
    try {
      const res = isSignup
        ? await api.register(email.trim(), password, fullName.trim())
        : await api.login(email.trim(), password);
      if (!res?.access_token) {
        throw new Error("Response me token nahi mila.");
      }
      setToken(res.access_token);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kuch galat ho gaya.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center px-4 py-10 sm:px-6">
      {/* ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(19,209,161,0.10) 0%, rgba(8,9,11,0) 60%)"
        }}
      />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-[380px] sm:max-w-[420px]"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0c0e10]/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
          {/* teal glow top-left, matches reference */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(20,214,170,0.55), rgba(20,214,170,0) 70%)"
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(20,214,170,0.25), rgba(20,214,170,0) 70%)"
            }}
          />

          <div className="relative px-6 py-10 sm:px-9 sm:py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: isSignup ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isSignup ? -16 : 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h1 className="text-center font-display text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
                  {isSignup ? "Create account" : "Welcome back"}
                </h1>
                <p className="mt-2 text-center text-sm text-muted">
                  {isSignup
                    ? "Set up your i.vision workspace"
                    : "Sign in to your account"}
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-3">
                  {isSignup && (
                    <FieldRow
                      label="Name"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={setFullName}
                      autoComplete="name"
                    />
                  )}

                  <FieldRow
                    label="Email"
                    type="email"
                    placeholder="username@gmail.com"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />

                  <FieldRow
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    trailing={
                      <button
                        type="submit"
                        disabled={loading}
                        aria-label={isSignup ? "Sign up" : "Sign in"}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-500 text-black transition-transform active:scale-95 disabled:opacity-60"
                      >
                        {loading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ArrowRight size={16} />
                        )}
                      </button>
                    }
                  />

                  {error && (
                    <p className="pt-1 text-center text-[13px] text-red-400">
                      {error}
                    </p>
                  )}
                </form>

                <div className="my-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[11px] tracking-wide text-muted">OR</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => setGoogleNotice(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/90 transition-colors hover:bg-white/[0.07]"
                >
                  <span className="flex items-center gap-3">
                    <GoogleGlyph />
                    Continue with Google
                  </span>
                  <ArrowRight size={16} className="text-muted" />
                </button>

                {googleNotice && (
                  <p className="mt-3 text-center text-[12px] text-muted">
                    Google sign-in backend abhi connect nahi hua — email/password se continue karein.
                  </p>
                )}

                <p className="mt-7 text-center text-[13px] text-muted">
                  {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(isSignup ? "login" : "signup");
                      setError(null);
                    }}
                    className="font-medium text-emerald-300 hover:text-emerald-200"
                  >
                    {isSignup ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

function FieldRow({
  label,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  trailing
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 focus-within:border-emerald-400/40 transition-colors">
      <div className="min-w-0 flex-1">
        <label className="block text-[11px] font-medium text-muted">{label}</label>
        <input
          type={type}
          required
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none"
        />
      </div>
      {trailing}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.8 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.9 39.7 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.6 5.6C41.6 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
