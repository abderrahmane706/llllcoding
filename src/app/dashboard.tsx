"use client";

import { useState, useTransition, useOptimistic } from "react";
import { completeMission, resetMission, addMission, deleteMission } from "@/app/actions";
import { useSound } from "@/lib/useSound";
import SystemAlert from "@/components/SystemAlert";
import type { PenaltyResult } from "@/lib/data";

// ── Types ────────────────────────────────────────────────────────────────────
type Mission = {
  id: string; title: string; description: string | null;
  expReward: number; status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  type: "STANDARD" | "USER_GENERATED";
  category: string | null; prayerIndex: number | null;
};

type User = { id: string; name: string | null; level: number; rank: string; totalExp: number; };

// ── EXP threshold ────────────────────────────────────────────────────────────
const EXP_PER_LEVEL = 100;

// ── Rank badge colors ────────────────────────────────────────────────────────
const RANK_STYLES: Record<string, string> = {
  F:   "bg-gray-700 text-gray-300",
  E:   "bg-zinc-700 text-zinc-300",
  D:   "bg-blue-900 text-blue-300",
  C:   "bg-green-900 text-green-300",
  B:   "bg-yellow-900 text-yellow-300",
  A:   "bg-orange-900 text-orange-300",
  S:   "bg-purple-900 text-purple-200",
  SS:  "bg-violet-900 text-violet-200",
  SSS: "bg-gradient-to-r from-purple-900 to-blue-900 text-white",
};

// ── EXP Progress Bar ─────────────────────────────────────────────────────────
function ExpBar({ totalExp }: { totalExp: number }) {
  const expIntoLevel = totalExp % EXP_PER_LEVEL;
  const pct = (expIntoLevel / EXP_PER_LEVEL) * 100;
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{expIntoLevel} EXP</span>
        <span>{EXP_PER_LEVEL} EXP</span>
      </div>
      <div className="h-3 bg-black/50 rounded-full border border-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #9d00ff, #00e5ff)",
            boxShadow: "0 0 12px rgba(0,229,255,0.6)",
          }}
        />
      </div>
    </div>
  );
}

