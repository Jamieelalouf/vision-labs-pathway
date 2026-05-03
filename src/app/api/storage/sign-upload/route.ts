import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dancer } = await supabase
    .from("dancers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!dancer) {
    return NextResponse.json({ error: "Complete profile first." }, { status: 403 });
  }

  const body = (await request.json()) as {
    fileName?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    cohortId?: string;
    cohortSessionId?: string;
  };

  const extension = body.fileName?.split(".").pop()?.toLowerCase() ?? "mp4";
  const normalizedMime = body.mimeType?.toLowerCase() ?? "";
  const mimeExtension =
    normalizedMime === "video/mp4"
      ? "mp4"
      : normalizedMime === "video/quicktime" || normalizedMime === "video/x-quicktime"
        ? "mov"
        : null;
  const { data: settings } = await supabase
    .from("system_settings")
    .select("max_video_size_mb,accepted_video_formats")
    .eq("id", 1)
    .maybeSingle();
  const maxBytes = (settings?.max_video_size_mb ?? 500) * 1024 * 1024;
  const allowed = settings?.accepted_video_formats ?? ["mp4", "mov"];

  if (!body.cohortId) {
    return NextResponse.json({ error: "Choose a paid cohort first." }, { status: 400 });
  }

  if (typeof body.fileSizeBytes === "number" && body.fileSizeBytes > maxBytes) {
    return NextResponse.json({ error: "Video is larger than the allowed limit." }, { status: 400 });
  }

  if (!allowed.includes(extension) || (mimeExtension && !allowed.includes(mimeExtension))) {
    return NextResponse.json({ error: "Unsupported video format." }, { status: 400 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("dancer_id", dancer.id)
    .eq("cohort_id", body.cohortId)
    .eq("payment_status", "paid")
    .in("enrollment_status", ["registered", "completed"])
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json(
      { error: "You can only upload videos for paid cohorts." },
      { status: 403 }
    );
  }

  let sessionSegment = "general";
  if (body.cohortSessionId) {
    const { data: session } = await supabase
      .from("cohort_sessions")
      .select("session_number")
      .eq("id", body.cohortSessionId)
      .eq("cohort_id", body.cohortId)
      .maybeSingle();

    if (!session) {
      return NextResponse.json(
        { error: "Session does not belong to this cohort." },
        { status: 400 }
      );
    }

    sessionSegment = String(session.session_number);
  }

  const cohortSegment = body.cohortId;
  const path = `${dancer.id}/${cohortSegment}/${sessionSegment}/${nanoid()}.${extension}`;
  const { data, error } = await supabase.storage.from("dancer-videos").createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
