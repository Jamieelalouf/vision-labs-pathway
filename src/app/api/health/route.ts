import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const coreEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_APP_URL"
] as const;

const opsEnv = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET"
] as const;

export function GET() {
  const missingCore = coreEnv.filter((key) => !process.env[key]);
  const missingOps = opsEnv.filter((key) => !process.env[key]);
  const coreHealthy = missingCore.length === 0;
  const status = coreHealthy ? 200 : 503;
  const isProduction = process.env.NODE_ENV === "production";

  return NextResponse.json(
    {
      ok: coreHealthy,
      service: "vision-labs-pathway",
      checkedAt: new Date().toISOString(),
      checks: {
        coreApp: coreHealthy,
        supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
        email: Boolean(process.env.RESEND_API_KEY),
        operations: {
          supabaseServiceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          cronConfigured: Boolean(process.env.CRON_SECRET)
        }
      },
      ...(isProduction ? {} : { missingCore, missingOps })
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
