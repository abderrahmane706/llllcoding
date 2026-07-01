"use client";

import { useState, useTransition, useOptimistic, useRef, useEffect } from "react";
import { completeMission, resetMission, addMission, deleteMission, extendMission } from "@/app/actions";
import { useSound } from "@/lib/useSound";
import SystemAlert from "@/components/SystemAlert";

// ── Types ────────────────────────────────────────────────────────────────────
type Mission = {
  id: string; title: string; description: string | null;
  expReward: number; status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  type: "STANDARD" | "USER_GENERATED";
  category: string | null; prayerIndex: number | null;
  expiresAt: Date | null; isCustom: boolean | null;
  createdAt: Date | string | null;
};

type User = { id: string; name: string | null; level: number; rank: string; totalExp: number };

// ── Safe Time Left Calculation Utility ─────────────────────────────────────────
function getTimeLeft(
  expiry: Date | string | null,
  createdAt: Date | string | null
): { text: string; urgent: boolean } {
  try {
    let expiryTime = 0;
    if (expiry) {
      const parsed = new Date(expiry).getTime();
      if (!isNaN(parsed)) {
        expiryTime = parsed;
      }
    }
    
    if (expiryTime === 0 && createdAt) {
      const parsedCreated = new Date(createdAt).getTime();
      if (!isNaN(parsedCreated)) {
        expiryTime = parsedCreated + 24 * 60 * 60 * 1000;
      }
    }

    if (expiryTime === 0) {
      expiryTime = Date.now() + 24 * 60 * 60 * 1000;
    }

    const diff = expiryTime - Date.now();
    if (diff <= 0) {
      return { text: "00h 00m 00s (Expired)", urgent: true };
    }

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return { text: `${h}h ${m}m ${s}s`, urgent: h < 6 };
  } catch (e) {
    return { text: "23h left", urgent: false };
  }
}

