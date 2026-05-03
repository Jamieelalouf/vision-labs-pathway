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
    cohortId?: string;
    sessionNumber?: number;
  };

  const extension = body.fileName?.split(".").pop()?.toLowerCase() ?? "mp4";
  const allowed = ["mp4", "mov"];
  if (!allowed.includes(extension)) {
    return NextResponse.json({ error: "Unsupported video format." }, { status: 400 });
  }

  const cohortSegment = body.cohortId ?? "general";
  const sessionSegment = body.sessionNumber ? String(body.sessionNumber) : "general";
  const path = `${dancer.id}/${cohortSegment}/${sessionSegment}/${nanoid()}.${extension}`;
  const { data, error } = await supabase.storage.from("dancer-videos").createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
