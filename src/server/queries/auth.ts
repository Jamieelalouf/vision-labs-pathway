import { cache } from "react";
import { redirect } from "next/navigation";

import { defaultLocale, type Locale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";

export const getSessionUser = cache(async () => {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = createServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

export const getCurrentDancer = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = createServerClient();
  const { data } = await supabase.from("dancers").select("*").eq("profile_id", user.id).maybeSingle();
  return data;
});

export async function requireUser(locale: Locale = defaultLocale) {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }
  return user;
}

export async function requireAdmin(locale: Locale = defaultLocale) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${locale}/login`);
  }

  if (profile.role !== "admin") {
    redirect(`/${locale}/portal/dashboard`);
  }

  return profile;
}

export async function requireCompleteDancerProfile(locale: Locale = defaultLocale) {
  await requireUser(locale);
  const dancer = await getCurrentDancer();
  if (!dancer) {
    redirect(`/${locale}/portal/profile/complete`);
  }
  return dancer;
}
