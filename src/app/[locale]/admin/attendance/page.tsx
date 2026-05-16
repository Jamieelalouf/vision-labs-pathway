import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";

export default async function AdminAttendancePage({ params }: { params: { locale: Locale } }) {
  redirect(`/${params.locale}/admin`);
}
