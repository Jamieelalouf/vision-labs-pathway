import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { isDemoBypassEnabled } from "@/lib/demo-bypass";
import { createServiceClient } from "@/lib/supabase/service";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

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
  };

  const extension = body.fileName?.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = body.mimeType?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(extension) || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: "Unsupported image format." }, { status: 400 });
  }

  if (typeof body.fileSizeBytes === "number" && body.fileSizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "Image is larger than 5MB." }, { status: 400 });
  }

  const ownerSegment = demoBypass ? "demo-bypass" : dancerId;
  const path = `${ownerSegment}/${nanoid()}.${extension}`;
  const storageClient = demoBypass ? createServiceClient() : supabase;
  const { data, error } = await storageClient.storage
    .from("profile-photos")
    .createSignedUploadUrl(path);

  if (error) {
    console.error("createSignedUploadUrl profile photo failed:", error.message);
    return NextResponse.json({ error: "signed-url-error" }, { status: 400 });
  }

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
