"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";
import {
  cohortSchema,
  enrollmentOverrideSchema,
  manualRewardSchema,
  seasonSchema,
  settingsSchema
} from "@/lib/validators/admin";
import { rewardTierMeta } from "@/lib/domain/rewards";
import { requireAdmin } from "@/server/queries/auth";
import {
  cancelStripePromotionForDiscountCode,
  getRewardSnapshot,
  rewardExpiresAt,
  sendManualRewardEmail,
  sendRewardChangeEmail
} from "@/server/rewards/automation";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function actionLocale(formData: FormData): Locale {
  const locale = readString(formData, "locale");
  return isLocale(locale) ? locale : defaultLocale;
}

function nullable(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formValue(formData: FormData, key: string, fallback: string) {
  return formData.has(key) ? readString(formData, key) : fallback;
}

export async function createSeasonAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);

  const parsed = seasonSchema.safeParse({
    name: readString(formData, "name"),
    start_date: readString(formData, "start_date"),
    end_date: readString(formData, "end_date"),
    convention_name: readString(formData, "convention_name"),
    convention_start_date: readString(formData, "convention_start_date"),
    convention_end_date: readString(formData, "convention_end_date"),
    weekend_pass_value_cad: readString(formData, "weekend_pass_value_cad"),
    all_access_pass_value_cad: readString(formData, "all_access_pass_value_cad"),
    is_active: readBoolean(formData, "is_active")
  });

  if (!parsed.success) redirect(`/${locale}/admin/seasons?error=invalid`);

  const supabase = createServerClient();
  if (parsed.data.is_active) {
    await supabase.from("seasons").update({ is_active: false }).eq("is_active", true);
  }

  const { error } = await supabase.from("seasons").insert({
    ...parsed.data,
    convention_name: nullable(parsed.data.convention_name),
    convention_start_date: nullable(parsed.data.convention_start_date),
    convention_end_date: nullable(parsed.data.convention_end_date)
  });

  if (error) redirect(`/${locale}/admin/seasons?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${locale}/admin/seasons`);
  redirect(`/${locale}/admin/seasons`);
}

export async function setActiveSeasonAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const id = readString(formData, "season_id");
  const supabase = createServerClient();

  await supabase.from("seasons").update({ is_active: false }).eq("is_active", true);
  const { error } = await supabase.from("seasons").update({ is_active: true }).eq("id", id);

  if (error) redirect(`/${locale}/admin/seasons?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/seasons`);
}

export async function updateSeasonAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const id = readString(formData, "season_id");

  const parsed = seasonSchema.safeParse({
    name: readString(formData, "name"),
    start_date: readString(formData, "start_date"),
    end_date: readString(formData, "end_date"),
    convention_name: readString(formData, "convention_name"),
    convention_start_date: readString(formData, "convention_start_date"),
    convention_end_date: readString(formData, "convention_end_date"),
    weekend_pass_value_cad: readString(formData, "weekend_pass_value_cad"),
    all_access_pass_value_cad: readString(formData, "all_access_pass_value_cad"),
    is_active: readBoolean(formData, "is_active")
  });

  if (!parsed.success) redirect(`/${locale}/admin/seasons?error=invalid`);

  const supabase = createServerClient();
  if (parsed.data.is_active) {
    await supabase.from("seasons").update({ is_active: false }).eq("is_active", true);
  }

  const { error } = await supabase
    .from("seasons")
    .update({
      ...parsed.data,
      convention_name: nullable(parsed.data.convention_name),
      convention_start_date: nullable(parsed.data.convention_start_date),
      convention_end_date: nullable(parsed.data.convention_end_date)
    })
    .eq("id", id);

  if (error) redirect(`/${locale}/admin/seasons?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/seasons`);
}

