"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { z } from "zod";

// ── Validation schemas ────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Max 50 characters").trim(),
  bio:  z.string().max(300, "Max 300 characters").trim().optional(),
});

// ── Auth helper ───────────────────────────────────────────────────────────────
async function requireUserId() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}

// ── Update name + bio ─────────────────────────────────────────────────────────
export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    bio:  formData.get("bio") || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  await db.user.update({
    where: { id: userId },
    data:  { name: parsed.data.name, bio: parsed.data.bio ?? null },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

// ── Upload avatar to Supabase Storage → update avatarUrl in DB ────────────────
export async function uploadAvatar(formData: FormData) {
  const userId   = await requireUserId();
  const file     = formData.get("avatar") as File | null;

  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5 MB");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");

  const supabase = await createClient();

  // Deterministic path: one file per user (overwrites old avatar automatically)
  const ext  = file.name.split(".").pop() ?? "webp";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  // Cache-bust the URL so the browser always shows the latest avatar
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  await db.user.update({
    where: { id: userId },
    data:  { avatarUrl },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return avatarUrl;
}
