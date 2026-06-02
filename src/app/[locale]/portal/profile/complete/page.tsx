import { Camera, Instagram } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ProfileForm, type ProfileFormDefaults } from "@/components/portal/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { getCurrentDancer, requireUser } from "@/server/queries/auth";

export default async function CompleteProfilePage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { cohort?: string };
}) {
  await requireUser(params.locale);
  const dancer = await getCurrentDancer();
  const profileDefaults: ProfileFormDefaults | undefined = dancer
    ? {
        first_name: dancer.first_name,
        last_name: dancer.last_name,
        phone: dancer.phone,
        instagram_handle: dancer.instagram_handle,
        date_of_birth: dancer.date_of_birth,
        emergency_contact_name: dancer.emergency_contact_name,
        emergency_contact_phone: dancer.emergency_contact_phone,
        guardian_name: dancer.guardian_name,
        guardian_email: dancer.guardian_email,
        guardian_phone: dancer.guardian_phone
      }
    : undefined;
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  const profile = await getTranslations({ locale: params.locale, namespace: "portal.profile" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const dashboardHref = searchParams?.cohort
    ? `/${params.locale}/register?cohort=${encodeURIComponent(searchParams.cohort)}`
    : `/${params.locale}/portal/dashboard`;

  return (
    <section className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">VISION LABS</p>
        <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">{t("profileTitle")}</h1>
        <p className="mt-4 text-muted-foreground">{t("profileIntro")}</p>
      </div>
      <Card className="border-primary/20 bg-gradient-to-r from-secondary/50 to-background">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30">
            <Camera className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">{profile("profileVibeTitle")}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
              {profile("instagramHint")}
            </p>
          </div>
        </CardContent>
      </Card>
      <ProfileForm
        locale={params.locale}
        mode="full"
        cohort={searchParams?.cohort}
        dashboardHref={dashboardHref}
        submitLabel={actions("saveProfile")}
        defaults={profileDefaults}
        labels={{
          dancerDetails: profile("dancerDetails"),
          personal: profile("personal"),
          emergency: profile("emergency"),
          guardian: profile("guardian"),
          firstName: profile("firstName"),
          lastName: profile("lastName"),
          phone: profile("phone"),
          instagram: profile("instagram"),
          dateOfBirth: profile("dateOfBirth"),
          emergencyContactName: profile("emergencyContactName"),
          emergencyContactPhone: profile("emergencyContactPhone"),
          guardianName: profile("guardianName"),
          guardianEmail: profile("guardianEmail"),
          guardianPhone: profile("guardianPhone"),
          pending: profile("savePending"),
          success: profile("saveSuccess"),
          errorPrefix: profile("saveErrorPrefix"),
          goToDashboard: searchParams?.cohort ? actions("continue") : actions("goToDashboard")
        }}
      />
    </section>
  );
}
