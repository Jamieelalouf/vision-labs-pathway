import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";

export default async function AdminCohortAttendancePage({
  params
}: {
  params: { locale: Locale; cohort_id: string };
}) {
  redirect(`/${params.locale}/admin`);
}
