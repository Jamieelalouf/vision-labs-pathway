import { CheckCircle2, Clock, Lock, Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiscountCodeReveal } from "@/components/vision/discount-code-reveal";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { getRewardLabel } from "@/lib/domain/rewards";
import { formatDate } from "@/lib/utils";
import { claimRewardCodeAction } from "@/server/actions/rewards";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

export default async function RewardsPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.rewards" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const portal = await getStudentPortalData();
  const reward = portal?.reward;
  const code = reward?.discount_codes
    ? Array.isArray(reward.discount_codes)
      ? reward.discount_codes[0]
      : reward.discount_codes
    : null;
  const rules = t.raw("rulesItems") as string[];
  const statusNote = reward
    ? {
        unlocked: t("unlockedNote"),
        generated: t("generatedNote"),
        redeemed: t("redeemedNote"),
        expired: t("expiredNote"),
        locked: t("empty")
      }[reward.status]
    : t("empty");
  const StatusIcon =
    reward?.status === "generated" || reward?.status === "redeemed"
      ? CheckCircle2
      : reward?.status === "expired"
        ? Clock
        : reward
          ? Ticket
          : Lock;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
      </div>

      <Card className={reward ? "border-primary/30" : undefined}>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle>{t("currentReward")}</CardTitle>
            <TierBadge tier={reward?.tier} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {reward ? (
            <>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-display text-3xl font-bold">
                    {getRewardLabel(reward.tier, params.locale)}
                  </p>
                  <Badge variant="outline" className="mt-4 w-fit uppercase tracking-[0.12em]">
                    {t("status")}: {reward.status}
                  </Badge>
                </div>
                <StatusIcon className="h-9 w-9 text-primary" aria-hidden="true" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{statusNote}</p>
              {reward.status === "unlocked" ? (
                <form action={claimRewardCodeAction}>
                  <input type="hidden" name="locale" value={params.locale} />
                  <input type="hidden" name="dancer_reward_id" value={reward.id} />
                  <Button size="lg">
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                    {t(reward.tier === "legacy" ? "claimLegacyPass" : "claimCode")}
                  </Button>
                </form>
              ) : null}
              {code ? (
                <DiscountCodeReveal
                  code={code.code}
                  expiresLabel={t("expires")}
                  expiresAt={code.expires_at ? formatDate(code.expires_at, params.locale) : null}
                  copyLabel={actions("copy")}
                  copiedLabel={actions("copied")}
                />
              ) : null}
            </>
          ) : (
            <div className="flex items-start gap-4">
              <Lock className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
              <p className="text-sm leading-6 text-muted-foreground">{t("empty")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("rules")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {rules.map((rule) => (
            <p key={rule}>{rule}</p>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
