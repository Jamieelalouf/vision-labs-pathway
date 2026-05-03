import { AdminShell } from "@/components/layout/admin-shell";
import type { Locale } from "@/i18n/routing";
import { requireAdmin } from "@/server/queries/auth";

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  await requireAdmin(params.locale);

  return <AdminShell locale={params.locale}>{children}</AdminShell>;
}
