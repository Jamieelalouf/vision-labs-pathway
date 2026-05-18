import type { RewardTier } from "@/lib/supabase/database.types";

export const rewardTiers = ["member", "alumni", "elite", "legacy"] as const;

export const rewardTierRank: Record<RewardTier, number> = {
  member: 1,
  alumni: 2,
  elite: 3,
  legacy: 4
};

export const rewardTierMeta: Record<
  RewardTier,
  {
    cohortsRequired: number;
    labelEn: string;
    labelFr: string;
    rewardEn: string;
    rewardFr: string;
    amountCad: number | null;
    isFreePass: boolean;
  }
> = {
  member: {
    cohortsRequired: 1,
    labelEn: "LABS Member",
    labelFr: "Membre LABS",
    rewardEn: "LABS Member Digital Badge",
    rewardFr: "Badge numerique Membre LABS",
    amountCad: 25,
    isFreePass: false
  },
  alumni: {
    cohortsRequired: 2,
    labelEn: "LABS Alumni",
    labelFr: "Ancien LABS",
    rewardEn: "LABS Alumni Digital Badge",
    rewardFr: "Badge numerique LABS Alumni",
    amountCad: 50,
    isFreePass: false
  },
  elite: {
    cohortsRequired: 3,
    labelEn: "LABS Elite",
    labelFr: "LABS Elite",
    rewardEn: "LABS Elite Digital Badge",
    rewardFr: "Badge numerique LABS Elite",
    amountCad: 100,
    isFreePass: false
  },
  legacy: {
    cohortsRequired: 5,
    labelEn: "LABS Legacy",
    labelFr: "LABS Legacy",
    rewardEn: "LABS Legacy Digital Badge",
    rewardFr: "Badge numerique LABS Legacy",
    amountCad: 200,
    isFreePass: false
  }
};

export function tierForCompletedCount(count: number): RewardTier | null {
  if (count >= 5) return "legacy";
  if (count >= 3) return "elite";
  if (count >= 2) return "alumni";
  if (count >= 1) return "member";
  return null;
}

export function nextTierForCompletedCount(count: number): RewardTier | null {
  if (count < 1) return "member";
  if (count < 2) return "alumni";
  if (count < 3) return "elite";
  if (count < 5) return "legacy";
  return null;
}

export function getRewardLabel(tier: RewardTier, locale: "en" | "fr") {
  const meta = rewardTierMeta[tier];
  return locale === "fr" ? meta.rewardFr : meta.rewardEn;
}

export function getTierLabel(tier: RewardTier, locale: "en" | "fr") {
  const meta = rewardTierMeta[tier];
  return locale === "fr" ? meta.labelFr : meta.labelEn;
}

export function generateRewardCode(tier: RewardTier) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LABS-${tier.toUpperCase()}-${random}`;
}
