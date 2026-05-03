import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { requireCompleteDancerProfile } from "@/server/queries/auth";

export default async function RewardsPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Convention reward</p>
        <h1 className="mt-2 font-display text-4xl font-bold">My Rewards</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Current reward</CardTitle>
            <TierBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Reward code generation lands in Phase 7. For Phase 1, this page establishes the authenticated route and state surface.
          </p>
          <Button disabled>Get my code</Button>
        </CardContent>
      </Card>
    </section>
  );
}
