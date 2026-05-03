# VISION LABS Pathway Phase 3 Handoff

This repo is ready for another agent to continue from Phase 3 into Phase 4. Phase 1 foundation and Phase 2 public website are present, and Phase 3 registration/payment infrastructure has been hardened.

## Current Status

- Framework: Next.js 14 App Router, TypeScript strict, Tailwind, next-intl.
- Locales: `/fr` and `/en`, with `/` redirecting to `/fr`.
- Public site: landing, Pathway, cohorts, cohort detail, FAQ.
- Admin: seasons, settings, cohorts, cohort detail/edit, and operational table shells.
- Student portal: dashboard and registration-success polling notice.
- Supabase schema: initial migration plus a Phase 3 hardening migration.

## Phase 3 Work Completed

- Added race-safe cohort capacity reservation via Postgres RPC:
  - `supabase/migrations/20260503010000_phase3_registration_hardening.sql`
  - `public.reserve_cohort_enrollment(...)`
- Updated registration flow:
  - creates/reuses a pending enrollment through the RPC
  - passes `cohort_id`, `dancer_id`, `enrollment_id`, `price_type`, and `returning_override_id` into Stripe metadata
  - fixes server-action redirect handling so successful Stripe redirects are not caught as errors
  - no longer consumes returning-price overrides before payment
- Hardened Stripe webhook:
  - verifies signature
  - records raw event in `payments`
  - marks enrollment paid/registered on successful checkout or payment intent
  - sends confirmation email only on first transition to paid
  - consumes returning-price override only after paid webhook
  - marks async failures and expired checkout sessions
  - handles `charge.refunded` by payment intent even when metadata is absent
- Improved returning price logic:
  - immediate-next cohort is based on all non-draft, non-cancelled cohorts, not only currently open cohorts
  - skipping an already-completed cohort correctly loses returning eligibility
- Added dashboard success polling:
  - `src/components/portal/payment-status-notice.tsx`
  - polls `/api/me/enrollments/latest` after `?registration=success`
- Added/expanded admin Phase 3 tools:
  - full season edit action and UI
  - full cohort detail/edit page at `/[locale]/admin/cohorts/[id]`
  - cohort list links into edit page
  - settings page stores Stripe price IDs

## Validation Run

These passed in this workspace:

```bash
pnpm run typecheck
pnpm run lint
env NODE_PATH=/Users/jamie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/jamie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

The production build completed successfully and generated the new admin cohort detail route.

## Setup On Another Computer

```bash
pnpm install
cp .env.local.example .env.local
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm dev
```

Fill `.env.local` before testing live Supabase, Stripe, Resend, webhook, or cron flows.

## Supabase

Apply migrations in order:

```text
supabase/migrations/20260503000000_initial_schema.sql
supabase/migrations/20260503010000_phase3_registration_hardening.sql
```

Typical command:

```bash
supabase db push
```

Seed data is available at:

```text
supabase/seed/phase8_seed.sql
```

## Stripe Test Checklist For Next Machine

1. Put test price IDs into `/fr/admin/settings`.
2. Create an active season.
3. Create an open cohort with registration set to `open`.
4. Complete a dancer profile.
5. Register for cohort and pay with Stripe test card `4242 4242 4242 4242`.
6. Confirm webhook changes enrollment to `paid` / `registered`.
7. Confirm four attendance rows are auto-created.
8. Confirm dashboard payment notice resolves once webhook is processed.

## Suggested Next Step

Move to Phase 4:

- student dashboard polish with real data states
- My Cohort page with resources and session timeline
- My LABS Pathway page with completed cohort history
- My Rewards page status handling
- Profile editing pass
- portal mobile pass

## Notes For The Next Agent

- Do not rebuild Phase 1 or Phase 2 from scratch.
- Keep the PRD business rules as the contract.
- Continue phase by phase; Phase 4 should be the next implementation milestone.
- Replace the generated hero poster with real VISION LABS photography or a training reel when brand assets are available.
- The app is intentionally usable without Supabase env vars for public empty states, but real registration needs Supabase + Stripe configured.
