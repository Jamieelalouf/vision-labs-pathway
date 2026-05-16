import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

import { defaultLocale, isLocale } from "@/i18n/routing";
import type { Database } from "@/lib/supabase/database.types";

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
  const cookieCarrier = NextResponse.next();

  let authError: string | null = null;
  if (code || (tokenHash && otpType) || (type === "recovery" && refreshToken)) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieCarrier.cookies.set(name, value, options);
            });
          }
        }
      }
    );

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
      authError = error.message;
    }
  }

  const redirectPath = authError
    ? `/${locale}/forgot-password?error=${encodeURIComponent(authError)}`
    : safeNext;
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  for (const cookie of cookieCarrier.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  return response;
}
