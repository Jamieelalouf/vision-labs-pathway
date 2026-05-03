import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";

export default function PortalIndexPage({ params }: { params: { locale: Locale } }) {
  redirect(`/${params.locale}/portal/dashboard`);
}
