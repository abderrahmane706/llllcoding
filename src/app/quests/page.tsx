import { getPlayerProfile } from "@/lib/data";
import QuestsPage from "./quests-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Quests — Shinka Track",
  description: "Complete your daily Shinka System missions to earn EXP.",
};

export default async function QuestsRoute() {
  const { user } = await getPlayerProfile();

  return (
    <QuestsPage
      user={{ id: user.id, name: user.name, level: user.level, rank: user.rank, totalExp: user.totalExp }}
      missions={user.missions.map(m => ({
        id: m.id, title: m.title, description: m.description,
        expReward: m.expReward, status: m.status, type: m.type,
        category: m.category, prayerIndex: m.prayerIndex,
        expiresAt: m.expiresAt, isCustom: m.isCustom,
      }))}
    />
  );
}