export async function createCohortAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);

  const locationName = readString(formData, "location_name");
  const locationAddressRaw = readString(formData, "location_address");
  const locationAddress = locationAddressRaw || locationName || "TBD";
  const parsed = cohortSchema.safeParse({
    season_id: readString(formData, "season_id"),
    name: readString(formData, "name"),
    cohort_number: readString(formData, "cohort_number"),
    start_date: readString(formData, "start_date"),
    end_date: readString(formData, "end_date"),
    day_of_week: readString(formData, "day_of_week") || undefined,
    start_time: readString(formData, "start_time"),
    end_time: readString(formData, "end_time"),
    location_name: locationName,
    location_address: locationAddress,
    capacity: readString(formData, "capacity"),
    registration_status: readString(formData, "registration_status") || "closed",
    status: readString(formData, "status") || "draft",
    regular_price_cad: readString(formData, "regular_price_cad") || "297",
    returning_price_cad: readString(formData, "returning_price_cad") || "247",
    description_en: readString(formData, "description_en"),
    description_fr: readString(formData, "description_fr")
  });

  if (!parsed.success) redirect(`/${locale}/admin/cohorts?error=invalid`);

  const supabase = createServerClient();
  const { error } = await supabase.from("cohorts").insert({
    ...parsed.data,
    day_of_week: parsed.data.day_of_week ?? null,
    description_en: nullable(parsed.data.description_en),
    description_fr: nullable(parsed.data.description_fr)
  });

  if (error) redirect(`/${locale}/admin/cohorts?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${locale}/admin/cohorts`);
  redirect(`/${locale}/admin/cohorts`);
}

export async function updateCohortAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const id = readString(formData, "cohort_id");
  const supabase = createServerClient();

  const { data: existing } = await supabase.from("cohorts").select("*").eq("id", id).maybeSingle();
  if (!existing) redirect(`/${locale}/admin/cohorts?error=not-found`);

  const locationName = formValue(formData, "location_name", existing.location_name);
  const locationAddressInput = formData.has("location_address")
    ? readString(formData, "location_address")
    : existing.location_address;
  const locationAddress = locationAddressInput || locationName || "TBD";
  const parsed = cohortSchema.safeParse({
    season_id: formValue(formData, "season_id", existing.season_id),
    name: formValue(formData, "name", existing.name),
    cohort_number: formValue(formData, "cohort_number", String(existing.cohort_number)),
    start_date: formValue(formData, "start_date", existing.start_date),
    end_date: formValue(formData, "end_date", existing.end_date),
    day_of_week: formData.has("day_of_week")
      ? readString(formData, "day_of_week") || undefined
      : (existing.day_of_week ?? undefined),
    start_time: formValue(formData, "start_time", existing.start_time),
    end_time: formValue(formData, "end_time", existing.end_time),
    location_name: locationName,
    location_address: locationAddress,
    capacity: formValue(formData, "capacity", String(existing.capacity)),
    registration_status: formValue(formData, "registration_status", existing.registration_status),
    status: formValue(formData, "status", existing.status),
    regular_price_cad: formValue(formData, "regular_price_cad", String(existing.regular_price_cad)),
    returning_price_cad: formValue(
      formData,
      "returning_price_cad",
      String(existing.returning_price_cad)
    ),
    description_en: formValue(formData, "description_en", existing.description_en ?? ""),
    description_fr: formValue(formData, "description_fr", existing.description_fr ?? "")
  });

  if (!parsed.success) redirect(`/${locale}/admin/cohorts?error=invalid`);

  const { error } = await supabase
    .from("cohorts")
    .update({
      ...parsed.data,
      day_of_week: parsed.data.day_of_week ?? null,
      description_en: nullable(parsed.data.description_en),
      description_fr: nullable(parsed.data.description_fr)
    })
    .eq("id", id);

  if (error) redirect(`/${locale}/admin/cohorts?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/cohorts`);
}

