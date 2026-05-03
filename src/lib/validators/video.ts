import { z } from "zod";

export const externalVideoSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  cohort_id: z.string().uuid(),
  cohort_session_id: z.string().uuid().optional().or(z.literal("")),
  external_url: z.string().url()
});

export const videoRecordSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  cohort_id: z.string().uuid(),
  cohort_session_id: z.string().uuid().optional().or(z.literal("")),
  storage_path: z.string().trim().min(1),
  file_size_bytes: z.coerce.number().int().positive().optional(),
  mime_type: z.string().optional()
});
