import { PortalShell } from "@/components/layout/portal-shell";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/server/queries/auth";

export default async function PortalLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  await requireUser(params.locale);

  return <PortalShell locale={params.locale}>{children}</PortalShell>;
}
