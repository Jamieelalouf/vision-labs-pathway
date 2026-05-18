# Phase 8 QA and Deployment Guide

This guide is the launch checklist for VISION LABS Pathway.

## What Phase 8 Adds

- Full demo seed data in `supabase/seed/phase8_seed.sql`.
- Daily Vercel cron configuration in `vercel.json`.
- Production security headers in `next.config.mjs`.
- Health endpoint at `/api/health`.
- Preflight script: `pnpm run preflight`.
- Final QA/deployment checklist in this document.

## Demo Accounts

The Phase 8 seed creates these local/test users.

Password for all seeded users:

```text
VisionLabs123!
```

Accounts:

- `admin@visionlabs.test` - admin
- `maya@visionlabs.test` - completed cohort, generated Member code
- `theo@visionlabs.test` - incomplete completed cohort
- `ana@visionlabs.test` - active cohort dancer with attendance started
- `chris@visionlabs.test` - open cohort registration, returning override, near-Legacy manual reward
- `lea@visionlabs.test` - refunded/drop edge case

## Apply Database

Apply migrations in this exact order:

1. `supabase/migrations/20260503000000_initial_schema.sql`
2. `supabase/migrations/20260503010000_phase3_registration_hardening.sql`
3. `supabase/migrations/20260503020000_phase6_video_uploads.sql`
4. `supabase/migrations/20260503030000_phase7_reward_automation.sql`

Then apply seed data in non-production environments:

```bash
supabase db reset
```

For production, do not run the demo seed. Create the first admin through Supabase Auth, then update `profiles.role = 'admin'` manually.

## Local QA Commands

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run build
```

Production environment preflight:

```bash
pnpm run preflight
```

`preflight` intentionally fails when required production environment variables are missing.

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

Optional monitoring:

- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

## Vercel Setup

1. Create the Vercel project from the repo.
2. Add all environment variables for Preview and Production.
3. Confirm `NEXT_PUBLIC_APP_URL` points to the deployed URL:
   - Preview: Vercel preview URL
   - Production: `https://labs.visiondance.ca`
4. Confirm Vercel Cron is active:
   - `/api/cron/compute-completions` at `0 7 * * *`
   - `/api/cron/expire-rewards` at `0 8 * * *`
5. Confirm cron requests include:

```text
Authorization: Bearer ${CRON_SECRET}
```

## Stripe Setup

1. Use test keys until soft launch passes.
2. Create product: `VISION LABS Cohort`.
3. Create two CAD prices:
   - Regular: $297 CAD
   - Returning: $247 CAD
4. Store both price IDs in admin settings.
5. Add webhook endpoint:

```text
https://labs.visiondance.ca/api/webhooks/stripe
```

6. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
7. Store the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.

## Resend Setup

1. Verify the sending domain.
2. Add SPF/DKIM DNS records.
3. Confirm `RESEND_API_KEY` in Vercel.
4. Send one test registration email and one reward-code email before launch.

## DNS

Target production domain:

```text
labs.visiondance.ca
```

Point DNS to Vercel. If the final domain changes to `visionsdance.ca`, update:

- `NEXT_PUBLIC_APP_URL`
- Stripe webhook endpoint
- sitemap/robots output
- Resend domain if needed

## Security QA

- Confirm RLS is enabled on every public table.
- Confirm student users cannot read another dancer's records.
- Confirm students cannot access `/admin`.
- Confirm admin can access all operational tables.
- Confirm service role key is only used in route handlers/server-only code.
- Confirm `/api/cron/*` rejects requests without `Authorization: Bearer ${CRON_SECRET}`.
- Confirm `/api/webhooks/stripe` rejects invalid signatures.
- Confirm `/api/health` returns `200` only when production env vars are present.
- Confirm security headers are present in production responses.

## Functional QA

Auth:

- Sign up creates profile.
- Profile completion gate redirects incomplete dancers.
- Admin account can access `/admin`.
- Student account cannot access `/admin`.

Cohorts and payment:

- Open cohort registration creates a pending enrollment.
- Successful Stripe webhook marks enrollment paid/registered.
- Attendance rows are created after payment.
- Cancelled checkout marks pending enrollment cancelled.
- Refund marks enrollment refunded.

Student portal:

- Dashboard reflects current cohort and reward state.
- My Cohort shows sessions/resources/uploads.
- Videos support MP4/MOV upload and external links.
- Rewards page can generate a code from an unlocked reward.

Admin:

- Admin can create/edit cohorts.
- Admin can mark attendance in the cohort grid.
- Admin can override enrollment completion.
- Admin can grant returning price.
- Admin can grant rewards manually.
- Admin can mark discount codes redeemed.

Reward engine:

- 1 completed cohort unlocks Member.
- 2 completed cohorts upgrades to Alumni.
- 3 completed cohorts upgrades to Elite.
- 4 completed cohorts remains Elite.
- 5 completed cohorts upgrades to Legacy.
- Reward upgrades cancel older generated code rows.
- Expiration cron expires active reward/code records after convention grace.

## Soft Launch

1. Use Stripe test mode.
2. Invite five trusted test dancers.
3. Dry-run:
   - Sign up
   - Profile completion
   - Cohort registration
   - Stripe payment
   - Video upload
   - Attendance marking
   - Completion cron
   - Reward code generation
4. Fix any production-only edge cases.
5. Swap Stripe to live keys.

## Launch Go/No-Go

Go only when:

- Typecheck, lint, build pass.
- Production `/api/health` is green.
- Stripe live webhook verified.
- Resend domain verified.
- First active season exists.
- First open cohort exists.
- Admin account exists.
- Privacy Policy and Terms links are published in footer or launch wrapper.
