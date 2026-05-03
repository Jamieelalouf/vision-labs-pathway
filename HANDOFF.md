# VISION LABS Pathway Phase 1 Handoff

This handoff contains the Phase 1 foundation for VISION LABS Pathway.

## What Is Included

- Next.js 14 App Router project
- TypeScript strict mode
- Tailwind CSS configuration and brand theme
- shadcn-style UI primitives
- `next-intl` bilingual routing for `/fr` and `/en`
- Public, auth, portal, and admin route shells
- Supabase client helpers
- Auth/profile server actions
- Full initial Supabase migration:
  - enums
  - tables
  - indexes
  - triggers
  - reward-level seeds
  - RLS policies
  - storage buckets and storage policies

## Setup On Another Computer

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Fill `.env.local` before testing Supabase-backed auth/data flows.

## Supabase

Apply:

```bash
supabase db push
```

Migration file:

```text
supabase/migrations/20260503000000_initial_schema.sql
```

## Verification Already Run

```bash
pnpm run typecheck
pnpm run lint
next build
```

All passed in this workspace.

## Important Local Note

On this Mac, the normal `pnpm run build` hit a macOS SWC native binary signing issue. The build passed using the bundled Node runtime:

```bash
/Users/jamie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

That is likely specific to this machine and should not affect a normal setup elsewhere.