// ── Particle burst on complete ────────────────────────────────────────────────
function useParticleBurst() {
  const ref = useRef<HTMLDivElement>(null);

  function burst() {
    if (!ref.current) return;
    const container = ref.current;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement("div");
      const angle = (i / 12) * 360;
      const dist  = 40 + Math.random() * 30;
      p.style.cssText = `
        position:absolute;top:50%;left:50%;width:4px;height:4px;border-radius:50%;
        background:${Math.random() > 0.5 ? "#00e5ff" : "#9d00ff"};
        transform:translate(-50%,-50%);pointer-events:none;z-index:50;
        animation:particle 0.6s ease-out forwards;
        --dx:${Math.cos((angle * Math.PI) / 180) * dist}px;
        --dy:${Math.sin((angle * Math.PI) / 180) * dist}px;
      `;
      container.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  return { ref, burst };
}

// ── Single Mission Card ───────────────────────────────────────────────────────
function MissionCard({
  mission, userId, isPending, onComplete, onReset, onDelete, onExtend
}: {
  mission: Mission; userId: string; isPending: boolean;
  onComplete: (id: string) => void; onReset: (id: string) => void; onDelete: (id: string) => void;
  onExtend?: (id: string, hours: number) => void;
}) {
  const { ref, burst } = useParticleBurst();
  const [justCompleted, setJustCompleted] = useState(false);
  const isCompleted = mission.status === "COMPLETED";
  const isCustom    = (mission.isCustom ?? false) || mission.type === "USER_GENERATED";

  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (isCompleted) return;
    
    const updateTimer = () => {
      const { text, urgent } = getTimeLeft(mission.expiresAt, mission.createdAt);
      setTimeLeft(text);
      setIsUrgent(urgent);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [mission.expiresAt, mission.createdAt, isCompleted]);

  function handleComplete() {
    burst();
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 600);
    onComplete(mission.id);
  }

  return (
    <div
      ref={ref}
      className={`relative group w-full p-4 rounded-lg border transition-all duration-500 overflow-hidden ${
        isCompleted
          ? "bg-black/30 border-green-900/40 opacity-60"
          : isCustom
          ? "bg-black/50 border-neon-purple/30 hover:border-neon-purple/60 hover:bg-black/60"
          : "bg-black/50 border-gray-800 hover:border-neon-blue/50 hover:bg-black/60"
      } ${justCompleted ? "scale-95" : "scale-100"}`}
      style={{ transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      {/* Glow sweep on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: isCustom
            ? "linear-gradient(135deg, rgba(157,0,255,0.05) 0%, transparent 60%)"
            : "linear-gradient(135deg, rgba(0,229,255,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="flex items-start justify-between gap-4 relative z-10">
        {/* Left: info */}
        <div className="flex-1 min-w-0 flex items-start gap-3">
          {/* Status dot */}
          <div className="mt-1 shrink-0">
            {isCompleted ? (
              <div className="w-4 h-4 rounded-full bg-sys-success/20 border border-sys-success flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-sys-success" style={{ boxShadow: "0 0 6px #00ff88" }} />
              </div>
            ) : (
              <div className={`w-4 h-4 rounded-full border-2 ${isCustom ? "border-neon-purple/50" : "border-gray-700"}`} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-bold uppercase tracking-wide text-sm leading-tight ${
                isCompleted ? "text-gray-600 line-through" : isCustom ? "text-neon-purple" : "text-neon-blue"
              }`}>
                {mission.title}
              </h3>
              {isCustom && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-800/40 uppercase tracking-widest">
                  Custom
                </span>
              )}
            </div>
            {mission.description && (
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{mission.description}</p>
            )}
            {timeLeft && !isCompleted && (
              <p className={`text-[10px] font-orbitron mt-1 ${isUrgent ? "text-red-500 animate-pulse" : "text-gray-400"}`}>
                ⏳ {timeLeft}
              </p>
            )}
          </div>
        </div>

        {/* Right: EXP + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`text-xs font-black font-orbitron px-2 py-1 rounded border ${
            isCompleted
              ? "text-sys-success border-sys-success/30 bg-sys-success/10"
              : "text-sys-warning border-sys-warning/30 bg-sys-warning/10"
          }`}>
            +{mission.expReward}
          </div>

          {isCompleted ? (
            <button
              onClick={() => onReset(mission.id)}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded border border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-400 transition-all disabled:opacity-40"
            >
              Undo
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isPending}
              className={`text-xs px-3 py-1.5 rounded border-2 font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-40 hover-pulse-glow ${
                isCustom
                  ? "border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black"
                  : "border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black"
              }`}
            >
              Done
            </button>
          )}

          {isCustom && !isCompleted && onExtend && (
            <button
              onClick={() => onExtend(mission.id, 1)}
              disabled={isPending}
              className="text-[10px] px-2 py-1.5 rounded border border-purple-800/40 text-purple-400 hover:bg-purple-900/40 transition-all disabled:opacity-40 uppercase font-orbitron"
              title="Extend Time (+1h)"
            >
              +1H
            </button>
          )}

          {isCustom && (
            <button
              onClick={() => onDelete(mission.id)}
              disabled={isPending}
              className="text-xs px-2 py-1.5 rounded border border-gray-900 text-gray-700 hover:border-sys-danger/60 hover:text-sys-danger transition-all disabled:opacity-40"
              title="Delete quest"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Quest Modal ───────────────────────────────────────────────────────────
function AddQuestModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("userId", userId);
    startTransition(async () => {
      await addMission(fd);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-6 space-y-6 border border-neon-purple/30"
        style={{
          background: "rgba(10,5,15,0.95)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 0 40px rgba(157,0,255,0.2), inset 0 1px 0 rgba(157,0,255,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em]">System Message</p>
            <h2 className="text-xl font-black font-orbitron text-neon-purple uppercase tracking-widest mt-0.5"
              style={{ textShadow: "0 0 20px rgba(157,0,255,0.6)" }}>
              New Quest Registration
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-gray-800 text-gray-600 hover:text-white hover:border-gray-600 flex items-center justify-center transition-all">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1.5">Quest Name *</label>
            <input
              ref={inputRef}
              name="title"
              required
              placeholder="e.g. Morning meditation, Read 20 pages..."
              className="w-full bg-black/60 border border-gray-800 focus:border-neon-purple rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition-all duration-200"
              style={{ boxShadow: "0 0 0 0 rgba(157,0,255,0)" }}
              onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(157,0,255,0.2)"}
              onBlur={e => e.target.style.boxShadow = "0 0 0 0 rgba(157,0,255,0)"}
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1.5">Description</label>
            <input
              name="description"
              placeholder="Optional — add context or requirements..."
              className="w-full bg-black/60 border border-gray-800 focus:border-neon-purple rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-700 outline-none transition-all duration-200"
              onFocus={e => e.target.style.boxShadow = "0 0 0 2px rgba(157,0,255,0.2)"}
              onBlur={e => e.target.style.boxShadow = "0 0 0 0 rgba(157,0,255,0)"}
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1.5">
              EXP Reward <span className="text-gray-700">(5 – 500)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                name="expReward"
                type="range"
                min="5"
                max="500"
                step="5"
                defaultValue="20"
                className="flex-1 accent-purple-500"
                onInput={e => {
                  const el = e.currentTarget.nextElementSibling as HTMLElement;
                  if (el) el.textContent = e.currentTarget.value;
                }}
              />
              <div className="w-14 text-center text-neon-purple font-black text-sm bg-purple-900/20 border border-purple-900/40 rounded px-2 py-1">
                20
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 rounded-lg border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black font-black font-orbitron uppercase tracking-widest transition-all text-sm disabled:opacity-50 hover-pulse-glow"
              style={{ boxShadow: isPending ? "none" : "0 0 15px rgba(157,0,255,0.3)" }}
            >
              {isPending ? "Registering…" : "Register Quest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Level-Up Flash ─────────────────────────────────────────────────────────────
function LevelUpFlash({ level, onDone }: { level: number; onDone: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{ animation: "lvlFadeOut 2.5s forwards" }}
      onAnimationEnd={onDone}
    >
      <div className="text-center space-y-3" style={{ animation: "lvlPop 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <p className="text-gray-400 uppercase tracking-[0.4em] text-xs">System Alert</p>
        <h1 className="text-6xl md:text-8xl font-black font-orbitron uppercase"
          style={{ color: "#00e5ff", textShadow: "0 0 60px rgba(0,229,255,0.9), 0 0 120px rgba(0,229,255,0.4)" }}>
          Level Up!
        </h1>
        <p className="text-4xl font-black font-orbitron"
          style={{ color: "#9d00ff", textShadow: "0 0 30px rgba(157,0,255,0.8)" }}>
          LV. {level}
        </p>
        <div className="flex justify-center gap-2 mt-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-8 rounded-full"
              style={{
                background: "linear-gradient(180deg,#9d00ff,#00e5ff)",
                animation: `barPulse 0.6s ease ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ label, accent, children }: { label: string; accent: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">{label}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Prayer Group Panel ─────────────────────────────────────────────────────────
const PRAYER_META = [
  { key: "Fajr Prayer",    arabic: "فجر",  time: "Dawn"      },
  { key: "Dhuhr Prayer",   arabic: "ظهر",  time: "Noon"      },
  { key: "Asr Prayer",     arabic: "عصر",  time: "Afternoon" },
  { key: "Maghrib Prayer", arabic: "مغرب", time: "Sunset"    },
  { key: "Isha Prayer",    arabic: "عشاء", time: "Night"     },
];

function PrayerPanel({ prayers, isPending, onComplete, onReset }: {
  prayers: Mission[]; isPending: boolean;
  onComplete: (id: string) => void; onReset: (id: string) => void;
}) {
  const done    = prayers.filter(p => p.status === "COMPLETED").length;
  const total   = prayers.length;
  const allDone = done === total && total > 0;

  return (
    <div className="rounded-xl border p-4 space-y-4" style={{
      background: "rgba(2,6,23,0.7)",
      borderColor: allDone ? "rgba(0,255,136,0.3)" : "rgba(0,229,255,0.15)",
      backdropFilter: "blur(12px)",
      boxShadow: allDone ? "0 0 20px rgba(0,255,136,0.1)" : "none",
    }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.35em]">Mandatory · Daily</p>
          <h3 className="text-sm font-black font-orbitron text-neon-blue uppercase tracking-widest">
            The 5 Sacred Prayers
          </h3>
          <p className="text-[10px] text-gray-600 mt-0.5">الصلوات الخمس · Non-negotiable</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black font-orbitron ${allDone ? "text-sys-success" : "text-neon-blue"}`}
               style={{ textShadow: allDone ? "0 0 10px #00ff88" : "0 0 10px #00e5ff" }}>
            {done}<span className="text-gray-700 text-lg">/{total}</span>
          </div>
          <p className="text-[10px] text-gray-600 uppercase">Prayers</p>
        </div>
      </div>

      <div className="h-1.5 bg-black/60 rounded-full border border-gray-900 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 progress-shimmer" style={{
          width: `${total > 0 ? (done / total) * 100 : 0}%`,
          background: allDone ? "linear-gradient(90deg,#00ff88,#00e5ff)" : "linear-gradient(90deg,#00e5ff,#9d00ff)",
          boxShadow: allDone ? "0 0 8px #00ff88" : "0 0 6px #00e5ff",
        }} />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {PRAYER_META.map(meta => {
          const p = prayers.find(m => m.title === meta.key);
          if (!p) return null;
          const completed = p.status === "COMPLETED";
          return (
            <button key={p.id} onClick={() => completed ? onReset(p.id) : onComplete(p.id)}
              disabled={isPending}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200 hover-pulse-glow ${
                completed ? "border-sys-success/40 bg-sys-success/10" : "border-gray-800 hover:border-neon-blue/50 bg-black/40"
              }`}>
              <span className="text-lg leading-none" style={{ textShadow: completed ? "0 0 8px #00ff88" : "none" }}>
                {completed ? "✓" : "☽"}
              </span>
              <span className="text-base font-black leading-none" style={{ color: completed ? "#00ff88" : "#6b7280" }}>
                {meta.arabic}
              </span>
              <span className="text-[9px] text-gray-600 text-center leading-tight">{meta.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Quests Page Component ──────────────────────────────────────────────────
export default function QuestsPage({ user, missions }: { user: User; missions: Mission[] }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal]    = useState(false);
  const [levelFlash, setLevelFlash]  = useState<number | null>(null);
  const { playChime, playEnergySurge } = useSound();

  const [optimisticMissions, update] = useOptimistic(
    missions,
    (state, action: { type: "complete" | "reset" | "delete"; id: string }) => {
      if (action.type === "complete") return state.map(m => m.id === action.id ? { ...m, status: "COMPLETED" as const } : m);
      if (action.type === "reset")    return state.map(m => m.id === action.id ? { ...m, status: "PENDING" as const } : m);
      if (action.type === "delete")   return state.filter(m => m.id !== action.id);
      return state;
    }
  );

  const system = optimisticMissions.filter(m => m.type === "STANDARD");
  const custom  = optimisticMissions.filter(m => m.type === "USER_GENERATED");
  const completedSystem = system.filter(m => m.status === "COMPLETED").length;
  const allDone = completedSystem === system.length && system.length > 0;

  function handleComplete(id: string) {
    startTransition(async () => {
      update({ type: "complete", id });
      playChime();
      const mission = missions.find(m => m.id === id);
      if (mission) {
        const newExp   = user.totalExp + mission.expReward;
        const newLevel = Math.floor(newExp / 100) + 1;
        if (newLevel > user.level) {
          playEnergySurge();
          setLevelFlash(newLevel);
        }
      }
      await completeMission(id);
    });
  }

  function handleReset(id: string) {
    startTransition(async () => {
      update({ type: "reset", id });
      await resetMission(id);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      update({ type: "delete", id });
      await deleteMission(id);
    });
  }

  function handleExtend(id: string, hours: number) {
    startTransition(async () => {
      await extendMission(id, hours);
    });
  }

  return (
    <>
      {levelFlash && (
        <SystemAlert
          type="level"
          value={levelFlash}
          onDone={() => setLevelFlash(null)}
        />
      )}
      {showModal  && <AddQuestModal userId={user.id} onClose={() => setShowModal(false)} />}

      <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="pt-2 space-y-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em]">Shinka System</p>
          <h1 className="text-2xl md:text-3xl font-black font-orbitron uppercase tracking-widest"
            style={{ color: "#00e5ff", textShadow: "0 0 30px rgba(0,229,255,0.5)" }}>
            System Quests
          </h1>
          {/* Daily progress ticker */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-1 flex-1 bg-black/60 rounded-full border border-gray-900 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 progress-shimmer"
                style={{
                  width: `${system.length ? (completedSystem / system.length) * 100 : 0}%`,
                  background: allDone
                    ? "linear-gradient(90deg,#00ff88,#00e5ff)"
                    : "linear-gradient(90deg,#ffcc00,#ff6600)",
                  boxShadow: allDone ? "0 0 8px #00ff88" : "0 0 8px #ffcc00",
                }}
              />
            </div>
            <span className={`text-xs font-bold font-orbitron whitespace-nowrap ${allDone ? "text-sys-success" : "text-sys-warning"}`}>
              {completedSystem}/{system.length} Daily
            </span>
          </div>
        </div>

        {/* ── System Quests ── */}
        <section className="space-y-3">
          <SectionHeader label="Shinka Daily Mandatories" accent="#00e5ff">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${
              allDone ? "bg-sys-success/10 text-sys-success border border-sys-success/20" : "bg-sys-warning/10 text-sys-warning border border-sys-warning/20"
            }`}>
              {allDone ? "✓ Complete" : "In Progress"}
            </span>
          </SectionHeader>

          {/* Prayer panel */}
          <PrayerPanel
            prayers={system.filter(m => m.category === "prayer")}
            isPending={isPending}
            onComplete={handleComplete}
            onReset={handleReset}
          />

          {/* Other standard missions */}
          <div className="p-4 rounded-xl border border-gray-900 space-y-3"
               style={{ background: "rgba(0,229,255,0.02)" }}>
            {system.filter(m => m.category !== "prayer").map(m => (
              <MissionCard key={m.id} mission={m} userId={user.id} isPending={isPending}
                onComplete={handleComplete} onReset={handleReset} onDelete={handleDelete} onExtend={handleExtend} />
            ))}
          </div>
        </section>

        {/* ── Player Quests ── */}
        <section className="space-y-3">
          <SectionHeader label="Player Quests" accent="#9d00ff">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-neon-purple/50 text-neon-purple hover:bg-neon-purple hover:text-black font-bold uppercase tracking-widest transition-all duration-200 hover-pulse-glow"
              style={{ boxShadow: "0 0 10px rgba(157,0,255,0.15)" }}
            >
              <span className="text-base leading-none">+</span>
              <span>New Quest</span>
            </button>
          </SectionHeader>

          <div
            className="p-4 rounded-xl border border-gray-900 space-y-3 min-h-[80px]"
            style={{ background: "rgba(157,0,255,0.02)" }}
          >
            {custom.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="text-3xl opacity-20">⚔</div>
                <p className="text-gray-700 text-sm">No custom quests registered.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs text-neon-purple/60 hover:text-neon-purple underline underline-offset-2 transition-colors mt-1"
                >
                  Register your first quest →
                </button>
              </div>
            ) : (
              custom.map(m => (
                <MissionCard key={m.id} mission={m} userId={user.id} isPending={isPending}
                  onComplete={handleComplete} onReset={handleReset} onDelete={handleDelete} onExtend={handleExtend} />
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes particle { to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))); opacity:0; } }
        @keyframes lvlFadeOut { 0%,60%{opacity:1} 100%{opacity:0} }
        @keyframes lvlPop { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes barPulse { to { transform:scaleY(0.3); opacity:0.4; } }
      `}</style>
    </>
  );
}
