"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { generateRewardCode, getRewardLabel, rewardTierMeta } from "@/lib/domain/rewards";
import { sendEmail } from "@/lib/email";
import { createServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { rewardExpiresAt } from "@/server/rewards/automation";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function actionLocale(formData: FormData): Locale {
  const locale = readString(formData, "locale");
  return isLocale(locale) ? locale : defaultLocale;
}

async function createUniqueRewardCode(
  supabase: ReturnType<typeof createServerClient>,
  tier: keyof typeof rewardTierMeta
) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateRewardCode(tier);
    const { data } = await supabase
      .from("discount_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }

  return `${generateRewardCode(tier)}-${Date.now().toString(36).toUpperCase()}`;
}

export async function claimRewardCodeAction(formData: FormData) {
  const locale = actionLocale(formData);
  const rewardId = readString(formData, "dancer_reward_id");
  const dancer = await requireCompleteDancerProfile(locale);
  const supabase = createServerClient();

  const { data: reward } = await supabase
    .from("dancer_rewards")
    .select("*, seasons!inner(id,convention_end_date), discount_codes(*)")
    .eq("id", rewardId)
    .eq("dancer_id", dancer.id)
    .maybeSingle();

  if (!reward || reward.status !== "unlocked") {
    redirect(`/${locale}/portal/rewards?error=not-claimable`);
  }

  const season = Array.isArray(reward.seasons) ? reward.seasons[0] : reward.seasons;
  const meta = rewardTierMeta[reward.tier];
  const code = await createUniqueRewardCode(supabase, reward.tier);
  const expiresAt = reward.expires_at ?? rewardExpiresAt(season?.convention_end_date ?? null);
  if (new Date(expiresAt).getTime() <= Date.now()) {
    await supabase.from("dancer_rewards").update({ status: "expired" }).eq("id", reward.id);
    redirect(`/${locale}/portal/rewards?error=expired`);
  }
  const { data: settings } = await supabase
    .from("system_settings")
    .select("legacy_pass_uses_stripe")
    .eq("id", 1)
    .maybeSingle();
  const shouldCreateStripeCode = !meta.isFreePass || settings?.legacy_pass_uses_stripe;

  let stripeCouponId: string | null = null;
  let stripePromotionCodeId: string | null = null;

  if (shouldCreateStripeCode) {
    const stripe = getStripe();
    const coupon = meta.isFreePass
      ? await stripe.coupons.create({
          percent_off: 100,
          duration: "once",
          max_redemptions: 1,
          name: `${meta.labelEn} reward`
        })
      : await stripe.coupons.create({
          amount_off: (meta.amountCad ?? 0) * 100,
          currency: "cad",
          duration: "once",
          max_redemptions: 1,
          name: `${meta.labelEn} reward`
        });
    const promotion = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      expires_at: Math.floor(new Date(expiresAt).getTime() / 1000),
      max_redemptions: 1,
      metadata: {
        dancer_id: dancer.id,
        season_id: reward.season_id,
        reward_id: reward.id
      }
    });
    stripeCouponId = coupon.id;
    stripePromotionCodeId = promotion.id;
  }

  const { data: discountCode, error } = await supabase
    .from("discount_codes")
    .insert({
      code,
      dancer_id: dancer.id,
      season_id: reward.season_id,
      type: "convention",
      amount_cad: meta.amountCad,
      is_free_pass: meta.isFreePass,
      status: "active",
      stripe_coupon_id: stripeCouponId,
      stripe_promotion_code_id: stripePromotionCodeId,
      stackable: false,
      expires_at: expiresAt
    })
    .select("id")
    .single();

  if (error || !discountCode) {
    redirect(`/${locale}/portal/rewards?error=${encodeURIComponent(error?.message ?? "code")}`);
  }

  await supabase
    .from("dancer_rewards")
    .update({
      discount_code_id: discountCode.id,
      status: "generated",
      generated_at: new Date().toISOString(),
      expires_at: expiresAt
    })
    .eq("id", reward.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("email,language_pref")
    .eq("id", dancer.profile_id)
    .maybeSingle();
  const emailLocale = profile?.language_pref === "en" ? "en" : "fr";
  if (profile?.email) {
    await sendEmail({
      to: profile.email,
      subject:
        emailLocale === "fr" ? "Ton code recompense VISION LABS" : "Your VISION LABS reward code",
      html:
        emailLocale === "fr"
          ? `<p>Tu as debloque ${getRewardLabel(reward.tier, "fr")}.</p><p>Ton code: <strong>${code}</strong></p>`
          : `<p>You unlocked ${getRewardLabel(reward.tier, "en")}.</p><p>Your code: <strong>${code}</strong></p>`
    });
  }

  revalidatePath(`/${locale}/portal/rewards`);
  redirect(`/${locale}/portal/rewards?generated=${code}`);
}
