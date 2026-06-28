import { getPlayerProfile } from "@/lib/data";
import Dashboard from "@/app/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shinka Track — Hunter Dashboard",
  description: "Your Shinka System dashboard. Complete daily missions and evolve.",
};

export default async function Home() {
  const { user, penaltyResult } = await getPlayerProfile();

  return (
    <Dashboard
      user={{ id: user.id, name: user.name, level: user.level, rank: user.rank, totalExp: user.totalExp }}
      missions={user.missions.map(m => ({
        id: m.id, title: m.title, description: m.description,
        expReward: m.expReward, status: m.status, type: m.type,
        category: m.category, prayerIndex: m.prayerIndex,
      }))}
      penaltyResult={penaltyResult}
    />
  );
}
