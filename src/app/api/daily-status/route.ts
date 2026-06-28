import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return NextResponse.json({ authenticated: false });

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { lastDailyReset: true, dailiesCompleted: true },
  });
  if (!dbUser) return NextResponse.json({ authenticated: false });

  const [total, done] = await Promise.all([
    db.mission.count({ where: { userId: user.id, type: "STANDARD" } }),
    db.mission.count({ where: { userId: user.id, type: "STANDARD", status: "COMPLETED" } }),
  ]);

  return NextResponse.json({
    authenticated: true,
    lastDailyReset: dbUser.lastDailyReset?.toISOString() ?? null,
    dailiesCompleted: dbUser.dailiesCompleted || (total > 0 && done === total),
    completedCount: done,
    totalCount: total,
  });
}
