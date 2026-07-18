"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff, User, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { api, setToken } from "@/lib/api";
import { Logo } from "@/components/Logo";

type Mode = "login" | "signup";

const ACCENT = "#21F1A8";
const ACCENT_DIM = "#19D998";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialNotice, setSocialNotice] = useState(false);

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

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setError(null);
    setSocialNotice(false);
  }

  return (
    <main className="relative flex min-h-screen w-full items-stretch overflow-hidden">
      {/* full-bleed background image */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/backgrounds/mesh-network.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      {/* darken + brand-tint overlay so text/card stay legible over the image */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(3,5,6,0.55) 0%, rgba(3,5,6,0.72) 45%, rgba(3,5,6,0.88) 100%)"
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] top-1/2 h-[900px] w-[900px] -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(closest-side, ${ACCENT}18, transparent 70%)`,
          filter: "blur(280px)"
        }}
      />

      {/* LEFT — about the assistant */}
      <div className="relative z-10 hidden w-1/2 flex-col justify-center px-14 lg:flex xl:px-20">
        <span
          className="mb-5 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[12px]"
          style={{
            color: ACCENT,
            background: "rgba(33,241,168,0.08)",
            border: "1px solid rgba(33,241,168,0.25)"
          }}
        >
          <Sparkles size={13} />
          Your personal AI assistant
        </span>
        <h1
          className="max-w-[520px] text-white"
          style={{ fontWeight: 700, fontSize: 46, lineHeight: 1.08, letterSpacing: "-0.02em" }}
        >
          Meet <span style={{ color: ACCENT }}>i.vision</span> — the assistant that thinks alongside you
        </h1>
        <p
          className="mt-5 max-w-[460px]"
          style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}
        >
          Ek AI assistant jo aapke kaam, sawaal aur ideas ko samajhta hai — turant jawab,
          smart research aur seamless workflow, sab ek hi jagah.
        </p>

        <div className="mt-9 flex flex-col gap-4">
          <FeaturePoint icon={<Zap size={16} />} title="Instant, context-aware answers" />
          <FeaturePoint icon={<ShieldCheck size={16} />} title="Private and secure by default" />
          <FeaturePoint icon={<Sparkles size={16} />} title="Built for real, everyday work" />
        </div>
      </div>

      {/* RIGHT — the glass login/signup card */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-6 lg:w-1/2">
        <div className="relative flex flex-col items-center">
        {/* small circular glass logo, floating 40px above the card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 mb-[18px] flex items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1.2px solid rgba(255,255,255,0.14)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.4)"
          }}
        >
          <Logo size={30} />
        </motion.div>

        {/* the floating glass card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          className="relative w-[90vw] max-w-[400px] overflow-hidden"
          style={{
            maxHeight: "calc(100vh - 110px)",
            borderRadius: 28,
            background: "rgba(255,255,255,0.045)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1.2px solid rgba(255,255,255,0.14)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)"
          }}
        >
          {/* top-left glossy fresnel reflection */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full"
            style={{
              background: "radial-gradient(closest-side, rgba(255,255,255,0.10), transparent 70%)",
              filter: "blur(30px)"
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[36px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 30%, transparent 100%)"
            }}
          />

          <div className="relative flex h-full flex-col overflow-y-auto px-6 py-6 sm:px-7 sm:py-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: isSignup ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isSignup ? -16 : 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h1
                  className="text-center"
                  style={{ fontFamily: "var(--font-display, inherit)", fontWeight: 700, fontSize: 26, color: "#ffffff", letterSpacing: "-0.02em" }}
                >
                  {isSignup ? (
                    <>
                      Create <span style={{ color: ACCENT }}>Account</span>
                    </>
                  ) : (
                    <>
                      Welcome <span style={{ color: ACCENT }}>Back</span>
                    </>
                  )}
                </h1>
                <p
                  className="mx-auto mt-1.5 max-w-[320px] text-center"
                  style={{ fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,0.55)" }}
                >
                  {isSignup ? "Start your journey with us" : "Sign in to continue your journey"}
                </p>

                {/* social button — circular glass, Google only */}
                <div className="mt-4 flex items-center justify-center">
                  <SocialButton label="Continue with Google" onClick={() => setSocialNotice(true)}>
                    <GoogleGlyph />
                  </SocialButton>
                </div>

                {socialNotice && (
                  <p className="mt-2 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Social sign-in backend abhi connect nahi hua — email/password se continue karein.
                  </p>
                )}

                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    OR
                  </span>
                  <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {isSignup && (
                    <FieldRow
                      icon={<User size={18} />}
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={setFullName}
                      autoComplete="name"
                    />
                  )}

                  <FieldRow
                    icon={<Mail size={18} />}
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />

                  <FieldRow
                    icon={<Lock size={18} />}
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        style={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />

                  {!isSignup && (
                    <div className="flex justify-end">
                      <LinkText onClick={() => {}}>Forgot Password?</LinkText>
                    </div>
                  )}

                  {error && (
                    <p className="text-center text-[12px] text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-1 flex w-full items-center justify-center gap-2 transition-all duration-300 hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
                    style={{
                      height: 50,
                      borderRadius: 999,
                      background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT_DIM})`,
                      boxShadow: `0 14px 40px rgba(33,241,168,0.22)`,
                      color: "#04140f",
                      fontWeight: 600,
                      fontSize: 15
                    }}
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {isSignup ? "Sign Up" : "Login"}
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                  <LinkText onClick={switchMode}>{isSignup ? "Login" : "Sign Up"}</LinkText>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <div
          className="relative mt-3 flex items-center gap-2 text-[12px]"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <ShieldCheck size={14} />
          Your data is secure with us
        </div>
        </div>
      </div>
    </main>
  );
}

function FeaturePoint({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ color: ACCENT, background: "rgba(33,241,168,0.10)", border: "1px solid rgba(33,241,168,0.2)" }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{title}</span>
    </div>
  );
}

function SocialButton({
  children,
  label,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex items-center justify-center rounded-full transition-all duration-300 hover:brightness-110"
      style={{
        width: 46,
        height: 46,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 24px rgba(33,241,168,0.25)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {children}
    </button>
  );
}

function FieldRow({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  trailing
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-2.5 px-4 transition-colors"
      style={{
        height: 46,
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? ACCENT : "rgba(255,255,255,0.09)"}`
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.6)" }} className="shrink-0">
        {icon}
      </span>
      <input
        type={type}
        required
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[15px] text-white outline-none"
        style={{ caretColor: ACCENT }}
      />
      {trailing}
    </div>
  );
}

function LinkText({
  children,
  onClick
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium underline-offset-4 hover:underline"
      style={{ color: ACCENT }}
    >
      {children}
    </button>
  );
}



function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
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