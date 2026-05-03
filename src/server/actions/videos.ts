"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";
import { externalVideoSchema, videoRecordSchema } from "@/lib/validators/video";
import { requireCompleteDancerProfile } from "@/server/queries/auth";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function actionLocale(formData: FormData): Locale {
  const locale = readString(formData, "locale");
  return isLocale(locale) ? locale : defaultLocale;
}

function nullable(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function addExternalVideoLinkAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const parsed = externalVideoSchema.safeParse({
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    cohort_id: readString(formData, "cohort_id"),
    cohort_session_id: readString(formData, "cohort_session_id"),
    external_url: readString(formData, "external_url")
  });

  if (!parsed.success) redirect(`/${locale}/portal/videos?error=invalid`);

  const supabase = createServerClient();
  const { error } = await supabase.from("video_uploads").insert({
    dancer_id: dancer.id,
    title: parsed.data.title,
    description: nullable(parsed.data.description),
    cohort_id: nullable(parsed.data.cohort_id),
    cohort_session_id: nullable(parsed.data.cohort_session_id),
    source: "external_link",
    external_url: parsed.data.external_url
  });

  if (error) redirect(`/${locale}/portal/videos?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${locale}/portal/videos`);
  redirect(`/${locale}/portal/videos`);
}

export async function createUploadedVideoRecordAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const parsed = videoRecordSchema.safeParse({
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    cohort_id: readString(formData, "cohort_id"),
    cohort_session_id: readString(formData, "cohort_session_id"),
    storage_path: readString(formData, "storage_path"),
    file_size_bytes: readString(formData, "file_size_bytes") || undefined,
    mime_type: readString(formData, "mime_type")
  });

  if (!parsed.success) redirect(`/${locale}/portal/videos?error=invalid`);

  const supabase = createServerClient();
  const { error } = await supabase.from("video_uploads").insert({
    dancer_id: dancer.id,
    title: parsed.data.title,
    description: nullable(parsed.data.description),
    cohort_id: nullable(parsed.data.cohort_id),
    cohort_session_id: nullable(parsed.data.cohort_session_id),
    source: "upload",
    storage_path: parsed.data.storage_path,
    file_size_bytes: parsed.data.file_size_bytes ?? null,
    mime_type: nullable(parsed.data.mime_type)
  });

  if (error) redirect(`/${locale}/portal/videos?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${locale}/portal/videos`);
  redirect(`/${locale}/portal/videos`);
}

export async function deleteVideoAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const id = readString(formData, "video_id");
  const supabase = createServerClient();

  const { data: video } = await supabase
    .from("video_uploads")
    .select("id,storage_path,source")
    .eq("id", id)
    .eq("dancer_id", dancer.id)
    .maybeSingle();

  if (video?.source === "upload" && video.storage_path) {
    await supabase.storage.from("dancer-videos").remove([video.storage_path]);
  }

  await supabase.from("video_uploads").delete().eq("id", id).eq("dancer_id", dancer.id);
  revalidatePath(`/${locale}/portal/videos`);
}