export async function markAttendanceAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const attendanceId = readString(formData, "attendance_id");
  const status = readString(formData, "status");
  const notes = readString(formData, "notes");
  const cohortId = readString(formData, "cohort_id");
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("attendance")
    .update({
      status: status as any,
      notes: nullable(notes),
      marked_by: user?.id ?? null,
      marked_at: new Date().toISOString()
    })
    .eq("id", attendanceId);

  if (error) redirect(`/${locale}/admin/attendance?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${locale}/admin/attendance`);
  if (cohortId) revalidatePath(`/${locale}/admin/attendance/${cohortId}`);
}

export async function bulkMarkAttendanceAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const cohortId = readString(formData, "cohort_id");
  const sessionId = readString(formData, "cohort_session_id");
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const entries = Array.from(formData.entries()).filter(([key]) => key.startsWith("status:"));
  const updates = entries.map(([key, value]) => {
    const attendanceId = key.replace("status:", "");
    const notes = formData.get(`notes:${attendanceId}`);
    return supabase
      .from("attendance")
      .update({
        status: value as any,
        notes: typeof notes === "string" ? nullable(notes) : null,
        marked_by: user?.id ?? null,
        marked_at: new Date().toISOString()
      })
      .eq("id", attendanceId);
  });

  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    redirect(`/${locale}/admin/attendance?error=${encodeURIComponent(firstError.message)}`);
  }

  revalidatePath(`/${locale}/admin/attendance`);
  if (cohortId) revalidatePath(`/${locale}/admin/attendance/${cohortId}`);
  redirect(
    cohortId
      ? `/${locale}/admin/attendance/${cohortId}${sessionId ? `?session=${sessionId}` : ""}`
      : `/${locale}/admin/attendance`
  );
}

export async function overrideEnrollmentAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);

  const parsed = enrollmentOverrideSchema.safeParse({
    enrollment_id: readString(formData, "enrollment_id"),
    completion_status: readString(formData, "completion_status") || undefined,
    enrollment_status: readString(formData, "enrollment_status") || undefined,
    payment_status: readString(formData, "payment_status") || undefined,
    admin_notes: readString(formData, "admin_notes")
  });

  if (!parsed.success) redirect(`/${locale}/admin/enrollments?error=invalid`);

  const updates: Record<string, unknown> = {
    admin_notes: nullable(parsed.data.admin_notes)
  };
  if (parsed.data.completion_status) {
    updates.completion_status = parsed.data.completion_status;
    updates.completion_overridden = true;
    if (parsed.data.completion_status === "completed") updates.enrollment_status = "completed";
  }
  if (parsed.data.enrollment_status) updates.enrollment_status = parsed.data.enrollment_status;
  if (parsed.data.payment_status) updates.payment_status = parsed.data.payment_status;

  const supabase = createServerClient();
  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id,dancer_id,season_id")
    .eq("id", parsed.data.enrollment_id)
    .maybeSingle();
  const beforeReward = existingEnrollment
    ? await getRewardSnapshot(supabase, existingEnrollment.dancer_id, existingEnrollment.season_id)
    : null;

  const { error } = await supabase
    .from("enrollments")
    .update(updates as any)
    .eq("id", parsed.data.enrollment_id);

  if (error) redirect(`/${locale}/admin/enrollments?error=${encodeURIComponent(error.message)}`);
  if (existingEnrollment) {
    await sendRewardChangeEmail({
      supabase,
      dancerId: existingEnrollment.dancer_id,
      seasonId: existingEnrollment.season_id,
      before: beforeReward
    });
  }
  revalidatePath(`/${locale}/admin/enrollments`);
  redirect(`/${locale}/admin/enrollments`);
}

export async function manuallyGrantReturningEligibilityAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const dancerId = readString(formData, "dancer_id");
  const reason = readString(formData, "reason");
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("returning_price_overrides").insert({
    dancer_id: dancerId,
    granted_by: user?.id ?? null,
    reason: nullable(reason)
  });

  if (error) redirect(`/${locale}/admin/dancers?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${locale}/admin/dancers`);
  revalidatePath(`/${locale}/admin/dancers/${dancerId}`);
}

