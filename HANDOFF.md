# VISION LABS Pathway - Final Phase 8 Handoff

Status: Phase 8 QA/deployment package completed and validated.
Date: 2026-05-03

## Build Status

All eight phases are complete.

Completed phases:

1. Foundation
2. Public website
3. Cohorts, registration, and Stripe
4. Student portal
5. Admin dashboard
6. Video uploads
7. Reward automation
8. QA and deployment package

Phases left: 0.

## What Phase 8 Added

- Expanded demo seed data:
  - `supabase/seed/phase8_seed.sql`
  - Creates one active season, three cohorts, admin account, five dancer accounts, enrollments, attendance, rewards, discount code, returning override, and demo video links.
- Production launch guide:
  - `docs/PHASE8_QA_DEPLOYMENT.md`
- Security review notes:
  - `docs/SECURITY_REVIEW.md`
- Production health endpoint:
  - `/api/health`
  - Returns `200` only when required production env vars are present.
- Deployment preflight script:
  - `pnpm run preflight`
  - Verifies required files and required production env vars.
- Production security headers:
  - Configured in `next.config.mjs`.
  - Includes CSP, frame protections, referrer policy, content-type sniffing protection, and permissions policy.
- README updated with final build/deployment notes.
- `.env.local.example` updated with optional Sentry env placeholders.

## Validation Run

All commands passed:

```bash
/Users/jamie/Library/pnpm/pnpm run typecheck
/Users/jamie/Library/pnpm/pnpm run lint
env NODE_PATH=/Users/jamie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/jamie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
env NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=anon SUPABASE_SERVICE_ROLE_KEY=service STRIPE_SECRET_KEY=sk_test_dummy STRIPE_WEBHOOK_SECRET=whsec_dummy STRIPE_PUBLISHABLE_KEY=pk_test_dummy RESEND_API_KEY=re_dummy NEXT_PUBLIC_APP_URL=https://labs.visiondns.ca CRON_SECRET=cron_dummy /Users/jamie/Library/pnpm/pnpm run preflight
```

Production build generated 57 app routes, including:

- `/api/health`
- `/api/cron/compute-completions`
- `/api/cron/expire-rewards`
- `/api/webhooks/stripe`
- `/[locale]/portal/*`
- `/[locale]/admin/*`

## Local Setup

```bash
pnpm install
cp .env.local.example .env.local
pnpm run dev
```

Run validation:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```

## Supabase Migration Order

Apply migrations in this exact order:

1. `supabase/migrations/20260503000000_initial_schema.sql`
2. `supabase/migrations/20260503010000_phase3_registration_hardening.sql`
3. `supabase/migrations/20260503020000_phase6_video_uploads.sql`
4. `supabase/migrations/20260503030000_phase7_reward_automation.sql`

For local/demo environments only, apply:

- `supabase/seed/phase8_seed.sql`

Do not run demo seed in production.

## Demo Accounts

Password for all seeded demo users:

```text
VisionLabs123!
```

- `admin@visionlabs.test` - admin
- `maya@visionlabs.test` - completed cohort, generated Member code
- `theo@visionlabs.test` - incomplete completed cohort
- `ana@visionlabs.test` - active cohort student
- `chris@visionlabs.test` - returning override and near-Legacy manual reward
- `lea@visionlabs.test` - refunded/drop edge case

## Production Checklist

Use `docs/PHASE8_QA_DEPLOYMENT.md` as the launch checklist.

Production must have:

- Supabase production project migrated.
- At least one manually promoted admin.
- Stripe live keys and webhook endpoint.
- Resend verified domain.
- Vercel environment variables.
- Vercel cron enabled.
- DNS pointed to Vercel.
- `/api/health` returning green.
- Privacy Policy and Terms linked before public launch.

## Transfer Archives

Use either archive:

- `vision-labs-pathway-final-phase8-transfer.zip`
- `vision-labs-pathway-final-phase8-transfer.tar.gz`

Both archives exclude local build/dependency/cache files such as `.git`, `.next`, `node_modules`, `.pnpm-store`, existing archives, `.DS_Store`, and `tsconfig.tsbuildinfo`.
