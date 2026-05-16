import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { defaultLocale, isLocale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";

const otpTypes: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change"];

export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const refreshToken = request.nextUrl.searchParams.get("refresh_token");
  const type = request.nextUrl.searchParams.get("type");
  const next = request.nextUrl.searchParams.get("next");
  const fallback = `/${locale}/reset-password`;
  const safeNext =
    next && (next === `/${locale}` || next.startsWith(`/${locale}/`)) ? next : fallback;

  const otpType = type && otpTypes.includes(type as EmailOtpType) ? (type as EmailOtpType) : null;

  if (code || (tokenHash && otpType) || (type === "recovery" && refreshToken)) {
    const supabase = createServerClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && otpType
        ? await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType
          })
        : await supabase.auth.refreshSession({
            refresh_token: refreshToken!
          });

    if (error) {
      return NextResponse.redirect(
        new URL(`/${locale}/forgot-password?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
