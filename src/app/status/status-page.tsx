"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
type RankInfo = { rank: string; label: string; minExp: number; color: string };
type ChartPoint = { date: string; exp: number; cumulative: number };
type Props = {
  user: {
    id: string; name: string | null; level: number; rank: string;
    totalExp: number; completedMissions: number; totalMissions: number;
  };
  ranks: RankInfo[];
  chartData: ChartPoint[];
};

// ── Custom tooltip ────────────────────────────────────────────────────────────
function GlowTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg border border-gray-800 text-sm"
      style={{ background: "rgba(5,5,10,0.95)", backdropFilter: "blur(12px)" }}
    >
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-neon-blue font-bold">+{payload[0]?.value} EXP</p>
    </div>
  );
}

// ── Rank Badge ────────────────────────────────────────────────────────────────
function RankBadge({ rank, color, size = "lg" }: { rank: string; color: string; size?: "sm" | "lg" }) {
  return (
    <div
      className={`font-black uppercase rounded-lg flex items-center justify-center border-2 font-orbitron ${
        size === "lg" ? "w-20 h-20 text-3xl" : "w-8 h-8 text-xs"
      }`}
      style={{
        borderColor: color,
        color,
        background: `${color}15`,
        boxShadow: `0 0 20px ${color}40, inset 0 0 20px ${color}10`,
        textShadow: `0 0 15px ${color}`,
      }}
    >
      {rank}
    </div>
  );
}

// ── Stat Item ─────────────────────────────────────────────────────────────────
function StatItem({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="text-center space-y-1">
      <p className="text-[10px] text-gray-600 uppercase tracking-[0.25em]">{label}</p>
      <p className="text-xl font-black font-orbitron" style={{ color: accent ?? "#e0e0e0" }}>{value}</p>
    </div>
  );
}

