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
  const isProtectedRoute = protectedPortal.test(pathname) || protectedAdmin.test(pathname);

  if (isProtectedRoute && (pathname.startsWith("/fr/portal") || pathname.startsWith("/fr/admin"))) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = pathname.replace(/^\/fr\//, "/en/");
    return NextResponse.redirect(targetUrl, 308);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  let response = intlMiddleware(request);

  if (!isProtectedRoute) {
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
    const internalTarget =
      pathname.startsWith("/fr/") && (pathname.startsWith("/fr/portal") || pathname.startsWith("/fr/admin"))
        ? pathname.replace(/^\/fr\//, "/en/")
        : pathname;
    const nextTarget = `${internalTarget}${request.nextUrl.search}`;
    const loginUrl = new URL("/en/login", request.url);
    loginUrl.searchParams.set("next", nextTarget);
    return NextResponse.redirect(loginUrl);
  }

  if (protectedAdmin.test(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/en/portal/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|fr)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"]
};
