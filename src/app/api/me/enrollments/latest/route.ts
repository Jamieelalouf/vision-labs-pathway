import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dancer } = await supabase
    .from("dancers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!dancer) return NextResponse.json({ enrollment: null });

  const { data } = await supabase
    .from("enrollments")
    .select("id,payment_status,enrollment_status,created_at,cohorts(name)")
    .eq("dancer_id", dancer.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ enrollment: data });
}
