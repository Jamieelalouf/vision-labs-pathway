"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";
import {
  createChatMessageSchema,
  createCommunityCommentSchema,
  createCommunityPostSchema,
  deleteCommunityCommentSchema,
  deleteCommunityPostSchema,
  moderateCommunityTargetSchema,
  reactionToggleSchema
} from "@/lib/validators/community";
import { requireAdmin, requireCompleteDancerProfile } from "@/server/queries/auth";

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

function path(locale: Locale) {
  return `/${locale}/portal/community`;
}

function adminPath(locale: Locale) {
  return `/${locale}/admin/community`;
}

function safeErrorRedirect(locale: Locale, code: string): never {
  redirect(`${path(locale)}?error=${encodeURIComponent(code)}`);
}

function safeAdminErrorRedirect(locale: Locale, code: string): never {
  redirect(`${adminPath(locale)}?error=${encodeURIComponent(code)}`);
}

export async function createCohortMessageAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const parsed = createChatMessageSchema.safeParse({
    cohort_id: readString(formData, "cohort_id"),
    body: readString(formData, "body")
  });

  if (!parsed.success) safeErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const { error } = await supabase.from("cohort_messages").insert({
    cohort_id: parsed.data.cohort_id,
    dancer_id: dancer.id,
    body: parsed.data.body
  });

  if (error) safeErrorRedirect(locale, "message-failed");
  revalidatePath(path(locale));
}

export async function createCommunityPostAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const parsed = createCommunityPostSchema.safeParse({
    cohort_id: readString(formData, "cohort_id"),
    visibility: readString(formData, "visibility") || "cohort",
    caption: readString(formData, "caption"),
    video_upload_id: readString(formData, "video_upload_id")
  });

  if (!parsed.success) safeErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const { error } = await supabase.from("community_posts").insert({
    cohort_id: parsed.data.cohort_id,
    dancer_id: dancer.id,
    visibility: parsed.data.visibility,
    caption: nullable(parsed.data.caption),
    video_upload_id: nullable(parsed.data.video_upload_id)
  });

  if (error) safeErrorRedirect(locale, "post-failed");
  revalidatePath(path(locale));
}

export async function createCommunityCommentAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const parsed = createCommunityCommentSchema.safeParse({
    post_id: readString(formData, "post_id"),
    body: readString(formData, "body")
  });

  if (!parsed.success) safeErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const { error } = await supabase.from("community_comments").insert({
    post_id: parsed.data.post_id,
    dancer_id: dancer.id,
    body: parsed.data.body
  });

  if (error) safeErrorRedirect(locale, "comment-failed");
  revalidatePath(path(locale));
}

export async function toggleCommunityReactionAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const parsed = reactionToggleSchema.safeParse({
    post_id: readString(formData, "post_id")
  });
  if (!parsed.success) safeErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const { data: existing } = await supabase
    .from("community_reactions")
    .select("id")
    .eq("post_id", parsed.data.post_id)
    .eq("dancer_id", dancer.id)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("community_reactions").delete().eq("id", existing.id);
    if (error) safeErrorRedirect(locale, "reaction-failed");
  } else {
    const { error } = await supabase.from("community_reactions").insert({
      post_id: parsed.data.post_id,
      dancer_id: dancer.id
    });
    if (error) safeErrorRedirect(locale, "reaction-failed");
  }

  revalidatePath(path(locale));
}

export async function deleteOwnCommunityPostAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const parsed = deleteCommunityPostSchema.safeParse({
    post_id: readString(formData, "post_id")
  });

  if (!parsed.success) safeErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", parsed.data.post_id)
    .eq("dancer_id", dancer.id)
    .eq("hidden_by_admin", false);

  if (error) safeErrorRedirect(locale, "delete-post-failed");
  revalidatePath(path(locale));
}

export async function adminDeleteCommunityPostAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const parsed = deleteCommunityPostSchema.safeParse({
    post_id: readString(formData, "post_id")
  });

  if (!parsed.success) safeAdminErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const { error } = await supabase.from("community_posts").delete().eq("id", parsed.data.post_id);

  if (error) safeAdminErrorRedirect(locale, "delete-post-failed");
  revalidatePath(path(locale));
  revalidatePath(adminPath(locale));
}

export async function deleteOwnCommunityCommentAction(formData: FormData) {
  const locale = actionLocale(formData);
  const dancer = await requireCompleteDancerProfile(locale);
  const parsed = deleteCommunityCommentSchema.safeParse({
    comment_id: readString(formData, "comment_id")
  });

  if (!parsed.success) safeErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const { error } = await supabase
    .from("community_comments")
    .delete()
    .eq("id", parsed.data.comment_id)
    .eq("dancer_id", dancer.id)
    .eq("hidden_by_admin", false);

  if (error) safeErrorRedirect(locale, "delete-comment-failed");
  revalidatePath(path(locale));
}

export async function adminHideCommunityTargetAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const parsed = moderateCommunityTargetSchema.safeParse({
    target_type: readString(formData, "target_type"),
    target_id: readString(formData, "target_id"),
    reason: readString(formData, "reason")
  });

  if (!parsed.success) safeAdminErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const updates = {
    hidden_by_admin: true,
    hidden_reason: nullable(parsed.data.reason),
    hidden_at: new Date().toISOString(),
    hidden_by: user?.id ?? null
  };

  const table =
    parsed.data.target_type === "post"
      ? "community_posts"
      : parsed.data.target_type === "comment"
        ? "community_comments"
        : "cohort_messages";

  const { error } = await supabase.from(table).update(updates).eq("id", parsed.data.target_id);

  if (error) safeAdminErrorRedirect(locale, "moderation-failed");

  await supabase.from("community_moderation_events").insert({
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    action: "hide",
    reason: nullable(parsed.data.reason),
    performed_by: user?.id
  });

  revalidatePath(path(locale));
  revalidatePath(adminPath(locale));
}

export async function adminUnhideCommunityTargetAction(formData: FormData) {
  const locale = actionLocale(formData);
  await requireAdmin(locale);
  const parsed = moderateCommunityTargetSchema.safeParse({
    target_type: readString(formData, "target_type"),
    target_id: readString(formData, "target_id"),
    reason: readString(formData, "reason")
  });

  if (!parsed.success) safeAdminErrorRedirect(locale, "invalid");

  const supabase = createServerClient() as any;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const table =
    parsed.data.target_type === "post"
      ? "community_posts"
      : parsed.data.target_type === "comment"
        ? "community_comments"
        : "cohort_messages";

  const { error } = await supabase
    .from(table)
    .update({ hidden_by_admin: false, hidden_reason: null, hidden_at: null, hidden_by: null })
    .eq("id", parsed.data.target_id);

  if (error) safeAdminErrorRedirect(locale, "moderation-failed");

  await supabase.from("community_moderation_events").insert({
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    action: "unhide",
    reason: nullable(parsed.data.reason),
    performed_by: user?.id
  });

  revalidatePath(path(locale));
  revalidatePath(adminPath(locale));
}
