import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { RewardCard } from "@/components/vision/reward-card";
import type { Locale } from "@/i18n/routing";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

export default async function PortalPathwayPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const portal = await getStudentPortalData();
  const completed = portal?.reward?.cohorts_completed_count ?? 0;
  const completedEnrollments = portal?.enrollments.filter((enrollment) => enrollment.completion_status === "completed") ?? [];

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">LABS Pathway</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Your progress</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{completed} cohorts completed{portal?.activeSeason?.name ? ` in ${portal.activeSeason.name}` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          <PathwayProgress completed={completed} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <RewardCard tier="member" title="LABS Member" reward="$25 off VISION Convention" required={1} />
        <RewardCard tier="alumni" title="LABS Alumni" reward="$50 off VISION Convention" required={2} />
        <RewardCard tier="elite" title="LABS Elite" reward="$100 off VISION Convention" required={3} />
        <RewardCard tier="legacy" title="LABS Legacy" reward="Free Weekend Pass" required={5} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Completed cohorts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {completedEnrollments.length ? completedEnrollments.map((enrollment: any) => {
            const cohort = Array.isArray(enrollment.cohorts) ? enrollment.cohorts[0] : enrollment.cohorts;
            return <p key={enrollment.id}>{cohort?.name ?? "Cohort"} - {enrollment.updated_at?.slice(0, 10)}</p>;
          }) : "No completed cohorts yet."}
        </CardContent>
      </Card>
    </section>
  );
}
