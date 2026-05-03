import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

export default async function MyCohortPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const portal = await getStudentPortalData();
  const cohort = portal?.currentEnrollment
    ? Array.isArray(portal.currentEnrollment.cohorts)
      ? portal.currentEnrollment.cohorts[0]
      : portal.currentEnrollment.cohorts
    : null;
  const sessions = cohort?.cohort_sessions ?? [];
  const resources = cohort?.resources ?? [];

  return (
    <section className="space-y-6">
      <h1 className="font-display text-4xl font-bold">My Cohort</h1>
      {cohort ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{cohort.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{cohort.start_date} - {cohort.end_date}</p>
              <p>{cohort.location_name}</p>
              <p>{cohort.location_address}</p>
              <Button asChild className="mt-4">
                <Link href={`/${params.locale}/portal/videos`}>Upload video for this cohort</Link>
              </Button>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            {sessions.map((session: any) => (
              <Card key={session.id}>
                <CardContent className="p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Week {session.session_number}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{session.session_date}</p>
                  <p className="mt-2 text-sm">{session.theme_en ?? session.theme_fr ?? "Session theme TBA"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resources.length ? resources.map((resource: any) => (
                <a key={resource.id} href={resource.url} className="block text-sm text-primary">{resource.title_en}</a>
              )) : <p className="text-sm text-muted-foreground">No resources posted yet.</p>}
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          title="No active cohort yet"
          description="After payment is confirmed, your current cohort details, sessions, and resources will appear here."
          action={
            <Button asChild>
              <Link href={`/${params.locale}/cohorts`}>View cohorts</Link>
            </Button>
          }
        />
      )}
    </section>
  );
}
