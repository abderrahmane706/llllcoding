import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ authenticated: false });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lastDailyReset: true, dailiesCompleted: true },
  });
  if (!user) return NextResponse.json({ authenticated: false });

  const [total, done] = await Promise.all([
    db.mission.count({ where: { userId: session.user.id, type: "STANDARD" } }),
    db.mission.count({ where: { userId: session.user.id, type: "STANDARD", status: "COMPLETED" } }),
  ]);

  return NextResponse.json({
    authenticated: true,
    lastDailyReset: user.lastDailyReset?.toISOString() ?? null,
    dailiesCompleted: user.dailiesCompleted || (total > 0 && done === total),
    completedCount: done,
    totalCount: total,
  });
}
