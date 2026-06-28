import { Rank } from "@prisma/client";

export const EXP_PER_LEVEL = 100;

// ── Rank table (total EXP milestones) ────────────────────────────────────────
export const RANK_THRESHOLDS: { rank: Rank; minExp: number; label: string; color: string }[] = [
  { rank: Rank.F,   minExp: 0,     label: "F",   color: "#6b7280" },
  { rank: Rank.E,   minExp: 500,   label: "E",   color: "#60a5fa" },
  { rank: Rank.D,   minExp: 1500,  label: "D",   color: "#34d399" },
  { rank: Rank.C,   minExp: 3000,  label: "C",   color: "#fbbf24" },
  { rank: Rank.B,   minExp: 6000,  label: "B",   color: "#f97316" },
  { rank: Rank.A,   minExp: 10000, label: "A",   color: "#ef4444" },
  { rank: Rank.S,   minExp: 20000, label: "S",   color: "#a78bfa" },
  { rank: Rank.SS,  minExp: 40000, label: "SS",  color: "#c084fc" },
  { rank: Rank.SSS, minExp: 80000, label: "SSS", color: "#e879f9" },
];

export function getRankFromExp(totalExp: number): Rank {
  let rank: Rank = Rank.F;
  for (const t of RANK_THRESHOLDS) {
    if (totalExp >= t.minExp) rank = t.rank;
    else break;
  }
  return rank;
}

export function getLevelFromExp(totalExp: number): number {
  return Math.floor(totalExp / EXP_PER_LEVEL) + 1;
}