// ── Mission Card ─────────────────────────────────────────────────────────────
function MissionCard({
  mission,
  userId,
  onComplete,
  onReset,
  onDelete,
  isPending,
}: {
  mission: Mission;
  userId: string;
  onComplete: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const isCompleted = mission.status === "COMPLETED";
  const isStandard = mission.type === "STANDARD";

  return (
    <div
      className={`group relative w-full p-4 rounded border transition-all duration-300 ${
        isCompleted
          ? "bg-black/40 border-green-900/50 opacity-75"
          : isStandard
          ? "bg-black/50 border-gray-800 hover:border-neon-blue/50"
          : "bg-black/50 border-neon-purple/30 hover:border-neon-purple/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-bold uppercase tracking-wide text-sm ${
                isCompleted
                  ? "text-gray-500 line-through"
                  : isStandard
                  ? "text-neon-blue"
                  : "text-neon-purple"
              }`}
            >
              {mission.title}
            </h3>
            {!isStandard && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/40">
                Custom
              </span>
            )}
          </div>
          {mission.description && (
            <p className="text-gray-400 text-xs mt-0.5">{mission.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              isCompleted ? "text-sys-success" : "text-sys-warning"
            }`}
          >
            +{mission.expReward} EXP
          </span>

          {isCompleted ? (
            <button
              onClick={() => onReset(mission.id)}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:border-sys-warning hover:text-sys-warning transition-all duration-200 disabled:opacity-50"
            >
              Undo
            </button>
          ) : (
            <button
              onClick={() => onComplete(mission.id)}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black transition-all duration-200 disabled:opacity-50 font-bold hover-pulse-glow"
            >
              Done
            </button>
          )}

          {!isStandard && (
            <button
              onClick={() => onDelete(mission.id)}
              disabled={isPending}
              className="text-xs px-2 py-1.5 rounded border border-gray-800 text-gray-600 hover:border-sys-danger hover:text-sys-danger transition-all duration-200 disabled:opacity-50"
              title="Delete mission"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isCompleted && (
        <div className="absolute inset-0 rounded flex items-center justify-center pointer-events-none">
          <span className="text-sys-success text-xs font-bold uppercase tracking-widest opacity-20">
            Completed
          </span>
        </div>
      )}
    </div>
  );
}

// ── Add Mission Modal ─────────────────────────────────────────────────────────
function AddMissionModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative system-panel w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neon-purple uppercase tracking-widest">
            New Quest
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest">Quest Name *</label>
            <input
              name="title"
              required
              placeholder="e.g. 30-minute meditation"
              className="mt-1 w-full bg-black/60 border border-gray-800 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-neon-blue transition-colors text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest">Description</label>
            <input
              name="description"
              placeholder="Optional details..."
              className="mt-1 w-full bg-black/60 border border-gray-800 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-neon-blue transition-colors text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest">EXP Reward</label>
            <input
              name="expReward"
              type="number"
              min="5"
              max="500"
              defaultValue="20"
              className="mt-1 w-full bg-black/60 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-neon-blue transition-colors text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded border-2 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black font-bold uppercase tracking-widest transition-all text-sm disabled:opacity-50 font-orbitron hover-pulse-glow"
            >
              {isPending ? "Adding..." : "Add Quest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Level-Up Flash ────────────────────────────────────────────────────────────
function LevelUpFlash({ level, onDone }: { level: number; onDone: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{ animation: "fadeOut 2.5s forwards" }}
      onAnimationEnd={onDone}
    >
      <div className="text-center space-y-2" style={{ animation: "scaleUp 0.4s ease-out" }}>
        <p className="text-gray-300 uppercase tracking-widest text-sm">System Alert</p>
        <h1
          className="text-6xl font-black uppercase tracking-widest font-orbitron"
          style={{
            color: "#00e5ff",
            textShadow: "0 0 40px rgba(0,229,255,0.9), 0 0 80px rgba(0,229,255,0.5)",
          }}
        >
          Level Up!
        </h1>
        <p
          className="text-3xl font-bold font-orbitron"
          style={{
            color: "#9d00ff",
            textShadow: "0 0 20px rgba(157,0,255,0.8)",
          }}
        >
          LV. {level}
        </p>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({
  user, missions, penaltyResult,
}: {
  user: User; missions: Mission[]; penaltyResult: PenaltyResult;
}) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [levelFlash, setLevelFlash] = useState<number | null>(null);
  const { playChime, playEnergySurge } = useSound();
  const [optimisticMissions, updateOptimisticMissions] = useOptimistic(
    missions,
    (state, action: { type: "complete" | "reset" | "delete"; id: string }) => {
      if (action.type === "complete") {
        return state.map((m) =>
          m.id === action.id ? { ...m, status: "COMPLETED" as const } : m
        );
      }
      if (action.type === "reset") {
        return state.map((m) =>
          m.id === action.id ? { ...m, status: "PENDING" as const } : m
        );
      }
      if (action.type === "delete") {
        return state.filter((m) => m.id !== action.id);
      }
      return state;
    }
  );

  const completedCount = optimisticMissions.filter((m) => m.status === "COMPLETED").length;
  const totalCount = optimisticMissions.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const expIntoLevel = user.totalExp % EXP_PER_LEVEL;
  const expPct = (expIntoLevel / EXP_PER_LEVEL) * 100;

  function handleComplete(missionId: string) {
    startTransition(async () => {
      updateOptimisticMissions({ type: "complete", id: missionId });
      playChime();
      const prevLevel = user.level;
      await completeMission(missionId);
      const mission = missions.find((m) => m.id === missionId);
      if (mission) {
        const newExp = user.totalExp + mission.expReward;
        const newLevel = Math.floor(newExp / EXP_PER_LEVEL) + 1;
        if (newLevel > prevLevel) {
          playEnergySurge();
          setLevelFlash(newLevel);
        }
      }
    });
  }

  function handleReset(missionId: string) {
    startTransition(async () => {
      updateOptimisticMissions({ type: "reset", id: missionId });
      await resetMission(missionId);
    });
  }

  function handleDelete(missionId: string) {
    startTransition(async () => {
      updateOptimisticMissions({ type: "delete", id: missionId });
      await deleteMission(missionId);
    });
  }

  const standardMissions = optimisticMissions.filter((m) => m.type === "STANDARD");
  const customMissions = optimisticMissions.filter((m) => m.type === "USER_GENERATED");

  return (
    <>
      {/* Penalty alert */}
      {penaltyResult.penaltyApplied && (
        <SystemAlert type="penalty" value={penaltyResult.expLost ?? 500} onDone={() => {}} />
      )}
      {/* Level-up / Rank-up alert */}
      {levelFlash && (
        <SystemAlert type="level" value={levelFlash} onDone={() => setLevelFlash(null)} />
      )}

      {/* Add Mission Modal */}
      {showModal && (
        <AddMissionModal userId={user.id} onClose={() => setShowModal(false)} />
      )}

      <div className="min-h-screen p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center space-y-1 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-[0.3em]">System Online</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-glow-blue font-orbitron">
            Shinka Track
          </h1>
          <p className="text-xs text-gray-600 uppercase tracking-widest">Shinka System · Evolve Every Day</p>
        </div>

        {/* ── Player Card ── */}
        <div className="system-panel p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Hunter</p>
              <h2 className="text-2xl font-black text-white font-orbitron">{user.name ?? "Unknown"}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Total EXP: <span className="text-neon-blue font-bold font-orbitron">{user.totalExp.toLocaleString()}</span></p>
            </div>
            <div className="text-right space-y-1">
              <div className={`inline-block px-3 py-1 rounded text-sm font-black uppercase tracking-widest font-orbitron ${RANK_STYLES[user.rank] ?? RANK_STYLES.F}`}>
                {user.rank}
              </div>
              <p className="text-xs text-gray-400">Rank</p>
            </div>
          </div>

          {/* Level & EXP bar */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Level</span>
              <span className="text-3xl font-black text-white font-orbitron">{user.level}</span>
            </div>
            <div className="h-3 bg-black/60 rounded-full border border-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out progress-shimmer"
                style={{
                  width: `${expPct}%`,
                  background: "linear-gradient(90deg, #9d00ff, #00e5ff)",
                  boxShadow: "0 0 10px rgba(0,229,255,0.5)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{expIntoLevel} / {EXP_PER_LEVEL} EXP to next level</span>
            </div>
          </div>

          {/* Daily Quest progress */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500 uppercase tracking-widest">Daily Progress</span>
              <span className={completedCount === totalCount ? "text-sys-success font-bold" : "text-sys-warning"}>
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="h-1.5 bg-black/50 rounded-full border border-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 progress-shimmer"
                style={{
                  width: `${progressPct}%`,
                  background: completedCount === totalCount
                    ? "linear-gradient(90deg, #00ff88, #00e5ff)"
                    : "linear-gradient(90deg, #ffcc00, #ff6600)",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Daily Quests ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
              Daily Quests
            </h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${completedCount === standardMissions.length ? "text-sys-success bg-sys-success/10" : "text-sys-warning bg-sys-warning/10"}`}>
              {completedCount === standardMissions.length ? "Complete" : "In Progress"}
            </span>
          </div>
          {standardMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              userId={user.id}
              onComplete={handleComplete}
              onReset={handleReset}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>

        {/* ── Custom Quests ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
              Custom Quests
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs px-3 py-1.5 rounded border border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black transition-all duration-200 font-bold uppercase tracking-widest hover-pulse-glow"
            >
              + Add Quest
            </button>
          </div>
          {customMissions.length === 0 ? (
            <div className="text-center py-6 text-gray-700 text-sm border border-dashed border-gray-800 rounded">
              No custom quests. Add one above!
            </div>
          ) : (
            customMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                userId={user.id}
                onComplete={handleComplete}
                onReset={handleReset}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeOut {
          0%   { opacity: 1; }
          60%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes scaleUp {
          0%   { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </>
  );
}
