"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { MissionStatus, MissionType } from "@prisma/client";
import { getRankFromExp, getLevelFromExp } from "@/lib/ranks";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { checkAndMarkDailiesComplete } from "@/lib/penalty";

// ── Zod schema for input validation ─────────────────────────────────────────
const addMissionSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  expReward: z.coerce.number().min(5).max(500).default(20),
});

// ── Auth helper ──────────────────────────────────────────────────────────────
async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}


// ── Complete a mission ───────────────────────────────────────────────────────
export async function completeMission(missionId: string) {
  const userId = await requireAuth();

  const mission = await db.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.userId !== userId) throw new Error("Not found or unauthorized");
  if (mission.status === MissionStatus.COMPLETED) return;

  await db.mission.update({ where: { id: missionId }, data: { status: MissionStatus.COMPLETED } });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const newExp   = user.totalExp + mission.expReward;
  const newLevel = getLevelFromExp(newExp);
  const newRank  = getRankFromExp(newExp);

  await db.user.update({
    where: { id: userId },
    data: { totalExp: newExp, level: newLevel, rank: newRank },
  });

  // Log EXP gain
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  try {
    await db.progressLog.create({ data: { userId, expGained: mission.expReward } });
  } catch {
    await db.progressLog.updateMany({
      where: { userId, date: { gte: todayStart } },
      data: { expGained: { increment: mission.expReward } },
    });
  }

  // Check if all dailies are now done
  if (mission.type === MissionType.STANDARD) {
    await checkAndMarkDailiesComplete(userId);
  }

  revalidatePath("/"); revalidatePath("/quests"); revalidatePath("/status");
}

// ── Reset a mission ──────────────────────────────────────────────────────────
export async function resetMission(missionId: string) {
  const userId = await requireAuth();
  const mission = await db.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.userId !== userId) throw new Error("Not found or unauthorized");
  await db.mission.update({ where: { id: missionId }, data: { status: MissionStatus.PENDING } });
  // Un-flag dailies complete if they undo a standard mission
  if (mission.type === MissionType.STANDARD) {
    await db.user.update({ where: { id: userId }, data: { dailiesCompleted: false } });
  }
  revalidatePath("/"); revalidatePath("/quests");
}

// ── Add custom mission ───────────────────────────────────────────────────────
export async function addMission(formData: FormData) {
  const userId = await requireAuth();
  const parsed = addMissionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    expReward: formData.get("expReward"),
  });
  if (!parsed.success) throw new Error("Invalid input");
  await db.mission.create({
    data: { ...parsed.data, userId, type: MissionType.USER_GENERATED, category: "custom" },
  });
  revalidatePath("/"); revalidatePath("/quests");
}

// ── Delete a mission ─────────────────────────────────────────────────────────
export async function deleteMission(missionId: string) {
  const userId = await requireAuth();
  const mission = await db.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.userId !== userId) throw new Error("Not found or unauthorized");
  await db.mission.delete({ where: { id: missionId } });
  revalidatePath("/"); revalidatePath("/quests");
}

// ── Progress logs (last 30 days) ─────────────────────────────────────────────
export async function getProgressLogs(userId: string) {
  const authUserId = await requireAuth();
  if (userId !== authUserId) throw new Error("Unauthorized");
  const since = new Date(); since.setDate(since.getDate() - 30);
  return db.progressLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}
