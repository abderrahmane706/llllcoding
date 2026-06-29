"use client";

import { useState, useRef, useTransition, type ChangeEvent } from "react";
import { updateProfile, uploadAvatar } from "./actions";

type User = {
  id: string; name: string | null; bio: string | null;
  avatarUrl: string | null; email: string; level: number; rank: string;
};

// ── Rank colour map ───────────────────────────────────────────────────────────
const RANK_COLORS: Record<string, string> = {
  F: "#6b7280", E: "#60a5fa", D: "#34d399", C: "#fbbf24",
  B: "#f97316", A: "#ef4444", S: "#a78bfa", SS: "#c084fc", SSS: "#e879f9",
};

// ── Toast component ───────────────────────────────────────────────────────────
function Toast({ message, ok }: { message: string; ok: boolean }) {
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl flex items-center gap-2 animate-fade-in-up"
      style={{
        background: ok ? "rgba(0,255,136,0.12)" : "rgba(255,68,68,0.12)",
        border: `1px solid ${ok ? "rgba(0,255,136,0.35)" : "rgba(255,68,68,0.35)"}`,
        color: ok ? "#00ff88" : "#ff4444",
        backdropFilter: "blur(12px)",
      }}
    >
      <span>{ok ? "✓" : "✕"}</span>
      {message}
    </div>
  );
}

// ── Avatar ring ───────────────────────────────────────────────────────────────
function AvatarRing({ src, name, rank }: { src: string | null; name: string | null; rank: string }) {
  const color = RANK_COLORS[rank] ?? "#6b7280";
  const initials = (name ?? "H").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div
      className="w-28 h-28 rounded-full flex items-center justify-center font-black font-orbitron text-3xl relative overflow-hidden"
      style={{
        border: `3px solid ${color}`,
        boxShadow: `0 0 30px ${color}50, 0 0 60px ${color}20`,
        background: "rgba(2,6,23,0.8)",
      }}
    >
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span style={{ color }}>{initials}</span>
      )}
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────
export default function SettingsClient({ user }: { user: User }) {
  const rankColor = RANK_COLORS[user.rank] ?? "#6b7280";

  const [name, setName]           = useState(user.name ?? "");
  const [bio, setBio]             = useState(user.bio ?? "");
  const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [toast, setToast]         = useState<{ message: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const BIO_MAX = 300;

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarSrc(URL.createObjectURL(file)); // instant preview
  }

  function handleSave() {
    startTransition(async () => {
      try {
        // 1. Upload avatar if a new file was chosen
        if (avatarFile) {
          const fd = new FormData();
          fd.append("avatar", avatarFile);
          await uploadAvatar(fd);
        }

        // 2. Update name + bio
        const fd = new FormData();
        fd.append("name", name);
        fd.append("bio", bio);
        await updateProfile(fd);

        setAvatarFile(null);
        showToast("Profile updated successfully!", true);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Update failed", false);
      }
    });
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-orbitron">System Configuration</p>
        <h1
          className="text-2xl font-black font-orbitron uppercase tracking-widest"
          style={{ color: "#00e5ff", textShadow: "0 0 20px rgba(0,229,255,0.5)" }}
        >
          Hunter Profile
        </h1>
        <p className="text-xs text-gray-600">Customize your identity in the Shinka System.</p>
      </div>

      {/* Avatar + Rank card */}
      <div
        className="rounded-2xl p-6 flex items-center gap-6"
        style={{
          background: "rgba(2,6,23,0.7)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,229,255,0.1)",
          boxShadow: "0 0 40px rgba(0,229,255,0.04)",
        }}
      >
        <AvatarRing src={avatarSrc} name={name} rank={user.rank} />

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-gray-600">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-sm font-black font-orbitron px-2 py-0.5 rounded border"
                style={{ color: rankColor, borderColor: rankColor, background: `${rankColor}15` }}
              >
                {user.rank}
              </span>
              <span className="text-xs text-gray-500 font-orbitron">Lv. {user.level}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              background: "rgba(0,229,255,0.08)",
              border: "1px solid rgba(0,229,255,0.2)",
              color: "#00e5ff",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 15px rgba(0,229,255,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            {avatarFile ? `✓ ${avatarFile.name}` : "Upload Avatar"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="text-[10px] text-gray-700">JPG, PNG, WEBP — max 5 MB</p>
        </div>
      </div>

      {/* Form panel */}
      <div
        className="rounded-2xl p-6 space-y-6"
        style={{
          background: "rgba(2,6,23,0.7)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,229,255,0.1)",
        }}
      >
        {/* Display Name */}
        <Field label="Display Name" hint="How other Hunters see you on the Leaderboard">
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={50}
            placeholder="Enter your Hunter name…"
            className="w-full bg-black/40 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 outline-none transition-all duration-200"
            style={{ border: "1px solid rgba(0,229,255,0.15)" }}
            onFocus={e => (e.target.style.borderColor = "rgba(0,229,255,0.5)")}
            onBlur={e  => (e.target.style.borderColor = "rgba(0,229,255,0.15)")}
          />
        </Field>

        {/* Bio */}
        <Field label="Hunter Bio" hint={`${bio.length} / ${BIO_MAX}`}>
          <textarea
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, BIO_MAX))}
            rows={4}
            placeholder="Describe your evolution journey…"
            className="w-full bg-black/40 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-700 outline-none resize-none transition-all duration-200"
            style={{ border: "1px solid rgba(0,229,255,0.15)" }}
            onFocus={e => (e.target.style.borderColor = "rgba(0,229,255,0.5)")}
            onBlur={e  => (e.target.style.borderColor = "rgba(0,229,255,0.15)")}
          />
        </Field>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-4 rounded-xl font-black font-orbitron uppercase tracking-widest text-sm transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(157,0,255,0.15))",
            border: "1px solid rgba(0,229,255,0.3)",
            color: "#00e5ff",
            boxShadow: "0 0 20px rgba(0,229,255,0.08)",
          }}
          onMouseEnter={e => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 40px rgba(0,229,255,0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,229,255,0.08)"; }}
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
              Updating System…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} ok={toast.ok} />}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ── Reusable form field ───────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-orbitron">
          {label}
        </label>
        {hint && <span className="text-[10px] text-gray-700 font-orbitron">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
