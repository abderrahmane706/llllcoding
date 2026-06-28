"use client";

import { useEffect, useRef, useState } from "react";

const POMODORO_SECS = 15 * 60; // 15 minutes

export default function ShadowZone({ onUnlock }: { onUnlock: () => void }) {
  const [started, setStarted]   = useState(false);
  const [secs, setSecs]         = useState(POMODORO_SECS);
  const [paused, setPaused]     = useState(false);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const pct = ((POMODORO_SECS - secs) / POMODORO_SECS) * 100;

  // Pause on tab switch
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        setPaused(true);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      } else {
        setPaused(false);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Tick
  useEffect(() => {
    if (!started || paused) return;
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          onUnlock();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [started, paused, onUnlock]);

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center p-6 select-none"
      style={{ background: "rgba(8,0,0,0.97)", backdropFilter: "blur(24px)" }}
    >
      {/* Scan lines */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,0,0,0.5) 3px,rgba(255,0,0,0.5) 4px)" }} />

      {/* Flashing border */}
      <div className="absolute inset-0 pointer-events-none border-2 border-red-700"
        style={{ animation: "shadowBorderPulse 2s ease-in-out infinite" }} />

      <div className="relative flex flex-col items-center gap-8 max-w-md w-full text-center">

        {/* Warning badge */}
        <div className="flex items-center gap-3 px-4 py-1.5 rounded border border-red-800/60 bg-red-950/40">
          <span className="text-red-400 text-xs font-bold font-orbitron tracking-[0.4em] uppercase"
            style={{ animation: "shadowBorderPulse 1s ease-in-out infinite" }}>
            ⚠ System Override Active
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black font-orbitron uppercase tracking-widest"
            style={{ color: "#ff1a1a", textShadow: "0 0 40px rgba(255,26,26,0.9), 0 0 80px rgba(255,26,26,0.4)" }}>
            WARNING
          </h1>
          <p className="text-lg md:text-2xl font-bold font-orbitron uppercase tracking-widest"
            style={{ color: "#ff6600", textShadow: "0 0 20px rgba(255,102,0,0.8)" }}>
            LEVEL DECAY · ENTERING SHADOW ZONE
          </p>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-red-700 to-transparent" />

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
          You failed to complete your daily Shinka obligations. Your EXP has been deducted.
          To regain access to the system, you must complete a{" "}
          <span className="text-red-400 font-bold">15-minute Penalty Pomodoro</span>.
          Switching tabs will <span className="text-red-400 font-bold">pause the timer</span>.
        </p>

        {/* Pomodoro Display */}
        <div className="w-full space-y-4">
          {/* Ring */}
          <div className="relative mx-auto w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,26,26,0.15)" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#ff1a1a" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                style={{ transition: "stroke-dashoffset 1s linear", filter: "drop-shadow(0 0 8px #ff1a1a)" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-orbitron" style={{ color: "#ff1a1a" }}>
                {mm}:{ss}
              </span>
              {paused && started && (
                <span className="text-[10px] text-red-500 uppercase tracking-widest font-orbitron animate-pulse">
                  Paused
                </span>
              )}
            </div>
          </div>

          {/* Button */}
          {!started ? (
            <button onClick={() => setStarted(true)}
              className="w-full py-4 rounded-lg border-2 border-red-600 text-red-400 font-black font-orbitron uppercase tracking-widest text-sm hover:bg-red-900/30 transition-all duration-300"
              style={{ boxShadow: "0 0 20px rgba(255,26,26,0.3)" }}>
              ⚡ Initiate Penalty Sequence
            </button>
          ) : secs === 0 ? (
            <p className="text-sys-success font-bold font-orbitron uppercase tracking-widest animate-pulse">
              ✓ Penalty Complete — Unlocking…
            </p>
          ) : (
            <div className="py-3 px-4 rounded-lg border border-red-900/50 bg-red-950/20">
              <p className="text-[11px] text-red-700 font-orbitron uppercase tracking-widest">
                {paused ? "⏸ Timer paused — return to this tab to resume" : "⏱ Penalty sequence in progress — do not leave this tab"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shadowBorderPulse {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
