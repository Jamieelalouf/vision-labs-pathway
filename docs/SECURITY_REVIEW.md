# Security Review

Phase 8 production review notes for VISION LABS Pathway.

## Implemented

- RLS enabled across application tables in the initial migration.
- Student policies are scoped to the current dancer/profile.
- Admin access is role-based through `profiles.role = 'admin'`.
- Service role client is isolated to webhook/cron/server-only flows.
- Stripe webhook verifies signatures.
- Cron endpoints require `Authorization: Bearer ${CRON_SECRET}`.
- Video uploads use private Supabase Storage and signed URLs.
- Storage policies restrict dancer video paths to the owning dancer or admin.
- Security headers are configured in `next.config.mjs`.
- `/api/health` exposes missing environment variable names only, not secret values.

## Production Checks

- Confirm no service role key appears in client bundles or browser network calls.
- Confirm Supabase anon key plus a student JWT returns zero rows for other dancers.
- Confirm admin escalation requires manual SQL update only.
- Confirm Vercel env vars are scoped correctly between Preview and Production.
- Confirm Stripe webhook signing secret differs between test and live mode.
- Confirm Resend API key is only set server-side.
- Confirm uploads over the configured max size fail before storage upload.
- Confirm stale signed video URLs expire.

## Known V1 Tradeoffs

- No rate limiter is installed yet. Supabase Auth provides baseline auth protection; add edge/API rate limiting if abuse appears.
- Monitoring is documented for Vercel Observability or Sentry, but no Sentry SDK is installed in this package.
- Admin is a single broad role in V1 by product requirement.
