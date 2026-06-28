"use server";

import { db } from "./db";
import { getLevelFromExp, getRankFromExp } from "./ranks";
import { MissionType, MissionStatus } from "@prisma/client";
import { DAILY_MISSION_DEFINITIONS } from "./missions";

const PENALTY_EXP = 500;

export type PenaltyResult = {
  penaltyApplied: boolean;
  expLost?: number;
  levelLost?: boolean;
  rankChanged?: boolean;
  newLevel?: number;
  newRank?: string;
};

// ── Reset daily standard missions for a user ──────────────────────────────────
export async function resetDailyMissions(userId: string): Promise<void> {
  await db.mission.deleteMany({ where: { userId, type: MissionType.STANDARD } });
  await db.mission.createMany({
    data: DAILY_MISSION_DEFINITIONS.map((m) => ({ ...m, userId })),
  });
}

// ── Check 24h window and apply penalty if dailies were not completed ──────────
// Called on every page load from getPlayerProfile().
export async function checkAndApplyPenalty(userId: string): Promise<PenaltyResult> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { penaltyApplied: false };

  const now  = new Date();
  const last = user.lastDailyReset;

  // ── First-ever login: seed missions and set reset timestamp ────────────────
  if (!last) {
    const existingMissions = await db.mission.count({
      where: { userId, type: MissionType.STANDARD },
    });
    if (existingMissions === 0) {
      await resetDailyMissions(userId);
    }
    await db.user.update({ where: { id: userId }, data: { lastDailyReset: now } });
    return { penaltyApplied: false };
  }

  const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

  // ── Less than 24h: nothing to process ─────────────────────────────────────
  if (hoursSince < 24) return { penaltyApplied: false };

  const prevLevel = user.level;
  const prevRank  = user.rank;
  let result: PenaltyResult = { penaltyApplied: false };

  if (!user.dailiesCompleted) {
    // ── PENALTY: dailies not completed within 24h ──────────────────────────
    const newExp   = Math.max(0, user.totalExp - PENALTY_EXP);
    const newLevel = getLevelFromExp(newExp);
    const newRank  = getRankFromExp(newExp);

    await db.user.update({
      where: { id: userId },
      data: {
        totalExp: newExp,
        level: newLevel,
        rank: newRank,
        lastDailyReset: now,
        dailiesCompleted: false,
      },
    });

    // Log negative EXP to the growth chart
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    try {
      await db.progressLog.create({ data: { userId, expGained: -PENALTY_EXP } });
    } catch {
      await db.progressLog.updateMany({
        where: { userId, date: { gte: todayStart } },
        data: { expGained: { decrement: PENALTY_EXP } },
      });
    }

    result = {
      penaltyApplied: true,
      expLost: PENALTY_EXP,
      levelLost: newLevel < prevLevel,
      rankChanged: newRank !== prevRank,
      newLevel,
      newRank,
    };
  } else {
    // ── Dailies completed: clean reset for new day ──────────────────────────
    await db.user.update({
      where: { id: userId },
      data: { lastDailyReset: now, dailiesCompleted: false },
    });
  }

  // Reset missions for the new day
  await resetDailyMissions(userId);

  return result;
}

// ── Mark dailies complete if all standard missions are done ───────────────────
export async function checkAndMarkDailiesComplete(userId: string): Promise<void> {
  const [total, done] = await Promise.all([
    db.mission.count({ where: { userId, type: MissionType.STANDARD } }),
    db.mission.count({ where: { userId, type: MissionType.STANDARD, status: MissionStatus.COMPLETED } }),
  ]);
  if (total > 0 && done === total) {
    await db.user.update({ where: { id: userId }, data: { dailiesCompleted: true } });
  }
}
