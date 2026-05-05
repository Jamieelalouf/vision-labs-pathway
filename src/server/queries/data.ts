import { cache } from "react";

import { isDemoBypassEnabled } from "@/lib/demo-bypass";
import { hasSupabaseEnv } from "@/lib/env";
import type { RewardStatus, RewardTier } from "@/lib/supabase/database.types";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentDancer } from "@/server/queries/auth";

type EnrollmentWithCohort = {
  id: string;
  completion_status?: string;
  [key: string]: unknown;
  cohorts:
    | {
        id: string;
        name?: string;
        start_date: string;
        end_date: string;
        status: string;
        cohort_sessions?: unknown[];
        resources?: unknown[];
        location_name?: string | null;
        location_address?: string | null;
        [key: string]: unknown;
      }
    | {
        id: string;
        name?: string;
        start_date: string;
        end_date: string;
        status: string;
        cohort_sessions?: unknown[];
        resources?: unknown[];
        location_name?: string | null;
        location_address?: string | null;
        [key: string]: unknown;
      }[]
    | null;
};

type CohortShape = {
  id: string;
  name?: string;
  start_date: string;
  end_date: string;
  status: string;
};

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseDateToMillis(value?: string | null) {
  if (!value) return Number.NEGATIVE_INFINITY;
  return new Date(value).getTime();
}

