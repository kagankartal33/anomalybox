"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

const avatarTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const maxAvatarBytes = 2 * 1024 * 1024;

function profilePath(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `/profile?${query.toString()}`;
}

export async function updateProfileIdentity(formData: FormData) {
  const { supabase, user } = await requireUser();
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 120);

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || user.email })
    .eq("id", user.id);

  if (error) redirect(profilePath({ error: error.message }));

  revalidatePath("/profile");
  redirect(profilePath({ account: "updated" }));
}

export async function uploadProfileAvatar(formData: FormData) {
  const { supabase, user } = await requireUser();
  const avatar = formData.get("avatar");

  if (!(avatar instanceof File) || avatar.size === 0) {
    redirect(profilePath({ error: "Choose a PNG, JPG, or WebP avatar before uploading." }));
  }

  if (avatar.size > maxAvatarBytes) {
    redirect(profilePath({ error: "Avatar must be 2 MB or smaller." }));
  }

  const extension = avatarTypes[avatar.type];
  if (!extension) {
    redirect(profilePath({ error: "Avatar must be a PNG, JPG, or WebP image." }));
  }

  const storagePath = `${user.id}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("profile-avatars")
    .upload(storagePath, avatar, {
      cacheControl: "3600",
      contentType: avatar.type,
      upsert: true,
    });

  if (uploadError) redirect(profilePath({ error: uploadError.message }));

  const { data } = supabase.storage.from("profile-avatars").getPublicUrl(storagePath);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) redirect(profilePath({ error: updateError.message }));

  revalidatePath("/profile");
  redirect(profilePath({ avatar: "updated" }));
}

export async function changeProfilePassword(formData: FormData) {
  const { supabase } = await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect(profilePath({ error: "Password must be at least 8 characters." }));
  }

  if (password !== confirmPassword) {
    redirect(profilePath({ error: "Password confirmation does not match." }));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(profilePath({ error: error.message }));

  revalidatePath("/profile");
  redirect(profilePath({ password: "updated" }));
}
