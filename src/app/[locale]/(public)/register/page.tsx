import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/server/queries/auth";

async function resolveCohortPath(locale: Locale, cohortId?: string) {
  if (!cohortId || !hasSupabaseEnv()) {
    return `/${locale}/cohorts`;
  }

  const supabase = createServerClient();
  const { data: cohort } = await supabase
    .from("cohorts")
    .select("id")
    .eq("id", cohortId)
    .in("status", ["open", "active"])
    .maybeSingle();

  return cohort ? `/${locale}/cohorts/${encodeURIComponent(cohort.id)}` : `/${locale}/cohorts`;
}

export default async function RegisterPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { cohort?: string };
}) {
  const user = await getSessionUser();
  const cohortQuery = searchParams.cohort ? `?cohort=${searchParams.cohort}` : "";
  const cohortPath = await resolveCohortPath(params.locale, searchParams.cohort);

  if (!user) {
    redirect(`/${params.locale}/signup${cohortQuery}`);
  }

  redirect(cohortPath);
}
