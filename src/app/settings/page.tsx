import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: "Profile Settings — Shinka Track",
  description: "Customize your Hunter profile, upload an avatar, and update your bio.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, bio: true, avatarUrl: true, email: true, level: true, rank: true },
  });

  if (!dbUser) redirect("/login");

  return <SettingsClient user={dbUser} />;
}
