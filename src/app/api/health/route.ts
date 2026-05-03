import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET"
];

export function GET() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  const status = missing.length === 0 ? 200 : 503;
  const isProduction = process.env.NODE_ENV === "production";

  return NextResponse.json(
    {
      ok: missing.length === 0,
      service: "vision-labs-pathway",
      checkedAt: new Date().toISOString(),
      ...(isProduction ? {} : { missing })
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
