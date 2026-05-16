import { NextRequest, NextResponse } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const fallback = `/${locale}/reset-password`;
  const safeNext =
    next && (next === `/${locale}` || next.startsWith(`/${locale}/`)) ? next : fallback;

  if (code) {
    const supabase = createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(`/${locale}/forgot-password?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