function pickCurrentEnrollment(enrollments: EnrollmentWithCohort[]) {
  const today = new Date().toISOString().slice(0, 10);
  const usable: { enrollment: EnrollmentWithCohort; cohort: CohortShape }[] = [];
  for (const enrollment of enrollments) {
    const cohort = asSingle(enrollment.cohorts) as CohortShape | null;
    if (!cohort) continue;
    if (["completed", "cancelled"].includes(cohort.status)) continue;
    usable.push({ enrollment, cohort });
  }

  const currentlyRunning = usable
    .filter(({ cohort }) => cohort.start_date <= today && cohort.end_date >= today)
    .sort((a, b) => parseDateToMillis(b.cohort.start_date) - parseDateToMillis(a.cohort.start_date));
  if (currentlyRunning.length) return currentlyRunning[0].enrollment;

  const upcoming = usable
    .filter(({ cohort }) => cohort.start_date > today)
    .sort((a, b) => parseDateToMillis(a.cohort.start_date) - parseDateToMillis(b.cohort.start_date));
  if (upcoming.length) return upcoming[0].enrollment;

  const activeOrOpen = usable
    .filter(({ cohort }) => cohort.status === "active" || cohort.status === "open")
    .sort((a, b) => parseDateToMillis(b.cohort.start_date) - parseDateToMillis(a.cohort.start_date));
  if (activeOrOpen.length) return activeOrOpen[0].enrollment;

  const latestStarted = usable.sort(
    (a, b) => parseDateToMillis(b.cohort.start_date) - parseDateToMillis(a.cohort.start_date)
  );
  return latestStarted[0]?.enrollment ?? null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
) {
  if (!items.length) return [] as R[];
  const results = new Array<R>(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

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

async function addSignedVideoUrls<T extends { source?: string; storage_path?: string | null }>(
  supabase: ReturnType<typeof createServerClient>,
  videos: T[]
) {
  return mapWithConcurrency(videos, 8, async (video) => {
      if (video.source !== "upload" || !video.storage_path) {
        return { ...video, signed_url: null };
      }

      const { data } = await supabase.storage
        .from("dancer-videos")
        .createSignedUrl(video.storage_path, 60 * 60);

      return { ...video, signed_url: data?.signedUrl ?? null };
    });
}

export const getAdminDashboard = cache(async () => {
  if (!hasSupabaseEnv()) {
    return {
      registered: 0,
      paid: 0,
      rewards: 0,
      videos: 0,
      revenue: 0,
      currentCohortRevenue: 0,
      currentCohortRegistered: 0,
      currentCohortPaid: 0,
      newCount: 0,
      returningCount: 0,
      activeSeason: null,
      activeCohort: null,
      nearLegacy: [],
      recentVideos: [],
      pendingActions: 0
    };
  }
  const supabase = createServerClient();
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  const { data: activeCohorts } = await supabase
    .from("cohorts")
    .select("*")
    .in("status", ["active", "open"])
    .order("status", { ascending: true })
    .order("start_date", { ascending: true })
    .limit(1);
  const activeCohort = activeCohorts?.[0] ?? null;
  const { count: registered } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true });
  const { data: paidRows } = await supabase
    .from("enrollments")
    .select("price_paid_cad,price_type,cohort_id")
    .eq("payment_status", "paid");
  const currentCohortPaidRows = activeCohort
    ? (paidRows?.filter((row) => row.cohort_id === activeCohort.id) ?? [])
    : [];
  const { count: currentCohortRegistered } = activeCohort
    ? await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("cohort_id", activeCohort.id)
        .in("enrollment_status", ["pending", "registered", "completed"])
    : { count: 0 };
  const { count: rewards } = await supabase
    .from("dancer_rewards")
    .select("id", { count: "exact", head: true })
    .in("status", ["unlocked", "generated"]);
  const { count: videos } = await supabase
    .from("video_uploads")
    .select("id", { count: "exact", head: true });
  const { data: nearLegacy } = await supabase
    .from("dancer_rewards")
    .select("*, dancers(first_name,last_name,profiles(email)), seasons(name)")
    .eq("cohorts_completed_count", 4)
    .limit(8);
  const { data: recentVideos } = await supabase
    .from("video_uploads")
    .select("*, dancers(first_name,last_name), cohorts(name)")
    .order("created_at", { ascending: false })
    .limit(10);
  const { count: pendingActions } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .or("payment_status.in.(failed,refunded),enrollment_status.in.(dropped,refunded)");

  const signedRecentVideos = await addSignedVideoUrls(supabase, recentVideos ?? []);

  return {
    registered: registered ?? 0,
    paid: paidRows?.length ?? 0,
    rewards: rewards ?? 0,
    videos: videos ?? 0,
    revenue: paidRows?.reduce((total, row) => total + row.price_paid_cad, 0) ?? 0,
    currentCohortRevenue:
      currentCohortPaidRows.reduce((total, row) => total + row.price_paid_cad, 0) ?? 0,
    currentCohortRegistered: currentCohortRegistered ?? 0,
    currentCohortPaid: currentCohortPaidRows.length,
    newCount: currentCohortPaidRows.filter((row) => row.price_type === "regular").length,
    returningCount: currentCohortPaidRows.filter((row) => row.price_type !== "regular").length,
    activeSeason,
    activeCohort,
    nearLegacy: nearLegacy ?? [],
    recentVideos: signedRecentVideos,
    pendingActions: pendingActions ?? 0
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

export const getDancerForAdmin = cache(async (id: string) => {
  if (!hasSupabaseEnv()) return null;
  const supabase = createServerClient();
  const { data } = await supabase
    .from("dancers")
    .select(
      "*, profiles(email,language_pref,created_at), enrollments(*, cohorts(name,start_date,end_date)), dancer_rewards(*, seasons(name), discount_codes(code,status)), video_uploads(*, cohorts(name), cohort_sessions(session_number))"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const { data: returningOverrides } = await supabase
    .from("returning_price_overrides")
    .select("*")
    .eq("dancer_id", id)
    .order("created_at", { ascending: false });

  const signedVideos = await addSignedVideoUrls(supabase, (data as any).video_uploads ?? []);

  return {
    ...data,
    video_uploads: signedVideos,
    returning_price_overrides: returningOverrides ?? []
  };
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

export const getAttendanceCohortsForAdmin = cache(async () => {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("cohorts")
    .select("*, cohort_sessions(*), enrollments(id,payment_status,enrollment_status)")
    .neq("status", "draft")
    .order("start_date", { ascending: false });
  return data ?? [];
});

export const getAttendanceForCohortAdmin = cache(async (cohortId: string) => {
  if (!hasSupabaseEnv()) return null;
  const supabase = createServerClient();
  const { data: cohort } = await supabase
    .from("cohorts")
    .select("*, cohort_sessions(*)")
    .eq("id", cohortId)
    .maybeSingle();
  if (!cohort) return null;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, dancers(first_name,last_name,profiles(email)), attendance(*)")
    .eq("cohort_id", cohortId)
    .eq("payment_status", "paid")
    .in("enrollment_status", ["registered", "completed"])
    .order("created_at", { ascending: true });

  return {
    cohort,
    sessions: [...(cohort.cohort_sessions ?? [])].sort(
      (a, b) => a.session_number - b.session_number
    ),
    enrollments: enrollments ?? []
  };
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
  return addSignedVideoUrls(supabase, data ?? []);
});

export const getStudentPortalData = cache(async () => {
  if (isDemoBypassEnabled()) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 35);
    const seasonStart = new Date(now.getFullYear(), 0, 1);
    const seasonEnd = new Date(now.getFullYear(), 11, 31);

    const cohortId = "demo-cohort-1";
    const session1Date = new Date(now);
    session1Date.setDate(session1Date.getDate() - 2);
    const session2Date = new Date(now);
    session2Date.setDate(session2Date.getDate() + 5);
    const session3Date = new Date(now);
    session3Date.setDate(session3Date.getDate() + 12);

    return {
      dancer: {
        id: "demo-dancer-vision-labs",
        profile_id: "demo-user-vision-labs",
        first_name: "Demo",
        last_name: "Reviewer",
        phone: "555-000-0000"
      },
      activeSeason: {
        id: "demo-season-2026",
        name: `Season ${now.getFullYear()}`,
        start_date: seasonStart.toISOString().slice(0, 10),
        end_date: seasonEnd.toISOString().slice(0, 10),
        is_active: true
      },
      currentEnrollment: {
        id: "demo-enrollment-1",
        dancer_id: "demo-dancer-vision-labs",
        cohort_id: cohortId,
        season_id: "demo-season-2026",
        payment_status: "paid",
        enrollment_status: "registered",
        completion_status: "incomplete",
        price_paid_cad: 199,
        created_at: now.toISOString(),
        cohorts: {
          id: cohortId,
          name: "VISION LABS Cohort One",
          start_date: startDate.toISOString().slice(0, 10),
          end_date: endDate.toISOString().slice(0, 10),
          status: "active",
          location_name: "Demo Studio",
          location_address: "123 Demo St, Toronto",
          cohort_sessions: [
            {
              id: "demo-session-1",
              session_number: 1,
              session_date: session1Date.toISOString().slice(0, 10),
              start_time: "18:00:00",
              end_time: "20:00:00",
              theme_en: "Foundation & Texture",
              notes_en: "Bring water and review your baseline phrase."
            },
            {
              id: "demo-session-2",
              session_number: 2,
              session_date: session2Date.toISOString().slice(0, 10),
              start_time: "18:00:00",
              end_time: "20:00:00",
              theme_en: "Musicality & Groove",
              notes_en: "Focus on pocket and transitions."
            },
            {
              id: "demo-session-3",
              session_number: 3,
              session_date: session3Date.toISOString().slice(0, 10),
              start_time: "18:00:00",
              end_time: "20:00:00",
              theme_en: "Performance Lab",
              notes_en: "Film your run-through for review."
            }
          ],
          resources: [
            {
              id: "demo-resource-1",
              url: "https://example.com/playlist",
              title_en: "Warmup Playlist",
              description_en: "Use before each practice block."
            }
          ]
        }
      },
      reward: {
        id: "demo-reward-1",
        dancer_id: "demo-dancer-vision-labs",
        season_id: "demo-season-2026",
        tier: "member" as RewardTier,
        status: "unlocked" as RewardStatus,
        cohorts_completed_count: 1,
        discount_codes: null
      },
      paidEnrollments: [
        {
          id: "demo-enrollment-1",
          dancer_id: "demo-dancer-vision-labs",
          cohort_id: cohortId,
          season_id: "demo-season-2026",
          payment_status: "paid",
          enrollment_status: "registered",
          completion_status: "incomplete",
          price_paid_cad: 199,
          created_at: now.toISOString(),
          cohorts: {
            id: cohortId,
            name: "VISION LABS Cohort One",
            cohort_sessions: [
              {
                id: "demo-session-1",
                session_number: 1,
                session_date: session1Date.toISOString().slice(0, 10)
              },
              {
                id: "demo-session-2",
                session_number: 2,
                session_date: session2Date.toISOString().slice(0, 10)
              }
            ]
          }
        }
      ],
      enrollments: [
        {
          id: "demo-enrollment-completed-1",
          completion_status: "completed",
          cohorts: {
            id: "demo-completed-cohort-1",
            name: "VISION LABS Cohort Zero",
            end_date: new Date(now.getFullYear(), 1, 24).toISOString().slice(0, 10)
          }
        }
      ],
      videos: [
        {
          id: "demo-video-1",
          dancer_id: "demo-dancer-vision-labs",
          cohort_id: cohortId,
          cohort_session_id: "demo-session-2",
          title: "Week 2 Combo",
          description: "Demo upload entry",
          source: "external_link",
          external_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          storage_path: null,
          signed_url: null,
          created_at: now.toISOString(),
          cohorts: { name: "VISION LABS Cohort One" },
          cohort_sessions: { session_number: 2 }
        }
      ],
      nextCohort: null
    };
  }

  if (!hasSupabaseEnv()) return null;
  const dancer = await getCurrentDancer();
  if (!dancer) return null;
  const supabase = createServerClient();

  const [
    { data: activeSeason },
    { data: paidEnrollments },
    { data: allEnrollments },
    { data: videos },
    { data: nextCohort }
  ] =
    await Promise.all([
      supabase.from("seasons").select("*").eq("is_active", true).maybeSingle(),
      supabase
        .from("enrollments")
        .select("*, cohorts(*, cohort_sessions(*), resources(*))")
        .eq("dancer_id", dancer.id)
        .eq("payment_status", "paid")
        .in("enrollment_status", ["registered", "completed"])
        .order("created_at", { ascending: false }),
      supabase
        .from("enrollments")
        .select("id, completion_status, cohorts(id,name,end_date)")
        .eq("dancer_id", dancer.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("video_uploads")
        .select("*, cohorts(name), cohort_sessions(session_number)")
        .eq("dancer_id", dancer.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("cohorts")
        .select("*")
        .eq("status", "open")
        .eq("registration_status", "open")
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle()
    ]);
  const { data: reward } = activeSeason
    ? await supabase
        .from("dancer_rewards")
        .select("*, discount_codes(*)")
        .eq("dancer_id", dancer.id)
        .eq("season_id", activeSeason.id)
        .maybeSingle()
    : { data: null };
  const typedPaidEnrollments = ((paidEnrollments ?? []) as unknown) as EnrollmentWithCohort[];
  const typedEnrollments = ((allEnrollments ?? []) as unknown) as EnrollmentWithCohort[];
  const currentEnrollment = pickCurrentEnrollment(typedPaidEnrollments);

  const signedVideos = await addSignedVideoUrls(supabase, videos ?? []);

  return {
    dancer,
    activeSeason,
    currentEnrollment,
    reward,
    paidEnrollments: typedPaidEnrollments,
    enrollments: typedEnrollments,
    videos: signedVideos,
    nextCohort
  };
});

export const getEligibleCommunityCohorts = cache(async () => {
  if (isDemoBypassEnabled()) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 35);
    return [
      {
        id: "demo-cohort-1",
        name: "VISION LABS Cohort One",
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
        status: "active"
      }
    ];
  }

  if (!hasSupabaseEnv()) return [];
  const dancer = await getCurrentDancer();
  if (!dancer) return [];
  const supabase = createServerClient();

  const { data } = await supabase
    .from("enrollments")
    .select("cohort_id, cohorts(id,name,start_date,end_date,status)")
    .eq("dancer_id", dancer.id)
    .eq("payment_status", "paid")
    .in("enrollment_status", ["registered", "completed"])
    .order("created_at", { ascending: false });

  type CohortRow = {
    cohorts:
      | { id: string; name: string; start_date: string; end_date: string; status: string }
      | { id: string; name: string; start_date: string; end_date: string; status: string }[]
      | null;
  };
  const map = new Map<string, { id: string; name: string; start_date: string; end_date: string; status: string }>();
  for (const row of ((data ?? []) as unknown as CohortRow[])) {
    const cohort = asSingle(row.cohorts);
    if (cohort?.id && !map.has(cohort.id)) {
      map.set(cohort.id, cohort);
    }
  }
  return Array.from(map.values());
});

export const getCohortMessages = cache(async (cohortId: string, limit = 80) => {
  if (isDemoBypassEnabled()) {
    const now = Date.now();
    const sample = [
      {
        id: "demo-message-1",
        cohort_id: cohortId,
        dancer_id: "demo-dancer-2",
        body: "Anyone reviewing the Week 2 musicality drill tonight?",
        created_at: new Date(now - 1000 * 60 * 90).toISOString(),
        dancers: { first_name: "Ari", last_name: "Kim" }
      },
      {
        id: "demo-message-2",
        cohort_id: cohortId,
        dancer_id: "demo-dancer-3",
        body: "Yes, posting my take in feed in 20 minutes.",
        created_at: new Date(now - 1000 * 60 * 25).toISOString(),
        dancers: { first_name: "Noah", last_name: "Patel" }
      }
    ];
    return sample.slice(0, limit);
  }

  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient() as any;
  const { data } = await supabase
    .from("cohort_messages")
    .select("*, dancers(first_name,last_name)")
    .eq("cohort_id", cohortId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).reverse();
});

export const getCommunityFeed = cache(async (cohortId?: string) => {
  if (isDemoBypassEnabled()) {
    const targetCohortId = cohortId ?? "demo-cohort-1";
    const now = Date.now();
    return [
      {
        id: "demo-post-1",
        cohort_id: targetCohortId,
        dancer_id: "demo-dancer-2",
        caption: "Quick process cut from tonight's phrase lab.",
        created_at: new Date(now - 1000 * 60 * 55).toISOString(),
        dancers: { first_name: "Ari", last_name: "Kim" },
        cohorts: { name: "VISION LABS Cohort One" },
        video_uploads: {
          id: "demo-video-2",
          title: "Phrase Lab Cut",
          source: "external_link",
          external_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          storage_path: null
        },
        community_comments: [
          {
            id: "demo-comment-1",
            dancer_id: "demo-dancer-3",
            body: "Nice timing accents in the second 8.",
            hidden_by_admin: false,
            created_at: new Date(now - 1000 * 60 * 40).toISOString(),
            dancers: { first_name: "Noah", last_name: "Patel" }
          }
        ],
        community_reactions: [{ id: "demo-react-1", dancer_id: "demo-dancer-vision-labs" }]
      },
      {
        id: "demo-post-2",
        cohort_id: targetCohortId,
        dancer_id: "demo-dancer-3",
        caption: "Question: are we keeping the ending canon from class?",
        created_at: new Date(now - 1000 * 60 * 20).toISOString(),
        dancers: { first_name: "Noah", last_name: "Patel" },
        cohorts: { name: "VISION LABS Cohort One" },
        video_uploads: null,
        community_comments: [],
        community_reactions: []
      }
    ];
  }

  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient() as any;
  let query = supabase
    .from("community_posts")
    .select(
      "*, dancers(first_name,last_name), cohorts(name), video_uploads(id,title,source,external_url,storage_path), community_comments(*, dancers(first_name,last_name)), community_reactions(id,dancer_id)"
    )
    .order("created_at", { ascending: false })
    .limit(80);
  if (cohortId) query = query.eq("cohort_id", cohortId);
  const { data } = await query;
  const posts = data ?? [];
  const uploadVideos = posts
    .map((post: any) =>
      Array.isArray(post.video_uploads) ? post.video_uploads[0] : post.video_uploads
    )
    .filter((video: any) => video?.source === "upload");

  const signedVideos = await addSignedVideoUrls(supabase, uploadVideos);
  const signedById = new Map(signedVideos.map((video: any) => [video.id, video.signed_url ?? null]));

  return posts.map((post: any) => {
    const video = Array.isArray(post.video_uploads) ? post.video_uploads[0] : post.video_uploads;
    if (!video) return post;
    return {
      ...post,
      video_uploads: {
        ...video,
        signed_url: signedById.get(video.id) ?? null
      }
    };
  });
});

export const getCommunityFeedCount = cache(async (cohortId?: string) => {
  if (isDemoBypassEnabled()) {
    const feed = await getCommunityFeed(cohortId);
    return feed.length;
  }

  if (!hasSupabaseEnv()) return 0;
  const supabase = createServerClient() as any;
  let query = supabase.from("community_posts").select("id", { count: "exact", head: true });
  if (cohortId) query = query.eq("cohort_id", cohortId);
  const { count } = await query;
  return count ?? 0;
});

export const getAdminCommunityData = cache(async () => {
  if (!hasSupabaseEnv()) {
    return { messages: [], posts: [], moderationEvents: [] };
  }
  const supabase = createServerClient() as any;
  const [{ data: messages }, { data: posts }, { data: moderationEvents }] = await Promise.all([
    supabase
      .from("cohort_messages")
      .select("*, cohorts(name), dancers(first_name,last_name)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("community_posts")
      .select(
        "*, cohorts(name), dancers(first_name,last_name), video_uploads(id,title,external_url), community_comments(*, dancers(first_name,last_name)), community_reactions(id)"
      )
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("community_moderation_events")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false })
      .limit(200)
  ]);

  return {
    messages: messages ?? [],
    posts: posts ?? [],
    moderationEvents: moderationEvents ?? []
  };
});
