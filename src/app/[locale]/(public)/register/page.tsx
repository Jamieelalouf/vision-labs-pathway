import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";
import { getSessionUser } from "@/server/queries/auth";

export default async function RegisterPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { cohort?: string };
}) {
  const user = await getSessionUser();
  const cohortQuery = searchParams.cohort ? `?cohort=${searchParams.cohort}` : "";

  if (!user) {
    redirect(`/${params.locale}/signup${cohortQuery}`);
  }

  redirect(`/${params.locale}/portal/dashboard${cohortQuery}`);
}
