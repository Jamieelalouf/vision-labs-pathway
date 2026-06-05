import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { getCurrentDancer, requireUser } from "@/server/queries/auth";
import { ProfileCompleteness, type CompletenessItem } from "@/components/portal/profile-completeness";
import { ProfileForm, type ProfileFormDefaults } from "@/components/portal/profile-form";
import { ProfilePhotoUploader } from "@/components/portal/profile-photo-uploader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createServerClient } from "@/lib/supabase/server";

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
  const supabase = createServerClient();
  const avatarSignedUrl = dancer?.avatar_storage_path
    ? (await supabase.storage.from("profile-photos").createSignedUrl(dancer.avatar_storage_path, 60 * 10))
        .data?.signedUrl ?? null
    : null;

  const completenessItems: CompletenessItem[] = [
    { label: t("firstName"), done: Boolean(dancer?.first_name) },
    { label: t("lastName"), done: Boolean(dancer?.last_name) },
    { label: t("instagram"), done: Boolean(dancer?.instagram_handle) },
    { label: t("dateOfBirth"), done: Boolean(dancer?.date_of_birth) },
    { label: t("completenessPhoto"), done: Boolean(dancer?.avatar_storage_path) }
  ];

  return (
    <section className="max-w-4xl space-y-5 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:space-y-8 md:pb-8">
      <Card className="relative overflow-hidden rounded-[1.35rem] border-primary/30 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] shadow-[0_18px_60px_-24px_rgba(249,115,22,0.45)] md:rounded-3xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl md:-right-16 md:-top-16 md:h-56 md:w-56 md:bg-primary/25" aria-hidden="true" />
        <CardContent className="relative space-y-3 p-4 md:space-y-4 md:p-8">
          <Badge className="w-fit rounded-full bg-primary/20 text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
            {t("account")}
          </Badge>
          <h1 className="font-display text-2xl font-bold text-white md:text-5xl">{t("title")}</h1>
          <ProfilePhotoUploader
            locale={params.locale}
            initialImageUrl={avatarSignedUrl}
            copy={{
              title: t("profileVibeTitle"),
              subtitle: t("photoUploadHint"),
              uploading: t("photoUploading"),
              success: t("photoUploadSuccess"),
              uploadErrorPrefix: t("photoUploadErrorPrefix"),
              invalidType: t("photoInvalidType"),
              fileTooLarge: t("photoFileTooLarge")
            }}
          />
        </CardContent>
      </Card>

      <ProfileCompleteness
        items={completenessItems}
        title={t("completenessTitle")}
        allSetLabel={t("completenessAllSet")}
        missingLabel={t("completenessMissing")}
      />

      <div className="rounded-[1.35rem] border border-border/70 bg-secondary/10 p-1 md:rounded-3xl md:p-1.5">
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
