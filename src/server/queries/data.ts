import { cache } from "react";

import { hasSupabaseEnv } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentDancer } from "@/server/queries/auth";

export const getActiveSeason = cache(async () => {
  if (!hasSupabaseEnv()) return null;
  const supabase = createServerClient();
  const { data } = await supabase.from("seasons").select("*").eq("is_active", true).maybeSingle();
  return data;
});

export const getSeasons = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .order("start_date", { ascending: false });
  return data ?? [];
});

export const getCohorts = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("cohorts")
    .select("*, seasons(name)")
    .order("start_date", { ascending: false });
  return data ?? [];
});

export const getOpenCohorts = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("cohorts")
    .select("*")
    .in("status", ["open", "active"])
    .order("start_date", { ascending: true });
  return data ?? [];
});

export const getSettings = cache(async () => {
  if (!hasSupabaseEnv()) return null;
  const supabase = createServerClient();
  const { data } = await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle();
  return data;
});

export const getAdminDashboard = cache(async () => {
  if (!hasSupabaseEnv()) {
    return { registered: 0, paid: 0, rewards: 0, videos: 0, revenue: 0 };
  }
  const supabase = createServerClient();
  const { count: registered } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true });
  const { data: paidRows } = await supabase
    .from("enrollments")
    .select("price_paid_cad")
    .eq("payment_status", "paid");
  const { count: rewards } = await supabase
    .from("dancer_rewards")
    .select("id", { count: "exact", head: true })
    .in("status", ["unlocked", "generated"]);
  const { count: videos } = await supabase
    .from("video_uploads")
    .select("id", { count: "exact", head: true });

  return {
    registered: registered ?? 0,
    paid: paidRows?.length ?? 0,
    rewards: rewards ?? 0,
    videos: videos ?? 0,
    revenue: paidRows?.reduce((total, row) => total + row.price_paid_cad, 0) ?? 0
  };
});

export const getDancersForAdmin = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("dancers")
    .select(
      "*, profiles(email,language_pref), enrollments(id,payment_status,completion_status,price_paid_cad), dancer_rewards(tier,status,cohorts_completed_count)"
    )
    .order("last_name", { ascending: true });
  return data ?? [];
});

export const getEnrollmentsForAdmin = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*, dancers(first_name,last_name,profiles(email)), cohorts(name,start_date)")
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getAttendanceForAdmin = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("attendance")
    .select(
      "*, enrollments(dancers(first_name,last_name), cohorts(name)), cohort_sessions(session_number,session_date)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
});

export const getRewardsForAdmin = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("dancer_rewards")
    .select(
      "*, dancers(first_name,last_name,profiles(email)), seasons(name), discount_codes(code,status)"
    )
    .order("updated_at", { ascending: false });
  return data ?? [];
});

export const getDiscountCodesForAdmin = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("*, dancers(first_name,last_name,profiles(email)), seasons(name)")
    .order("issued_at", { ascending: false });
  return data ?? [];
});

export const getVideosForAdmin = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("video_uploads")
    .select(
      "*, dancers(first_name,last_name,profiles(email)), cohorts(name), cohort_sessions(session_number)"
    )
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getStudentPortalData = cache(async () => {
  if (!hasSupabaseEnv()) return null;
  const dancer = await getCurrentDancer();
  if (!dancer) return null;
  const supabase = createServerClient();

  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  const { data: paidEnrollments } = await supabase
    .from("enrollments")
    .select("*, cohorts(*, cohort_sessions(*), resources(*))")
    .eq("dancer_id", dancer.id)
    .eq("payment_status", "paid")
    .in("enrollment_status", ["registered", "completed"])
    .order("created_at", { ascending: false });
  const { data: reward } = activeSeason
    ? await supabase
        .from("dancer_rewards")
        .select("*, discount_codes(*)")
        .eq("dancer_id", dancer.id)
        .eq("season_id", activeSeason.id)
        .maybeSingle()
    : { data: null };
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, cohorts(name,start_date,end_date)")
    .eq("dancer_id", dancer.id)
    .order("created_at", { ascending: false });
  const { data: videos } = await supabase
    .from("video_uploads")
    .select("*, cohorts(name), cohort_sessions(session_number)")
    .eq("dancer_id", dancer.id)
    .order("created_at", { ascending: false });
  const { data: nextCohort } = await supabase
    .from("cohorts")
    .select("*")
    .eq("status", "open")
    .eq("registration_status", "open")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const currentEnrollment =
    paidEnrollments
      ?.map((enrollment) => ({
        enrollment,
        cohort: Array.isArray(enrollment.cohorts) ? enrollment.cohorts[0] : enrollment.cohorts
      }))
      .filter(({ cohort }) => cohort && !["completed", "cancelled"].includes(cohort.status))
      .sort((a, b) => a.cohort.start_date.localeCompare(b.cohort.start_date))[0]?.enrollment ??
    paidEnrollments?.[0] ??
    null;

  return {
    dancer,
    activeSeason,
    currentEnrollment,
    reward,
    enrollments: enrollments ?? [],
    videos: videos ?? [],
    nextCohort
  };
});
