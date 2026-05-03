import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/routing";
import { updateDancerProfileAction } from "@/server/actions/auth";
import { requireUser } from "@/server/queries/auth";

export default async function CompleteProfilePage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { cohort?: string };
}) {
  await requireUser(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  const profile = await getTranslations({ locale: params.locale, namespace: "portal.profile" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });

  return (
    <section className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">VISION LABS</p>
      <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">{t("profileTitle")}</h1>
      <p className="mt-4 text-muted-foreground">{t("profileIntro")}</p>
      <ProfileForm
        locale={params.locale}
        cohort={searchParams?.cohort}
        submitLabel={actions("saveProfile")}
        labels={{
          dancerDetails: profile("dancerDetails"),
          firstName: profile("firstName"),
          lastName: profile("lastName"),
          phone: profile("phone"),
          instagram: profile("instagram"),
          dateOfBirth: profile("dateOfBirth"),
          emergencyName: profile("emergencyName"),
          emergencyPhone: profile("emergencyPhone"),
          guardianName: profile("guardianName"),
          guardianEmail: profile("guardianEmail"),
          guardianPhone: profile("guardianPhone")
        }}
      />
    </section>
  );
}

export function ProfileForm({
  locale,
  submitLabel,
  defaults,
  cohort,
  labels
}: {
  locale: Locale;
  submitLabel: string;
  defaults?: Record<string, string | null>;
  cohort?: string;
  labels: {
    dancerDetails: string;
    firstName: string;
    lastName: string;
    phone: string;
    instagram: string;
    dateOfBirth: string;
    emergencyName: string;
    emergencyPhone: string;
    guardianName: string;
    guardianEmail: string;
    guardianPhone: string;
  };
}) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{labels.dancerDetails}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateDancerProfileAction} className="grid gap-5 md:grid-cols-2">
          <input type="hidden" name="language_pref" value={locale} />
          <input type="hidden" name="cohort" value={cohort ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="first_name">{labels.firstName}</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={defaults?.first_name ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">{labels.lastName}</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={defaults?.last_name ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{labels.phone}</Label>
            <Input id="phone" name="phone" defaultValue={defaults?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram_handle">{labels.instagram}</Label>
            <Input
              id="instagram_handle"
              name="instagram_handle"
              defaultValue={defaults?.instagram_handle ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">{labels.dateOfBirth}</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={defaults?.date_of_birth ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">{labels.emergencyName}</Label>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={defaults?.emergency_contact_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">{labels.emergencyPhone}</Label>
            <Input
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              defaultValue={defaults?.emergency_contact_phone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian_name">{labels.guardianName}</Label>
            <Input
              id="guardian_name"
              name="guardian_name"
              defaultValue={defaults?.guardian_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian_email">{labels.guardianEmail}</Label>
            <Input
              id="guardian_email"
              name="guardian_email"
              type="email"
              defaultValue={defaults?.guardian_email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian_phone">{labels.guardianPhone}</Label>
            <Input
              id="guardian_phone"
              name="guardian_phone"
              defaultValue={defaults?.guardian_phone ?? ""}
            />
          </div>
          <div className="md:col-span-2">
            <Button>{submitLabel}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
