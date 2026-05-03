# VISION LABS Pathway

Bilingual Next.js 14 foundation for the VISION LABS cohort operations and reward engine.

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
   pnpm dev
   ```

## Supabase

Apply the initial migration:

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

## Current Phase

Phase 1 foundation is implemented. Later phases should build on the existing route shells instead of replacing them.
