import { db } from "@/lib/db";
import { RANK_THRESHOLDS } from "@/lib/ranks";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard — Solo Leveling Tracker",
  description: "The global ranking of all hunters, sorted by level and EXP.",
};

// ── Secure Prisma query: ONLY public fields ──────────────────────────────────
// Explicitly uses `select` to whitelist fields — no email, password,
// progress logs, or internal IDs are ever fetched or exposed.
// This prevents BOLA / Broken Object Level Authorization (OWASP API3:2023).
async function getLeaderboard() {
  return db.user.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      rank: true,
      totalExp: true,
      tasksCompleted: true,
      avatarUrl: true,
    },
    orderBy: [{ tasksCompleted: "desc" }, { totalExp: "desc" }],
    take: 50,
  });
}

// ── Rank color map ────────────────────────────────────────────────────────────
function getRankColor(rank: string): string {
  return RANK_THRESHOLDS.find(t => t.rank === rank)?.color ?? "#6b7280";
}

// ── Rank badge ─────────────────────────────────────────────────────────────────
function RankBadge({ rank, avatarUrl, name }: { rank: string; avatarUrl: string | null; name: string | null }) {
  const color = getRankColor(rank);
  const initials = (name ?? "H").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div
      className="w-10 h-10 rounded font-black font-orbitron text-sm flex items-center justify-center border-2 shrink-0 overflow-hidden relative bg-black/80"
      style={{
        color,
        borderColor: color,
        boxShadow: `0 0 10px ${color}40`,
        textShadow: `0 0 8px ${color}`,
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// ── Medal for top 3 ───────────────────────────────────────────────────────────
function Medal({ pos }: { pos: number }) {
  if (pos === 1) return <span style={{ textShadow: "0 0 10px #ffd700" }}>🥇</span>;
  if (pos === 2) return <span style={{ textShadow: "0 0 10px #c0c0c0" }}>🥈</span>;
  if (pos === 3) return <span style={{ textShadow: "0 0 10px #cd7f32" }}>🥉</span>;
  return (
    <span className="text-xs font-black font-orbitron text-gray-600 w-6 text-center">
      #{pos}
    </span>
  );
}

// ── EXP mini-bar ─────────────────────────────────────────────────────────────
function ExpBar({ totalExp, rank }: { totalExp: number; rank: string }) {
  const color  = getRankColor(rank);
  const maxExp = 80000;
  const pct    = Math.min(100, (totalExp / maxExp) * 100);
  return (
    <div className="w-24 h-1.5 bg-black/50 rounded-full border border-gray-900 overflow-hidden">
      <div
        className="h-full rounded-full progress-shimmer"
        style={{
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 6px ${color}80`,
        }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function LeaderboardPage() {
  const players = await getLeaderboard();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="pt-2 space-y-1">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em]">Global Ranking</p>
        <h1
          className="text-2xl md:text-3xl font-black font-orbitron uppercase tracking-widest"
          style={{ color: "#ffd700", textShadow: "0 0 30px rgba(255,215,0,0.5)" }}
        >
          Hunter Leaderboard
        </h1>
        <p className="text-xs text-gray-600">
          Top {players.length} hunters ranked by level and total EXP
        </p>
      </div>

      {/* Board */}
      <div
        className="rounded-xl border border-yellow-500/10 overflow-hidden"
        style={{ background: "rgba(2,6,23,0.7)", backdropFilter: "blur(16px)" }}
      >
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_auto] md:grid-cols-[40px_1fr_80px_auto] gap-4 px-4 py-2 border-b border-gray-900">
          <span className="text-[10px] text-gray-700 uppercase tracking-widest">#</span>
          <span className="text-[10px] text-gray-700 uppercase tracking-widest">Hunter</span>
          <span className="text-[10px] text-gray-700 uppercase tracking-widest hidden md:block">EXP</span>
          <span className="text-[10px] text-gray-700 uppercase tracking-widest">Level</span>
        </div>

        {players.length === 0 ? (
          <div className="py-16 text-center text-gray-700 text-sm">
            No hunters registered yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-900/60">
            {players.map((player, i) => {
              const pos = i + 1;
              const rankColor = getRankColor(player.rank);
              const isTop3 = pos <= 3;

              return (
                <div
                  key={player.id}
                  className={`group grid grid-cols-[40px_1fr_auto] md:grid-cols-[40px_1fr_80px_auto] gap-4 items-center px-4 py-3.5 transition-colors duration-200 ${
                    player.id === currentUserId
                      ? "bg-cyan-900/30 hover:bg-cyan-900/40"
                      : isTop3
                      ? "bg-yellow-500/03 hover:bg-yellow-500/06"
                      : "hover:bg-white/02"
                  }`}
                  style={
                    player.id === currentUserId
                      ? { borderLeft: "2px solid #00e5ff" }
                      : isTop3
                      ? { borderLeft: `2px solid ${pos === 1 ? "#ffd700" : pos === 2 ? "#c0c0c0" : "#cd7f32"}` }
                      : { borderLeft: "2px solid transparent" }
                  }
                >
                  {/* Position */}
                  <div className="flex items-center justify-center text-base">
                    <Medal pos={pos} />
                  </div>

                  {/* Name + rank badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    <RankBadge rank={player.rank} avatarUrl={player.avatarUrl} name={player.name} />
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate flex items-center gap-2 ${
                        player.id === currentUserId
                          ? "text-neon-blue"
                          : pos === 1 ? "text-yellow-400" : pos <= 3 ? "text-gray-200" : "text-gray-400"
                      }`}>
                        {player.name ?? "Unknown Hunter"}
                        {player.id === currentUserId && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-neon-blue/30 bg-neon-blue/10 uppercase tracking-widest text-neon-blue">You</span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-600 font-orbitron">
                        {player.tasksCompleted.toLocaleString()} TASKS • {player.totalExp.toLocaleString()} EXP
                      </p>
                    </div>
                  </div>

                  {/* EXP bar (desktop) */}
                  <div className="hidden md:flex items-center">
                    <ExpBar totalExp={player.totalExp} rank={player.rank} />
                  </div>

                  {/* Level */}
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      className="text-xl font-black font-orbitron leading-none"
                      style={{ color: rankColor, textShadow: `0 0 10px ${rankColor}60` }}
                    >
                      {player.level}
                    </span>
                    <span className="text-[10px] text-gray-700 uppercase">Lv</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security note (dev-mode, remove in production) */}
      <p className="text-[10px] text-gray-800 text-center">
        Query selects: name · level · rank · totalExp only. Email, password and logs are never fetched.
      </p>
    </div>
  );
}
