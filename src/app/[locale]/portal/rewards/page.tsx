import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { getRewardLabel } from "@/lib/domain/rewards";
import { claimRewardCodeAction } from "@/server/actions/rewards";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

export default async function RewardsPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const portal = await getStudentPortalData();
  const reward = portal?.reward;
  const code = reward?.discount_codes
    ? Array.isArray(reward.discount_codes)
      ? reward.discount_codes[0]
      : reward.discount_codes
    : null;

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
            <TierBadge tier={reward?.tier} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {reward ? (
            <>
              <p className="text-lg font-semibold">{getRewardLabel(reward.tier, params.locale)}</p>
              <p className="text-sm text-muted-foreground">Status: {reward.status}</p>
              {reward.status === "unlocked" ? (
                <form action={claimRewardCodeAction}>
                  <input type="hidden" name="locale" value={params.locale} />
                  <input type="hidden" name="dancer_reward_id" value={reward.id} />
                  <Button>Get my code</Button>
                </form>
              ) : null}
              {code ? (
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reward code</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-primary">{code.code}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Expires {code.expires_at?.slice(0, 10)}</p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete your first paid cohort to unlock LABS Member.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Rewards upgrade and never stack.</p>
          <p>Codes are tied to the active season and expire after convention grace.</p>
          <p>LABS Legacy is a free Weekend Pass entitlement.</p>
        </CardContent>
      </Card>
    </section>
  );
}
