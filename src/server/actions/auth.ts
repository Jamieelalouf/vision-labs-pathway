"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";
import { profileSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validators/auth";

function cleanOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signUpAction(formData: FormData) {
  const cohortId = formValue(formData, "cohort");
  const cohortQuery = cohortId ? `?cohort=${encodeURIComponent(cohortId)}` : "";
  const parsed = signUpSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    locale: formValue(formData, "locale") || defaultLocale
  });

  if (!parsed.success) {
    redirect(`/${defaultLocale}/signup?error=invalid`);
  }

  const supabase = createServerClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/${parsed.data.locale}/portal/profile/complete${cohortQuery}`
    }
  });

  if (error) {
    const separator = cohortQuery ? "&" : "?";
    redirect(
      `/${parsed.data.locale}/signup${cohortQuery}${separator}error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(`/${parsed.data.locale}/portal/profile/complete${cohortQuery}`);
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
  const nextValue = parsed.data.next;
  const localeRoot = `/${targetLocale}`;
  const next = nextValue === localeRoot || nextValue?.startsWith(`${localeRoot}/`) ? nextValue : null;

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

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/${resolvedLocale}/reset-password`
  });

  if (error) {
    redirect(`/${resolvedLocale}/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${resolvedLocale}/forgot-password?sent=1`);
}

export async function updatePasswordAction(formData: FormData) {
  const locale = formValue(formData, "locale");
  const resolvedLocale = isLocale(locale) ? locale : defaultLocale;
  const parsed = resetPasswordSchema.safeParse({
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword")
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid password input.";
    redirect(`/${resolvedLocale}/reset-password?error=${encodeURIComponent(message)}`);
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    redirect(`/${resolvedLocale}/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect(`/${resolvedLocale}/login?reset=1`);
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

export async function updateDancerProfileAction(
  _prevState: { ok: boolean; message: string },
  formData: FormData
) {
  const actionState = {
    ok: false,
    message: ""
  };
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
    return { ...actionState, message: "Please check your profile details and try again." };
  }

  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...actionState, message: "Your session expired. Please sign in again." };
  }

  await supabase.from("profiles").update({ language_pref: parsed.data.language_pref }).eq("id", user.id);

  const payload = {
    profile_id: user.id,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    phone: cleanOptional(parsed.data.phone),
    instagram_handle: cleanOptional(parsed.data.instagram_handle),
    date_of_birth: cleanOptional(parsed.data.date_of_birth)
  };

  // `formData.has(...)` preserves existing legacy values when edit mode omits hidden fields.
  if (formData.has("emergency_contact_name")) {
    Object.assign(payload, {
      emergency_contact_name: cleanOptional(parsed.data.emergency_contact_name)
    });
  }
  if (formData.has("emergency_contact_phone")) {
    Object.assign(payload, {
      emergency_contact_phone: cleanOptional(parsed.data.emergency_contact_phone)
    });
  }
  if (formData.has("guardian_name")) {
    Object.assign(payload, {
      guardian_name: cleanOptional(parsed.data.guardian_name)
    });
  }
  if (formData.has("guardian_email")) {
    Object.assign(payload, {
      guardian_email: cleanOptional(parsed.data.guardian_email)
    });
  }
  if (formData.has("guardian_phone")) {
    Object.assign(payload, {
      guardian_phone: cleanOptional(parsed.data.guardian_phone)
    });
  }

  const { error } = await supabase.from("dancers").upsert(payload, { onConflict: "profile_id" });

  if (error) {
    console.error("dancers upsert failed:", error.message);
    return { ...actionState, message: "Could not save profile right now. Please try again." };
  }

  revalidatePath(`/${locale}/portal`, "layout");
  return {
    ok: true,
    message: "Profile saved."
  };
}

export async function updateDancerAvatarStoragePathAction(formData: FormData) {
  const localeValue = formValue(formData, "language_pref");
  const locale = isLocale(localeValue) ? localeValue : defaultLocale;
  const avatarStoragePath = cleanOptional(formValue(formData, "avatar_storage_path"));

  if (!avatarStoragePath) {
    return { ok: false, message: "Missing avatar path." };
  }

  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("dancers")
    .update({ avatar_storage_path: avatarStoragePath })
    .eq("profile_id", user.id);

  if (error) {
    console.error("dancers avatar update failed:", error.message);
    return { ok: false, message: "Could not save profile photo right now. Please try again." };
  }

  revalidatePath(`/${locale}/portal`, "layout");
  return { ok: true, message: "Profile photo saved." };
}
