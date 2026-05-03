import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";
import { addExternalVideoLinkAction, deleteVideoAction } from "@/server/actions/videos";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

export default async function VideosPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.videos" });
  const portal = await getStudentPortalData();
  const currentCohort = portal?.currentEnrollment
    ? Array.isArray(portal.currentEnrollment.cohorts)
      ? portal.currentEnrollment.cohorts[0]
      : portal.currentEnrollment.cohorts
    : null;

  return (
    <section className="space-y-8">
      <h1 className="font-display text-4xl font-bold">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("externalTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addExternalVideoLinkAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="locale" value={params.locale} />
            <input type="hidden" name="cohort_id" value={currentCohort?.id ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="title">{t("titleLabel")}</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="external_url">{t("urlLabel")}</Label>
              <Input
                id="external_url"
                name="external_url"
                type="url"
                placeholder="https://youtube.com/..."
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">{t("descriptionLabel")}</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="md:col-span-2">
              <Button>{t("saveLink")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("uploadWorkflow")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use <code className="font-mono text-foreground">POST /api/storage/sign-upload</code> to
          request a signed upload URL, upload to Supabase Storage, then create the video record. The
          form-based external link flow is active here; a drag/drop client uploader can attach to
          the same endpoint.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("myVideos")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {portal?.videos.length ? (
            portal.videos.map((video: any) => (
              <div
                key={video.id}
                className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 md:flex-row md:items-center"
              >
                <div>
                  <p className="font-medium">{video.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {video.external_url ?? video.storage_path}
                  </p>
                </div>
                <form action={deleteVideoAction}>
                  <input type="hidden" name="locale" value={params.locale} />
                  <input type="hidden" name="video_id" value={video.id} />
                  <Button size="sm" variant="destructive">
                    {t("delete")}
                  </Button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("noVideos")}</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
