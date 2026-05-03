# VISION LABS Pathway Phase 4 Handoff

This repo is ready for another agent to continue from Phase 4 into Phase 5. Phase 1 foundation, Phase 2 public website, Phase 3 registration/payment infrastructure, and Phase 4 student portal polish are present.

## Current Status

- Framework: Next.js 14 App Router, TypeScript strict, Tailwind, next-intl.
- Locales: `/fr` and `/en`, with `/` redirecting to `/fr`.
- Public site: landing, Pathway, cohorts, cohort detail, FAQ.
- Registration: Stripe checkout action, webhook route, payment polling notice, and race-safe enrollment reservation RPC.
- Student portal: dashboard, My Cohort, Pathway, Rewards, Videos, Profile.
- Supabase schema: initial migration plus Phase 3 registration hardening migration.

## Phase 4 Work Completed

- Rebuilt the student dashboard into the PRD card structure:
  - welcome row and tier badge
  - season progress with Pathway progress bar
  - next unlock card
  - current cohort or current reward card
  - context-aware primary action
  - recent video uploads
  - notifications empty state
  - payment success polling notice remains active after Stripe redirect
- Rebuilt My Cohort:
  - current cohort header
  - dates, location, address
  - upload CTA
  - four-session timeline using generated `cohort_sessions`
  - resources panel with localized DB fields
  - uploads for the current cohort
  - empty state when no paid/current cohort exists
- Rebuilt My LABS Pathway:
  - active-season progress
  - tier badge
  - bilingual reward ladder
  - completed cohort history
  - rules panel
- Rebuilt My Rewards:
  - status-aware reward card
  - generated code display if a code already exists
  - `DiscountCodeReveal` copy-to-clipboard component
  - no Phase 7 code-generation CTA yet, matching the PRD phase order
- Localized portal copy across EN/FR for dashboard, cohort, pathway, rewards, videos, and profile labels.
- Improved profile form localization and profile page structure.
- Adjusted `getStudentPortalData` so the current cohort is selected from paid enrollments with active/open/non-final cohorts before falling back to the latest paid enrollment.

## Validation Run

These passed in this workspace:

```bash
pnpm run typecheck
pnpm run lint
env NODE_PATH=/Users/jamie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/jamie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

The production build completed successfully.

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

## Suggested Next Step

Move to Phase 5:

- admin overview KPI polish
- admin dancers table filters
- admin dancer profile page
- admin enrollments action menus
- admin attendance grid
- admin rewards and discount code pages
- admin operational empty/error/loading states

## Notes For The Next Agent

- Do not rebuild previous phases from scratch.
- Keep the PRD business rules as the contract.
- Continue phase by phase; Phase 5 should be the next implementation milestone.
- Phase 4 intentionally displays generated reward codes if present, but does not expose the Phase 7 "Get my code" generation flow.
- Replace the generated hero poster with real VISION LABS photography or a training reel when brand assets are available.
