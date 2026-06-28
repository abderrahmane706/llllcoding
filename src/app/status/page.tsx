import { getProgressLogs } from "@/app/actions";
import { RANK_THRESHOLDS } from "@/lib/ranks";
import { getPlayerProfile } from "@/lib/data";
import StatusPage from "./status-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Status — Shinka Track",
  description: "View your rank, EXP progress, and 30-day Shinka growth timeline.",
};

export default async function StatusRoute() {
  const { user } = await getPlayerProfile();
  const logs = await getProgressLogs(user.id);

  const today = new Date();
  const chartData: { date: string; exp: number; cumulative: number }[] = [];
  let cumulative = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const log = logs.find(l => l.date.toISOString().split("T")[0] === key);
    const exp = log?.expGained ?? 0;
    cumulative += exp;
    chartData.push({ date: key, exp, cumulative });
  }

  return (
    <StatusPage
      user={{
        id: user.id, name: user.name, level: user.level,
        rank: user.rank, totalExp: user.totalExp,
        completedMissions: user.missions.filter(m => m.status === "COMPLETED").length,
        totalMissions: user.missions.length,
      }}
      ranks={RANK_THRESHOLDS.map(t => ({ rank: t.rank, label: t.label, minExp: t.minExp, color: t.color }))}
      chartData={chartData}
    />
  );
}
