import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIStat } from "@/components/vision/kpi-stat";
import type { Locale } from "@/i18n/routing";
import { requireAdmin } from "@/server/queries/auth";

export default async function AdminPage({ params }: { params: { locale: Locale } }) {
  await requireAdmin(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "admin.overview" });

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">VISION LABS</p>
        <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{t("intro")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <KPIStat label="Registered" value="0" sublabel="Current cohort" />
        <KPIStat label="Paid" value="0" sublabel="Confirmed" />
        <KPIStat label="Revenue" value="$0" sublabel="CAD" />
        <KPIStat label="Rewards" value="0" sublabel="Unlocked this season" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pending operational data</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("empty")}</CardContent>
      </Card>
    </section>
  );
}
