import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { defaultLocale, type Locale } from "@/i18n/routing";
import { getDemoRoleOverride, isDemoBypassEnabled } from "@/lib/demo-bypass";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const demoUser: Pick<User, "id" | "email" | "app_metadata" | "user_metadata" | "aud"> = {
  id: "demo-user-vision-labs",
  email: "demo@visionlabs.local",
  aud: "authenticated",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "Demo Reviewer" }
};

const demoProfile: Database["public"]["Tables"]["profiles"]["Row"] = {
  id: demoUser.id,
  email: demoUser.email ?? "demo@visionlabs.local",
  role: "student",
  language_pref: "en",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z"
};

const demoDancer: Database["public"]["Tables"]["dancers"]["Row"] = {
  id: "demo-dancer-vision-labs",
  profile_id: demoUser.id,
  first_name: "Demo",
  last_name: "Reviewer",
  phone: "555-000-0000",
  instagram_handle: "visionlabsdemo",
  date_of_birth: "2000-01-01",
  emergency_contact_name: "Demo Contact",
  emergency_contact_phone: "555-000-0001",
  guardian_name: null,
  guardian_email: null,
  guardian_phone: null,
  avatar_storage_path: null,
  internal_notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z"
};

export const getSessionUser = cache(async () => {
  if (isDemoBypassEnabled()) {
    return demoUser as User;
  }

  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentProfile = cache(async () => {
  if (isDemoBypassEnabled()) {
    return {
      ...demoProfile,
      role: getDemoRoleOverride() ?? demoProfile.role
    };
  }

  const user = await getSessionUser();
  if (!user) return null;

  const supabase = createServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

export const getCurrentDancer = cache(async () => {
  if (isDemoBypassEnabled()) {
    return demoDancer;
  }

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
