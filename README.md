# VISION LABS Pathway

Bilingual Next.js 14 platform for VISION LABS cohort operations, student portal workflows, Stripe registration, video uploads, and LABS Pathway reward automation.

## Stack

- Next.js 14 App Router
- TypeScript strict mode
- Tailwind CSS + shadcn-style primitives
- Supabase Auth, Postgres, RLS, and Storage
- next-intl locale routes (`/fr`, `/en`)
- Stripe, Resend, Zod-ready server actions

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

3. Fill in Supabase, Stripe, Resend, app URL, and cron secret values.

4. Run the app:

   ```bash
   pnpm run dev
   ```

5. Run local validation:

   ```bash
   pnpm run typecheck
   pnpm run lint
   pnpm run build
   ```

## Supabase

Apply migrations in order:

```bash
supabase db push
```

The first migration creates:

- all product enums and tables
- reward-level seed data
- singleton `system_settings`
- cohort/session and enrollment/attendance triggers
- reward recalculation trigger
- returning-price override support
- RLS policies
- storage buckets and storage policies

For local/demo data, run the Phase 8 seed through Supabase local reset:

```bash
supabase db reset
```

Demo users are documented in [docs/PHASE8_QA_DEPLOYMENT.md](docs/PHASE8_QA_DEPLOYMENT.md).

## Deployment

Use [docs/PHASE8_QA_DEPLOYMENT.md](docs/PHASE8_QA_DEPLOYMENT.md) as the production launch checklist.

Useful production checks:

```bash
pnpm run preflight
curl https://labs.visiondance.ca/api/health
```

## Current Scope

Phases 1 through 8 are implemented. Before production use, configure Supabase, Stripe, Resend, cron secrets, monitoring, DNS, Privacy Policy, and Terms of Service.
