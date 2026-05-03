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
    <section className="max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        {t("account")}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
      <ProfileForm
        locale={params.locale}
        submitLabel={actions("saveProfile")}
        defaults={dancer ?? undefined}
        labels={{
          dancerDetails: t("dancerDetails"),
          firstName: t("firstName"),
          lastName: t("lastName"),
          phone: t("phone"),
          instagram: t("instagram"),
          dateOfBirth: t("dateOfBirth"),
          emergencyName: t("emergencyName"),
          emergencyPhone: t("emergencyPhone"),
          guardianName: t("guardianName"),
          guardianEmail: t("guardianEmail"),
          guardianPhone: t("guardianPhone")
        }}
      />
    </section>
  );
}
