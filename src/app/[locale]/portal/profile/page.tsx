import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { getCurrentDancer, requireUser } from "@/server/queries/auth";
import { ProfileForm } from "./complete/page";

export default async function ProfilePage({ params }: { params: { locale: Locale } }) {
  await requireUser(params.locale);
  const dancer = await getCurrentDancer();
  const t = await getTranslations({ locale: params.locale, namespace: "portal.profile" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });

  return (
    <section>
      <h1 className="font-display text-4xl font-bold">{t("title")}</h1>
      <ProfileForm locale={params.locale} submitLabel={actions("saveProfile")} defaults={dancer ?? undefined} />
    </section>
  );
}
