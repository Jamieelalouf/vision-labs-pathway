import { z } from "zod";

export const createChatMessageSchema = z.object({
  cohort_id: z.string().uuid(),
  body: z.string().trim().min(1).max(2000)
});

export const createCommunityPostSchema = z
  .object({
    cohort_id: z.string().uuid(),
    visibility: z.enum(["cohort", "labs"]).default("cohort"),
    caption: z.string().trim().max(3000).optional(),
    video_upload_id: z.string().uuid().optional().or(z.literal(""))
  })
  .refine((value) => Boolean(value.video_upload_id || value.caption?.trim()), {
    message: "Post requires a caption or video"
  });

export const createCommunityCommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().trim().min(1).max(2000)
});

export const reactionToggleSchema = z.object({
  post_id: z.string().uuid()
});

export const deleteCommunityPostSchema = z.object({
  post_id: z.string().uuid()
});

export const deleteCommunityCommentSchema = z.object({
  comment_id: z.string().uuid()
});

export const moderateCommunityTargetSchema = z.object({
  target_type: z.enum(["message", "post", "comment"]),
  target_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional()
});
