import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { defaultLocale, locales } from "@/i18n/routing";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always"
});

const protectedPortal = /^\/(en|fr)\/portal(\/|$)/;
const protectedAdmin = /^\/(en|fr)\/admin(\/|$)/;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  let response = intlMiddleware(request);

  if (!protectedPortal.test(pathname) && !protectedAdmin.test(pathname)) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (protectedAdmin.test(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      const locale = pathname.split("/")[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/portal/dashboard`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|fr)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"]
};
