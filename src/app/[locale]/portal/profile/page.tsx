import { getTranslations } from "next-intl/server";
import { Camera, Instagram } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { getCurrentDancer, requireUser } from "@/server/queries/auth";
import { ProfileForm, type ProfileFormDefaults } from "@/components/portal/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProfilePage({ params }: { params: { locale: Locale } }) {
  await requireUser(params.locale);
  const dancer = await getCurrentDancer();
  const profileDefaults: ProfileFormDefaults | undefined = dancer
    ? {
        first_name: dancer.first_name,
        last_name: dancer.last_name,
        phone: dancer.phone,
        instagram_handle: dancer.instagram_handle,
        date_of_birth: dancer.date_of_birth
      }
    : undefined;
  const t = await getTranslations({ locale: params.locale, namespace: "portal.profile" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });

  return (
    <section className="max-w-4xl space-y-6 pb-36 md:space-y-8 md:pb-8">
      <Card className="relative overflow-hidden rounded-3xl border-primary/30 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] shadow-[0_18px_60px_-24px_rgba(249,115,22,0.45)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
        <CardContent className="relative space-y-4 p-5 md:p-8">
          <Badge className="w-fit rounded-full bg-primary/20 text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
            {t("account")}
          </Badge>
          <h1 className="font-display text-3xl font-bold text-white md:text-5xl">{t("title")}</h1>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 md:p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30 md:h-14 md:w-14">
              <Camera className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{t("profileVibeTitle")}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
                <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
                {t("instagramHint")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-border/70 bg-secondary/10 p-1.5">
        <ProfileForm
          locale={params.locale}
          mode="edit"
          dashboardHref={`/${params.locale}/portal/dashboard`}
          submitLabel={actions("saveProfile")}
          defaults={profileDefaults}
          labels={{
            dancerDetails: t("dancerDetails"),
            personal: t("personal"),
            firstName: t("firstName"),
            lastName: t("lastName"),
            phone: t("phone"),
            instagram: t("instagram"),
            dateOfBirth: t("dateOfBirth"),
            pending: t("savePending"),
            success: t("saveSuccess"),
            errorPrefix: t("saveErrorPrefix"),
            goToDashboard: actions("goToDashboard")
          }}
        />
      </div>
    </section>
  );
}
