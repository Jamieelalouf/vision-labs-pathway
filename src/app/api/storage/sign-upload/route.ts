import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { isDemoBypassEnabled } from "@/lib/demo-bypass";
import { createServiceClient } from "@/lib/supabase/service";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoBypass = isDemoBypassEnabled();
  const supabase = createServerClient();
  let dancerId: string | null = null;
  if (!demoBypass) {
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
    dancerId = dancer.id;
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
  const allowed = ["mp4", "mov"];
  let maxBytes = 500 * 1024 * 1024;
  if (!demoBypass) {
    const { data: settings } = await supabase
      .from("system_settings")
      .select("max_video_size_mb,accepted_video_formats")
      .eq("id", 1)
      .maybeSingle();
    maxBytes = (settings?.max_video_size_mb ?? 500) * 1024 * 1024;
  }

  if (!body.cohortId) {
    return NextResponse.json({ error: "Choose a paid cohort first." }, { status: 400 });
  }

  if (typeof body.fileSizeBytes === "number" && body.fileSizeBytes > maxBytes) {
    return NextResponse.json({ error: "Video is larger than the allowed limit." }, { status: 400 });
  }

  if (!allowed.includes(extension) || !mimeExtension || !allowed.includes(mimeExtension)) {
    return NextResponse.json({ error: "Unsupported video format." }, { status: 400 });
  }

  if (!demoBypass) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("dancer_id", dancerId!)
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
  }

  let sessionSegment = "general";
  if (!demoBypass && body.cohortSessionId) {
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
  const ownerSegment = demoBypass ? "demo-bypass" : dancerId;
  const path = `${ownerSegment}/${cohortSegment}/${sessionSegment}/${nanoid()}.${extension}`;
  const storageClient = demoBypass ? createServiceClient() : supabase;
  const { data, error } = await storageClient.storage
    .from("dancer-videos")
    .createSignedUploadUrl(path);

  if (error) {
    console.error("createSignedUploadUrl failed:", error.message);
    return NextResponse.json({ error: "signed-url-error" }, { status: 400 });
  }

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
