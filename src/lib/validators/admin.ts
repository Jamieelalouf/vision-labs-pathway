import { z } from "zod";

export const seasonSchema = z.object({
  name: z.string().trim().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  convention_name: z.string().trim().optional(),
  convention_start_date: z.string().optional(),
  convention_end_date: z.string().optional(),
  weekend_pass_value_cad: z.coerce.number().int().positive().default(429),
  all_access_pass_value_cad: z.coerce.number().int().positive().default(600),
  is_active: z.coerce.boolean().default(false)
});

export const cohortSchema = z.object({
  season_id: z.string().uuid(),
  name: z.string().trim().min(1),
  cohort_number: z.coerce.number().int().positive(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  day_of_week: z.coerce.number().int().min(0).max(6).optional(),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  location_name: z.string().trim().min(1),
  location_address: z.string().trim().min(1),
  capacity: z.coerce.number().int().positive(),
  registration_status: z.enum(["open", "closed", "full"]).default("closed"),
  status: z.enum(["draft", "open", "active", "completed", "cancelled"]).default("draft"),
  regular_price_cad: z.coerce.number().int().positive().default(297),
  returning_price_cad: z.coerce.number().int().positive().default(247),
  description_en: z.string().optional(),
  description_fr: z.string().optional()
});

export const attendanceSchema = z.object({
  attendance_id: z.string().uuid(),
  status: z.enum(["present", "absent", "excused", "unmarked"]),
  notes: z.string().optional()
});

export const settingsSchema = z.object({
  regular_price_cad: z.coerce.number().int().positive(),
  returning_price_cad: z.coerce.number().int().positive(),
  completion_min_attendance: z.coerce.number().int().min(1).max(4),
  max_video_size_mb: z.coerce.number().int().positive().max(500),
  stripe_regular_price_id: z.string().optional(),
  stripe_returning_price_id: z.string().optional(),
  legacy_pass_uses_stripe: z.coerce.boolean().default(false)
});

export const enrollmentOverrideSchema = z.object({
  enrollment_id: z.string().uuid(),
  completion_status: z.enum(["completed", "incomplete"]).optional(),
  enrollment_status: z
    .enum(["pending", "registered", "completed", "dropped", "refunded", "cancelled"])
    .optional(),
  payment_status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  admin_notes: z.string().optional()
});

export const manualRewardSchema = z.object({
  dancer_id: z.string().uuid(),
  season_id: z.string().uuid(),
  tier: z.enum(["member", "alumni", "elite", "legacy"]),
  admin_notes: z.string().optional()
});
