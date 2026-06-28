import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkAndApplyPenalty, type PenaltyResult } from "@/lib/penalty";

export type { PenaltyResult };

export async function getPlayerProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Run penalty check — handles first-login seeding, 24h window, and penalty
  const penaltyResult = await checkAndApplyPenalty(userId);

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      missions: {
        orderBy: [
          { category: "asc" },
          { prayerIndex: "asc" },
          { createdAt: "asc" },
        ],
      },
      progress: true,
    },
  });

  if (!user) redirect("/login");

  return { user, penaltyResult };
}
