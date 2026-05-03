import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { RewardCard } from "@/components/vision/reward-card";
import type { Locale } from "@/i18n/routing";
import { requireCompleteDancerProfile } from "@/server/queries/auth";

export default async function PortalPathwayPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">LABS Pathway</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Your progress</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Season progress</CardTitle>
        </CardHeader>
        <CardContent>
          <PathwayProgress completed={0} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <RewardCard tier="member" title="LABS Member" reward="$25 off VISION Convention" required={1} />
        <RewardCard tier="alumni" title="LABS Alumni" reward="$50 off VISION Convention" required={2} />
        <RewardCard tier="elite" title="LABS Elite" reward="$100 off VISION Convention" required={3} />
        <RewardCard tier="legacy" title="LABS Legacy" reward="Free Weekend Pass" required={5} />
      </div>
    </section>
  );
}
