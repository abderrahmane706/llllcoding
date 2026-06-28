"use client";

import { useEffect, useState } from "react";

type Props = {
  type: "level" | "rank" | "penalty";
  value: string | number;
  onDone: () => void;
};

export default function SystemAlert({ type, value, onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 400);
    const t2 = setTimeout(() => setPhase("out"), 3000);
    const t3 = setTimeout(onDone, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const isLevel   = type === "level";
  const isPenalty = type === "penalty";
  const accentA   = isPenalty ? "#ff1a1a" : isLevel ? "#00e5ff" : "#ffd700";
  const accentB   = isPenalty ? "#ff6600" : isLevel ? "#9d00ff" : "#ff8c00";
  const headline  = isPenalty ? "PENALTY INITIALIZED" : isLevel ? "LEVEL UP" : "RANK UP ACHIEVED";
  const subline   = isPenalty
    ? `EXP DECAY: −${value} EXP APPLIED`
    : isLevel
    ? `LEVEL ${value} UNLOCKED`
    : `${value}-RANK ACQUIRED`;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden"
      style={{
        animation:
          phase === "in"  ? "sysIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards" :
          phase === "out" ? "sysOut 0.6s ease-in forwards" :
          "screenShake 0.5s ease 0.4s",
      }}
    >
      {/* Full-screen holographic tint */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${accentA}18 0%, transparent 70%)`,
          animation: "holoPulse 1.2s ease-in-out infinite alternate",
        }}
      />

      {/* Horizontal scan lines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 4px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Central panel */}
      <div
        className="relative flex flex-col items-center gap-4 px-8 py-10 mx-4 max-w-xl w-full text-center"
        style={{
          background: `linear-gradient(160deg, rgba(0,0,0,0.95) 0%, rgba(5,5,20,0.92) 100%)`,
          border: `1px solid ${accentA}60`,
          boxShadow: `0 0 60px ${accentA}40, 0 0 120px ${accentA}20, inset 0 0 40px ${accentA}08`,
          borderRadius: "4px",
          clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
        }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: accentA }} />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: accentA }} />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: accentA }} />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: accentA }} />

        {/* System badge */}
        <div
          className="text-[10px] uppercase tracking-[0.5em] font-bold font-orbitron px-4 py-1 rounded-full border"
          style={{ color: accentA, borderColor: `${accentA}50`, background: `${accentA}12` }}
        >
          ⬡ System Notification ⬡
        </div>

        {/* Warning stripe */}
        <div
          className="w-full h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentA}, ${accentB}, ${accentA}, transparent)`,
            boxShadow: `0 0 12px ${accentA}`,
          }}
        />

        {/* Main headline */}
        <h1
          className="text-5xl md:text-7xl font-black font-orbitron uppercase tracking-widest leading-none"
          style={{
            color: accentA,
            textShadow: `0 0 30px ${accentA}, 0 0 60px ${accentA}80, 0 0 100px ${accentA}40`,
            animation: "textFlicker 0.15s ease 0.6s 2",
          }}
        >
          {headline}
        </h1>

        {/* Value bubble */}
        <div
          className="text-2xl md:text-4xl font-black font-orbitron uppercase tracking-[0.2em] px-6 py-2 rounded"
          style={{
            color: accentB,
            background: `${accentB}15`,
            border: `1px solid ${accentB}40`,
            boxShadow: `0 0 20px ${accentB}40`,
            textShadow: `0 0 15px ${accentB}`,
          }}
        >
          {subline}
        </div>

        {/* Warning stripe bottom */}
        <div
          className="w-full h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentB}, ${accentA}, ${accentB}, transparent)`,
          }}
        />

        {/* Animated energy bars */}
        <div className="flex items-end justify-center gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: "6px",
                height: `${8 + Math.sin(i * 0.8) * 16 + 16}px`,
                background: `linear-gradient(180deg, ${accentA}, ${accentB})`,
                boxShadow: `0 0 8px ${accentA}80`,
                animation: `barBounce 0.6s ease ${i * 0.07}s infinite alternate`,
              }}
            />
          ))}
        </div>

        {/* Auto-dismiss countdown */}
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-orbitron">
          Auto-dismiss in 3s
        </p>
      </div>

      <style>{`
        @keyframes sysIn {
          0%   { opacity:0; transform:scale(1.08) translateY(-20px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes sysOut {
          0%   { opacity:1; transform:scale(1); }
          100% { opacity:0; transform:scale(0.95) translateY(20px); }
        }
        @keyframes screenShake {
          0%,100% { transform:translateX(0); }
          20%     { transform:translateX(-6px); }
          40%     { transform:translateX(6px); }
          60%     { transform:translateX(-4px); }
          80%     { transform:translateX(4px); }
        }
        @keyframes holoPulse {
          0%   { opacity:0.5; }
          100% { opacity:1; }
        }
        @keyframes textFlicker {
          0%,100% { opacity:1; }
          50%     { opacity:0.5; }
        }
        @keyframes barBounce {
          to { transform:scaleY(0.25); opacity:0.4; }
        }
        .font-orbitron { font-family: var(--font-orbitron), sans-serif; }
      `}</style>
    </div>
  );
}