export async function manuallyGrantRewardAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const parsed = manualRewardSchema.safeParse({
    dancer_id: readString(formData, "dancer_id"),
    season_id: readString(formData, "season_id"),
    tier: readString(formData, "tier"),
    admin_notes: readString(formData, "admin_notes")
  });

  if (!parsed.success) redirect(`/${locale}/admin/rewards?error=invalid`);

  const meta = rewardTierMeta[parsed.data.tier];
  const supabase = createServerClient();
  const beforeReward = await getRewardSnapshot(
    supabase,
    parsed.data.dancer_id,
    parsed.data.season_id
  );
  if (beforeReward?.status === "generated" && beforeReward.discount_code_id) {
    await cancelStripePromotionForDiscountCode(supabase, beforeReward.discount_code_id);
  }

  const { data: season } = await supabase
    .from("seasons")
    .select("convention_end_date")
    .eq("id", parsed.data.season_id)
    .maybeSingle();
  const { error } = await supabase.from("dancer_rewards").upsert(
    {
      dancer_id: parsed.data.dancer_id,
      season_id: parsed.data.season_id,
      tier: parsed.data.tier,
      status: "unlocked",
      cohorts_completed_count: meta.cohortsRequired,
      unlocked_at: new Date().toISOString(),
      generated_at: null,
      redeemed_at: null,
      discount_code_id: null,
      expires_at: rewardExpiresAt(season?.convention_end_date ?? null),
      manually_granted: true,
      admin_notes: nullable(parsed.data.admin_notes)
    },
    { onConflict: "dancer_id,season_id" }
  );

  if (error) redirect(`/${locale}/admin/rewards?error=${encodeURIComponent(error.message)}`);
  await sendManualRewardEmail({
    supabase,
    dancerId: parsed.data.dancer_id,
    tier: parsed.data.tier
  });
  revalidatePath(`/${locale}/admin/rewards`);
  redirect(`/${locale}/admin/rewards`);
}

export async function markCodeRedeemedAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const codeId = readString(formData, "code_id");
  const now = new Date().toISOString();
  const supabase = createServerClient();

  const { error } = await supabase
    .from("discount_codes")
    .update({ status: "used", used_at: now })
    .eq("id", codeId);

  if (!error) {
    await supabase
      .from("dancer_rewards")
      .update({ status: "redeemed", redeemed_at: now })
      .eq("discount_code_id", codeId);
  }

  if (error) redirect(`/${locale}/admin/discount-codes?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${locale}/admin/discount-codes`);
  revalidatePath(`/${locale}/admin/rewards`);
  redirect(`/${locale}/admin/discount-codes`);
}

export async function updateSettingsAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const parsed = settingsSchema.safeParse({
    regular_price_cad: readString(formData, "regular_price_cad"),
    returning_price_cad: readString(formData, "returning_price_cad"),
    completion_min_attendance: readString(formData, "completion_min_attendance"),
    max_video_size_mb: readString(formData, "max_video_size_mb"),
    stripe_regular_price_id: readString(formData, "stripe_regular_price_id"),
    stripe_returning_price_id: readString(formData, "stripe_returning_price_id"),
    legacy_pass_uses_stripe: readBoolean(formData, "legacy_pass_uses_stripe")
  });

  if (!parsed.success) redirect(`/${locale}/admin/settings?error=invalid`);

  const supabase = createServerClient();
  const { error } = await supabase
    .from("system_settings")
    .update({
      ...parsed.data,
      stripe_regular_price_id: nullable(parsed.data.stripe_regular_price_id),
      stripe_returning_price_id: nullable(parsed.data.stripe_returning_price_id)
    })
    .eq("id", 1);

  if (error) redirect(`/${locale}/admin/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/settings`);
}
