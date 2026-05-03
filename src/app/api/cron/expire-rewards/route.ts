import { NextRequest, NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";

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
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id")
    .not("convention_end_date", "is", null)
    .lt("convention_end_date", cutoffDate);

  for (const season of seasons ?? []) {
    await supabase
      .from("dancer_rewards")
      .update({ status: "expired" })
      .eq("season_id", season.id)
      .in("status", ["unlocked", "generated"]);

    await supabase
      .from("discount_codes")
      .update({ status: "expired" })
      .eq("season_id", season.id)
      .eq("status", "active")
      .is("used_at", null);
  }

  return NextResponse.json({ expiredSeasons: seasons?.length ?? 0 });
}
