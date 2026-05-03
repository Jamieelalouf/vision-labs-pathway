import type { SupabaseClient } from "@supabase/supabase-js";

import { getRewardLabel, getTierLabel, rewardTierMeta, rewardTierRank } from "@/lib/domain/rewards";
import { sendEmail } from "@/lib/email";
import type { Database, RewardTier } from "@/lib/supabase/database.types";
import { getStripe } from "@/lib/stripe";

type RewardSnapshot = {
  id: string;
  tier: RewardTier;
  status: string;
  discount_code_id: string | null;
} | null;

type RewardContext = {
  email: string | null;
  locale: "en" | "fr";
  firstName: string | null;
};

export async function getRewardSnapshot(
  supabase: SupabaseClient<Database>,
  dancerId: string,
  seasonId: string
): Promise<RewardSnapshot> {
  const { data } = await supabase
    .from("dancer_rewards")
    .select("id,tier,status,discount_code_id")
    .eq("dancer_id", dancerId)
    .eq("season_id", seasonId)
    .maybeSingle();

  return data;
}

async function getRewardContext(
  supabase: SupabaseClient<Database>,
  dancerId: string
): Promise<RewardContext> {
  const { data } = await supabase
    .from("dancers")
    .select("first_name, profiles!inner(email,language_pref)")
    .eq("id", dancerId)
    .maybeSingle();
  const profile = Array.isArray(data?.profiles) ? data?.profiles[0] : data?.profiles;

  return {
    email: profile?.email ?? null,
    locale: profile?.language_pref === "en" ? "en" : "fr",
    firstName: data?.first_name ?? null
  };
}

export async function cancelStripePromotionForDiscountCode(
  supabase: SupabaseClient<Database>,
  discountCodeId: string | null | undefined
) {
  if (!discountCodeId) return;

  const { data: code } = await supabase
    .from("discount_codes")
    .select("id,stripe_promotion_code_id,status")
    .eq("id", discountCodeId)
    .maybeSingle();

  if (!code) return;

  if (code.stripe_promotion_code_id && process.env.STRIPE_SECRET_KEY) {
    try {
      await getStripe().promotionCodes.update(code.stripe_promotion_code_id, { active: false });
    } catch (error) {
      console.warn("[stripe promotion cancel skipped]", error);
    }
  }

  if (code.status === "active") {
    await supabase.from("discount_codes").update({ status: "cancelled" }).eq("id", code.id);
  }
}

export async function sendRewardChangeEmail({
  supabase,
  dancerId,
  seasonId,
  before,
  after
}: {
  supabase: SupabaseClient<Database>;
  dancerId: string;
  seasonId: string;
  before: RewardSnapshot;
  after?: RewardSnapshot;
}) {
  const resolvedAfter = after ?? (await getRewardSnapshot(supabase, dancerId, seasonId));
  const changed =
    before &&
    (!resolvedAfter ||
      before.tier !== resolvedAfter.tier ||
      before.status !== resolvedAfter.status ||
      before.discount_code_id !== resolvedAfter.discount_code_id);

  if (before?.status === "generated" && before.discount_code_id && changed) {
    await cancelStripePromotionForDiscountCode(supabase, before.discount_code_id);
  }

  if (!resolvedAfter) return;

  const isNew = !before;
  const isUpgrade =
    before && rewardTierRank[resolvedAfter.tier] > rewardTierRank[before.tier as RewardTier];
  if (!isNew && !isUpgrade) return;

  const context = await getRewardContext(supabase, dancerId);
  if (!context.email) return;

  const tierLabel = getTierLabel(resolvedAfter.tier, context.locale);
  const rewardLabel = getRewardLabel(resolvedAfter.tier, context.locale);
  const subject =
    context.locale === "fr"
      ? isNew
        ? `Tu as debloque ${tierLabel}`
        : `Ton statut LABS est passe a ${tierLabel}`
      : isNew
        ? `You unlocked ${tierLabel}`
        : `Your LABS status upgraded to ${tierLabel}`;
  const greeting = context.firstName ? `${context.firstName}, ` : "";
  const html =
    context.locale === "fr"
      ? `<p>${greeting}ta progression LABS vient d'etre mise a jour.</p><p><strong>${tierLabel}</strong>: ${rewardLabel}</p><p>Connecte-toi a ton portail pour reclamer ton code.</p>`
      : `<p>${greeting}your LABS Pathway progress was updated.</p><p><strong>${tierLabel}</strong>: ${rewardLabel}</p><p>Log in to your portal to claim your code.</p>`;

  await sendEmail({
    to: context.email,
    subject,
    html
  });
}

export async function sendManualRewardEmail({
  supabase,
  dancerId,
  tier
}: {
  supabase: SupabaseClient<Database>;
  dancerId: string;
  tier: RewardTier;
}) {
  const context = await getRewardContext(supabase, dancerId);
  if (!context.email) return;

  const tierLabel = getTierLabel(tier, context.locale);
  const rewardLabel = getRewardLabel(tier, context.locale);
  await sendEmail({
    to: context.email,
    subject:
      context.locale === "fr"
        ? `Recompense LABS accordee: ${tierLabel}`
        : `LABS reward granted: ${tierLabel}`,
    html:
      context.locale === "fr"
        ? `<p>Une recompense LABS a ete ajoutee a ton portail.</p><p><strong>${tierLabel}</strong>: ${rewardLabel}</p>`
        : `<p>A LABS reward has been added to your portal.</p><p><strong>${tierLabel}</strong>: ${rewardLabel}</p>`
  });
}

export function rewardExpiresAt(conventionEndDate?: string | null) {
  if (!conventionEndDate) {
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString();
  }

  const end = new Date(`${conventionEndDate}T23:59:59.000Z`);
  end.setUTCDate(end.getUTCDate() + 7);
  return end.toISOString();
}

export function rewardAmountForTier(tier: RewardTier) {
  return rewardTierMeta[tier].amountCad;
}
