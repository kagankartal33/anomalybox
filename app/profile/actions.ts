"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { FLASH } from "@/lib/flash-messages";

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

  if (error) {
    console.warn("Profile identity update failed.", { code: error.code });
    redirect(profilePath({ error: FLASH.profileUpdateFailed }));
  }

  revalidatePath("/profile");
  redirect(profilePath({ account: "updated" }));
}

export async function uploadProfileAvatar(formData: FormData) {
  const { supabase, user } = await requireUser();
  const avatar = formData.get("avatar");

  if (!(avatar instanceof File) || avatar.size === 0) {
    redirect(profilePath({ error: FLASH.avatarMissing }));
  }

  if (avatar.size > maxAvatarBytes) {
    redirect(profilePath({ error: FLASH.avatarTooLarge }));
  }

  const extension = avatarTypes[avatar.type];
  if (!extension) {
    redirect(profilePath({ error: FLASH.avatarWrongType }));
  }

  const storagePath = `${user.id}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("profile-avatars")
    .upload(storagePath, avatar, {
      cacheControl: "3600",
      contentType: avatar.type,
      upsert: true,
    });

  if (uploadError) {
    console.warn("Avatar upload failed.", { message: uploadError.message });
    redirect(profilePath({ error: FLASH.avatarUploadFailed }));
  }

  const { data } = supabase.storage.from("profile-avatars").getPublicUrl(storagePath);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) {
    console.warn("Avatar URL update failed.", { code: updateError.code });
    redirect(profilePath({ error: FLASH.avatarUploadFailed }));
  }

  revalidatePath("/profile");
  redirect(profilePath({ avatar: "updated" }));
}

export async function changeProfilePassword(formData: FormData) {
  const { supabase } = await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect(profilePath({ error: FLASH.passwordTooShort }));
  }

  if (password !== confirmPassword) {
    redirect(profilePath({ error: FLASH.passwordsDoNotMatch }));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.warn("Password change rejected.", { code: error.code, status: error.status });
    redirect(profilePath({ error: error.code === "weak_password" ? FLASH.passwordTooShort : FLASH.passwordChangeFailed }));
  }

  revalidatePath("/profile");
  redirect(profilePath({ password: "updated" }));
}
