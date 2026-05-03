"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";
import { profileSchema, signInSchema, signUpSchema } from "@/lib/validators/auth";

function cleanOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    locale: formValue(formData, "locale") || defaultLocale,
    cohort: formValue(formData, "cohort") || undefined
  });

  if (!parsed.success) {
    redirect(`/${defaultLocale}/signup?error=invalid`);
  }

  const cohortQuery = parsed.data.cohort ? `&cohort=${encodeURIComponent(parsed.data.cohort)}` : "";

  const supabase = createServerClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/${parsed.data.locale}/portal/profile/complete`
    }
  });

  if (error) {
    redirect(`/${parsed.data.locale}/signup?error=${encodeURIComponent(error.message)}${cohortQuery}`);
  }

  redirect(`/${parsed.data.locale}/portal/profile/complete${cohortQuery ? `?${cohortQuery.slice(1)}` : ""}`);
}

export async function signInAction(formData: FormData) {
  const locale = formValue(formData, "locale");
  const parsed = signInSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    next: formValue(formData, "next")
  });

  const resolvedLocale = isLocale(locale) ? locale : defaultLocale;

  if (!parsed.success) {
    redirect(`/${resolvedLocale}/login?error=invalid`);
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    redirect(`/${resolvedLocale}/login?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${resolvedLocale}/login?error=session`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, language_pref")
    .eq("id", user.id)
    .maybeSingle();

  const targetLocale = profile?.language_pref ?? resolvedLocale;
  const next = parsed.data.next?.startsWith(`/${targetLocale}`) ? parsed.data.next : null;

  if (next) {
    redirect(next);
  }

  redirect(profile?.role === "admin" ? `/${targetLocale}/admin` : `/${targetLocale}/portal/dashboard`);
}

export async function signOutAction() {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  redirect(`/${defaultLocale}`);
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = formValue(formData, "email");
  const locale = formValue(formData, "locale");
  const resolvedLocale = isLocale(locale) ? locale : defaultLocale;
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = createServerClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/${resolvedLocale}/portal/profile`
  });

  redirect(`/${resolvedLocale}/forgot-password?sent=1`);
}

export async function updateLanguagePrefAction(locale: Locale) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("profiles").update({ language_pref: locale }).eq("id", user.id);
  revalidatePath("/", "layout");
}

export async function updateDancerProfileAction(formData: FormData) {
  const localeValue = formValue(formData, "language_pref");
  const locale = isLocale(localeValue) ? localeValue : defaultLocale;
  const parsed = profileSchema.safeParse({
    first_name: formValue(formData, "first_name"),
    last_name: formValue(formData, "last_name"),
    phone: formValue(formData, "phone"),
    instagram_handle: formValue(formData, "instagram_handle"),
    date_of_birth: formValue(formData, "date_of_birth"),
    emergency_contact_name: formValue(formData, "emergency_contact_name"),
    emergency_contact_phone: formValue(formData, "emergency_contact_phone"),
    guardian_name: formValue(formData, "guardian_name"),
    guardian_email: formValue(formData, "guardian_email"),
    guardian_phone: formValue(formData, "guardian_phone"),
    language_pref: locale
  });

  if (!parsed.success) {
    redirect(`/${locale}/portal/profile/complete?error=invalid`);
  }

  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  await supabase.from("profiles").update({ language_pref: parsed.data.language_pref }).eq("id", user.id);

  const payload = {
    profile_id: user.id,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    phone: cleanOptional(parsed.data.phone),
    instagram_handle: cleanOptional(parsed.data.instagram_handle),
    date_of_birth: cleanOptional(parsed.data.date_of_birth),
    emergency_contact_name: cleanOptional(parsed.data.emergency_contact_name),
    emergency_contact_phone: cleanOptional(parsed.data.emergency_contact_phone),
    guardian_name: cleanOptional(parsed.data.guardian_name),
    guardian_email: cleanOptional(parsed.data.guardian_email),
    guardian_phone: cleanOptional(parsed.data.guardian_phone)
  };

  const { error } = await supabase.from("dancers").upsert(payload, { onConflict: "profile_id" });

  if (error) {
    redirect(`/${locale}/portal/profile/complete?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}/portal`, "layout");
  redirect(`/${locale}/portal/dashboard`);
}
