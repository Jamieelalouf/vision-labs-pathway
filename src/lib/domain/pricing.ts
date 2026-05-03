import type { PriceType } from "@/lib/supabase/database.types";

type SupabaseLike = {
  from: (table: string) => any;
};

export type PriceDecision = {
  priceType: PriceType;
  priceId: string | null;
  amountCad: number;
  overrideId?: string;
};

export async function determinePriceType(
  supabase: SupabaseLike,
  dancerId: string,
  targetCohortId: string
): Promise<PriceDecision> {
  const { data: settings } = await supabase
    .from("system_settings")
    .select(
      "regular_price_cad,returning_price_cad,stripe_regular_price_id,stripe_returning_price_id"
    )
    .eq("id", 1)
    .maybeSingle();

  const { data: targetCohort } = await supabase
    .from("cohorts")
    .select("id,regular_price_cad,returning_price_cad")
    .eq("id", targetCohortId)
    .maybeSingle();

  const regularAmount = targetCohort?.regular_price_cad ?? settings?.regular_price_cad ?? 297;
  const returningAmount = targetCohort?.returning_price_cad ?? settings?.returning_price_cad ?? 247;

  const { data: override } = await supabase
    .from("returning_price_overrides")
    .select("id")
    .eq("dancer_id", dancerId)
    .eq("consumed", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (override) {
    return {
      priceType: "returning",
      priceId: settings?.stripe_returning_price_id ?? null,
      amountCad: returningAmount,
      overrideId: override.id
    };
  }

  const { data: completedRows } = await supabase
    .from("enrollments")
    .select("cohort_id, cohorts!inner(id,start_date,end_date)")
    .eq("dancer_id", dancerId)
    .eq("completion_status", "completed")
    .in("enrollment_status", ["completed", "registered"]);

  const lastCompleted = (completedRows ?? [])
    .map((row: any) => ({
      ...row,
      cohort: Array.isArray(row.cohorts) ? row.cohorts[0] : row.cohorts
    }))
    .filter((row: any) => row.cohort?.end_date)
    .sort((a: any, b: any) => b.cohort.end_date.localeCompare(a.cohort.end_date))[0];

  const lastCohort = lastCompleted?.cohort;

  if (!lastCohort?.end_date) {
    return {
      priceType: "regular",
      priceId: settings?.stripe_regular_price_id ?? null,
      amountCad: regularAmount
    };
  }

  const { data: immediateNext } = await supabase
    .from("cohorts")
    .select("id")
    .gt("start_date", lastCohort.end_date)
    .neq("status", "draft")
    .neq("status", "cancelled")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (immediateNext?.id === targetCohortId) {
    return {
      priceType: "returning",
      priceId: settings?.stripe_returning_price_id ?? null,
      amountCad: returningAmount
    };
  }

  return {
    priceType: "regular",
    priceId: settings?.stripe_regular_price_id ?? null,
    amountCad: regularAmount
  };
}
