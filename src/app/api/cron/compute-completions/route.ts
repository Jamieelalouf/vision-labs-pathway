import { NextRequest, NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { getRewardSnapshot, sendRewardChangeEmail } from "@/server/rewards/automation";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: settings } = await supabase
    .from("system_settings")
    .select("completion_min_attendance")
    .eq("id", 1)
    .maybeSingle();

  const minAttendance = settings?.completion_min_attendance ?? 3;
  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id")
    .lt("end_date", today)
    .not("status", "in", "(completed,cancelled)");

  let completedEnrollments = 0;
  let rewardEmails = 0;
  for (const cohort of cohorts ?? []) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id,dancer_id,season_id")
      .eq("cohort_id", cohort.id)
      .eq("payment_status", "paid")
      .is("completion_status", null);

    for (const enrollment of enrollments ?? []) {
      const beforeReward = await getRewardSnapshot(
        supabase,
        enrollment.dancer_id,
        enrollment.season_id
      );
      const { count } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("enrollment_id", enrollment.id)
        .in("status", ["present", "excused"]);

      const completed = (count ?? 0) >= minAttendance;
      await supabase
        .from("enrollments")
        .update({
          completion_status: completed ? "completed" : "incomplete",
          enrollment_status: completed ? "completed" : "registered"
        })
        .eq("id", enrollment.id);

      if (completed) {
        completedEnrollments += 1;
        await sendRewardChangeEmail({
          supabase,
          dancerId: enrollment.dancer_id,
          seasonId: enrollment.season_id,
          before: beforeReward
        });
        const afterReward = await getRewardSnapshot(
          supabase,
          enrollment.dancer_id,
          enrollment.season_id
        );
        if (afterReward && (!beforeReward || beforeReward.tier !== afterReward.tier)) {
          rewardEmails += 1;
        }
      }
    }

    await supabase.from("cohorts").update({ status: "completed" }).eq("id", cohort.id);
  }

  return NextResponse.json({ cohorts: cohorts?.length ?? 0, completedEnrollments, rewardEmails });
}
