import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkAndApplyPenalty, type PenaltyResult } from "@/lib/penalty";
import { Rank } from "@prisma/client";

export type { PenaltyResult };

/**
 * Ensures the Supabase Auth user has a corresponding row in our Prisma User table.
 * Creates it with default F-Rank values on first login (email or OAuth).
 */
async function ensureUserInDb(supabaseUserId: string, email: string, name?: string | null) {
  const existing = await db.user.findUnique({ where: { id: supabaseUserId } });
  if (existing) return;

  await db.user.create({
    data: {
      id: supabaseUserId, // Use Supabase UUID as the PK — keeps auth IDs in sync
      email,
      name: name ?? email.split("@")[0], // Derive display name from email if absent
      password: "",  // Not used — Supabase Auth owns credentials
      level: 1,
      totalExp: 0,
      rank: Rank.F,
    },
  });
}

export async function getPlayerProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  // Sync Supabase Auth user → Prisma DB (runs once on first login)
  await ensureUserInDb(
    user.id,
    user.email!,
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null
  );

  // Run penalty check — handles first-login seeding, 24h window, and EXP penalty
  const penaltyResult = await checkAndApplyPenalty(user.id);

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
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

  if (!dbUser) redirect("/login");

  return { user: dbUser, penaltyResult };
}
