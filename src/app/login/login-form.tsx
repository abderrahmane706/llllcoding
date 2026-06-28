"use client";

import { useState, useEffect, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function LoginForm() {
  const [mode, setMode]         = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState<{ text: string; ok: boolean } | null>(null);
  const router                  = useRouter();
  const supabase                = createClient();

  // Clear message when switching modes
  useEffect(() => { setMessage(null); }, [mode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ text: error.message, ok: false });
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setMessage({ text: error.message, ok: false });
      } else {
        setMessage({ text: "Check your email to confirm your account, Hunter.", ok: true });
      }
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      setMessage({ text: error.message, ok: false });
      setLoading(false);
    }
    // On success, Supabase redirects the browser — no cleanup needed
  }

  return (
    <div
      className="w-full max-w-md rounded-2xl p-8 space-y-7"
      style={{
        background: "rgba(2, 6, 23, 0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(0,229,255,0.12)",
        boxShadow: "0 0 60px rgba(0,229,255,0.06), 0 4px 40px rgba(0,0,0,0.6)",
      }}
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-orbitron">
          Shinka System
        </p>
        <h1
          className="text-3xl font-black font-orbitron uppercase tracking-widest"
          style={{ color: "#00e5ff", textShadow: "0 0 30px rgba(0,229,255,0.6)" }}
        >
          System Access
        </h1>
        <p className="text-xs text-gray-600">
          {mode === "login" ? "Authenticate to continue your evolution." : "Initialize your Hunter profile."}
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="grid grid-cols-2 rounded-lg p-1"
        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,229,255,0.08)" }}
      >
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="py-2 rounded-md text-xs font-bold font-orbitron uppercase tracking-widest transition-all duration-300"
            style={
              mode === m
                ? {
                    background: "rgba(0,229,255,0.12)",
                    color: "#00e5ff",
                    boxShadow: "0 0 15px rgba(0,229,255,0.2)",
                    textShadow: "0 0 8px rgba(0,229,255,0.8)",
                  }
                : { color: "#4b5563" }
            }
          >
            {m === "login" ? "Log In" : "Initialize"}
          </button>
        ))}
      </div>

      {/* Email / Password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          id="email"
          type="email"
          label="Hunter Email"
          value={email}
          onChange={setEmail}
          placeholder="hunter@system.local"
          required
        />
        <InputField
          id="password"
          type="password"
          label="Access Code"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
          minLength={6}
        />

        {message && (
          <p
            className="text-xs text-center py-2 px-3 rounded-lg border"
            style={{
              color: message.ok ? "#00ff88" : "#ff4444",
              borderColor: message.ok ? "rgba(0,255,136,0.2)" : "rgba(255,68,68,0.2)",
              background: message.ok ? "rgba(0,255,136,0.05)" : "rgba(255,68,68,0.05)",
            }}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-black font-orbitron uppercase tracking-widest text-sm transition-all duration-300 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(157,0,255,0.15))",
            border: "1px solid rgba(0,229,255,0.3)",
            color: "#00e5ff",
            boxShadow: "0 0 20px rgba(0,229,255,0.1)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 35px rgba(0,229,255,0.35)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,229,255,0.1)";
          }}
        >
          {loading ? "Processing…" : mode === "login" ? "Access System" : "Initialize Hunter"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(0,229,255,0.1)" }} />
        <span className="text-[10px] text-gray-700 uppercase tracking-widest font-orbitron">
          or
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(0,229,255,0.1)" }} />
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#d1d5db",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
        }}
      >
        {/* Google SVG logo */}
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </div>
  );
}

// ── Reusable input field ───────────────────────────────────────────────────────
function InputField({
  id, type, label, value, onChange, placeholder, required, minLength,
}: {
  id: string; type: string; label: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  required?: boolean; minLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-orbitron">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full bg-black/40 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all duration-300"
        style={{
          border: `1px solid ${focused ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.07)"}`,
          boxShadow: focused ? "0 0 20px rgba(0,229,255,0.15), inset 0 0 10px rgba(0,229,255,0.05)" : "none",
        }}
      />
    </div>
  );
}
