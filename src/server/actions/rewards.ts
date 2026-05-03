"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { generateRewardCode, getRewardLabel, rewardTierMeta } from "@/lib/domain/rewards";
import { sendEmail } from "@/lib/email";
import { createServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { requireCompleteDancerProfile } from "@/server/queries/auth";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function actionLocale(formData: FormData): Locale {
  const locale = readString(formData, "locale");
  return isLocale(locale) ? locale : defaultLocale;
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
  const code = generateRewardCode(reward.tier);
  const expiresAt = reward.expires_at ?? (season?.convention_end_date ? `${season.convention_end_date}T23:59:59.000Z` : new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString());

  let stripeCouponId: string | null = null;
  let stripePromotionCodeId: string | null = null;

  if (!meta.isFreePass) {
    const stripe = getStripe();
    const coupon = await stripe.coupons.create({
      amount_off: (meta.amountCad ?? 0) * 100,
      currency: "cad",
      duration: "once",
      max_redemptions: 1,
      name: `${meta.labelEn} reward`
    });
    const promotion = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
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

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: "Your VISION LABS reward code",
      html: `<p>You unlocked ${getRewardLabel(reward.tier, locale)}.</p><p>Your code: <strong>${code}</strong></p>`
    });
  }

  revalidatePath(`/${locale}/portal/rewards`);
  redirect(`/${locale}/portal/rewards?generated=${code}`);
}