// ── Main Status Page ───────────────────────────────────────────────────────────
export default function StatusPage({ user, ranks, chartData }: Props) {
  const currentRankInfo = ranks.find(r => r.rank === user.rank) ?? ranks[0];
  const nextRankInfo    = ranks[ranks.findIndex(r => r.rank === user.rank) + 1];
  const expIntoRank     = user.totalExp - currentRankInfo.minExp;
  const expNeeded       = nextRankInfo ? nextRankInfo.minExp - currentRankInfo.minExp : 1;
  const rankPct         = nextRankInfo ? Math.min(100, (expIntoRank / expNeeded) * 100) : 100;

  const expIntoLevel    = user.totalExp % 100;
  const levelPct        = expIntoLevel;

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-6">

      {/* Page header */}
      <div className="pt-2 space-y-0.5">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em]">Hunter Profile</p>
        <h1 className="text-2xl md:text-3xl font-black font-orbitron uppercase tracking-widest"
          style={{ color: "#9d00ff", textShadow: "0 0 30px rgba(157,0,255,0.5)" }}>
          Player Status
        </h1>
      </div>

      {/* ── Identity Card ── */}
      <div
        className="rounded-xl border p-5 space-y-5"
        style={{
          background: "rgba(10,5,20,0.8)",
          backdropFilter: "blur(20px)",
          borderColor: `${currentRankInfo.color}40`,
          boxShadow: `0 0 30px ${currentRankInfo.color}15, inset 0 1px 0 ${currentRankInfo.color}20`,
        }}
      >
        {/* Name + rank */}
        <div className="flex items-center gap-5">
          <RankBadge rank={user.rank} color={currentRankInfo.color} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Hunter Name</p>
            <h2 className="text-2xl font-black text-white truncate">{user.name ?? "Unknown"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Level <span className="text-white font-bold font-orbitron">{user.level}</span>
              <span className="text-gray-700 mx-1.5">·</span>
              Total EXP <span style={{ color: currentRankInfo.color }} className="font-bold font-orbitron">{user.totalExp.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-900">
          <StatItem label="Level" value={user.level} accent="#00e5ff" />
          <StatItem label="Missions Done" value={user.completedMissions} accent="#00ff88" />
          <StatItem label="Total Quests" value={user.totalMissions} accent={currentRankInfo.color} />
        </div>

        {/* Rank progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-widest">Rank Progress</span>
              <span className="text-xs font-bold font-orbitron" style={{ color: currentRankInfo.color }}>{user.rank}</span>
              {nextRankInfo && (
                <>
                  <span className="text-gray-700 text-xs">→</span>
                  <span className="text-xs font-bold font-orbitron" style={{ color: nextRankInfo.color }}>{nextRankInfo.rank}</span>
                </>
              )}
            </div>
            <span className="text-xs text-gray-600 font-orbitron">
              {nextRankInfo ? `${expIntoRank.toLocaleString()} / ${expNeeded.toLocaleString()} EXP` : "Max Rank"}
            </span>
          </div>
          <div className="h-3 bg-black/60 rounded-full border border-gray-900 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 progress-shimmer"
              style={{
                width: `${rankPct}%`,
                background: `linear-gradient(90deg, ${currentRankInfo.color}80, ${currentRankInfo.color})`,
                boxShadow: `0 0 10px ${currentRankInfo.color}80`,
              }}
            />
          </div>
        </div>

        {/* Level EXP bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[10px] text-gray-600 uppercase tracking-widest">Level EXP</span>
            <span className="text-xs text-gray-600 font-orbitron">{expIntoLevel} / 100</span>
          </div>
          <div className="h-2 bg-black/60 rounded-full border border-gray-900 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 progress-shimmer"
              style={{
                width: `${levelPct}%`,
                background: "linear-gradient(90deg, #9d00ff, #00e5ff)",
                boxShadow: "0 0 8px rgba(0,229,255,0.5)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Rank Ladder ── */}
      <div
        className="rounded-xl border border-gray-900 p-4 space-y-3"
        style={{ background: "rgba(5,5,10,0.6)", backdropFilter: "blur(12px)" }}
      >
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em]">Rank Ladder</p>
        <div className="space-y-1.5">
          {[...ranks].reverse().map((r, i) => {
            const isCurrent = r.rank === user.rank;
            const isPassed  = user.totalExp >= r.minExp;
            return (
              <div
                key={r.rank}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                  isCurrent
                    ? "border-opacity-50"
                    : isPassed
                    ? "border-gray-900 opacity-60"
                    : "border-gray-900 opacity-30"
                }`}
                style={{
                  borderColor: isCurrent ? r.color : undefined,
                  background: isCurrent ? `${r.color}10` : "transparent",
                  boxShadow: isCurrent ? `0 0 10px ${r.color}20` : "none",
                }}
              >
                <RankBadge rank={r.rank} color={r.color} size="sm" />
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: isPassed ? r.color : "#4b5563" }}>
                    {r.rank}-Rank
                  </p>
                  <p className="text-[10px] text-gray-700">{r.minExp.toLocaleString()}+ EXP</p>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ color: r.color, background: `${r.color}20`, border: `1px solid ${r.color}40` }}>
                    Current
                  </span>
                )}
                {isPassed && !isCurrent && (
                  <span className="text-[10px] text-sys-success">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Growth Timeline ── */}
      <div
        className="rounded-xl border border-gray-900 p-4 space-y-4"
        style={{ background: "rgba(5,5,10,0.6)", backdropFilter: "blur(12px)" }}
      >
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em]">Growth Timeline</p>
          <p className="text-xs text-gray-700 mt-0.5">EXP gained over the last 30 days</p>
        </div>

        {chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-gray-700 text-sm">No activity logged yet. Complete missions to start tracking!</p>
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#00e5ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00e5ff" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#4b5563", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={d => {
                    const parts = d.split("-");
                    return `${parts[1]}/${parts[2]}`;
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlowTooltip />} cursor={{ stroke: "rgba(0,229,255,0.2)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="exp"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  fill="url(#expGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#00e5ff", stroke: "#00e5ff", strokeWidth: 2,
                    style: { filter: "drop-shadow(0 0 6px #00e5ff)" } }}
                  style={{ filter: "drop-shadow(0 0 4px rgba(0,229,255,0.4))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
