"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { determinePriceType } from "@/lib/domain/pricing";
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

async function createCheckoutSession(cohortId: string, locale: Locale) {
  const dancer = await requireCompleteDancerProfile(locale);
  const supabase = createServerClient();

  const { data: cohort } = await supabase
    .from("cohorts")
    .select(
      "id,name,season_id,status,registration_status,capacity,regular_price_cad,returning_price_cad"
    )
    .eq("id", cohortId)
    .maybeSingle();

  if (!cohort || cohort.status !== "open" || cohort.registration_status !== "open") {
    throw new Error("This cohort is not open for registration.");
  }

  const { count: paidCount } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("cohort_id", cohort.id)
    .eq("payment_status", "paid")
    .in("enrollment_status", ["registered", "completed"]);

  if ((paidCount ?? 0) >= cohort.capacity) {
    await supabase.from("cohorts").update({ registration_status: "full" }).eq("id", cohort.id);
    throw new Error("This cohort is full.");
  }

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id,payment_status,enrollment_status,stripe_checkout_session_id")
    .eq("dancer_id", dancer.id)
    .eq("cohort_id", cohort.id)
    .maybeSingle();

  if (existing?.payment_status === "paid") {
    return `/${locale}/portal/dashboard?registration=already-registered`;
  }

  const decision = await determinePriceType(supabase, dancer.id, cohort.id);
  const priceId = decision.priceId;

  if (!priceId) {
    throw new Error("Stripe price IDs are not configured in system settings.");
  }

  const { data: enrollmentId, error: enrollmentError } = await supabase.rpc(
    "reserve_cohort_enrollment",
    {
      p_dancer_id: dancer.id,
      p_cohort_id: cohort.id,
      p_price_type: decision.priceType,
      p_price_paid_cad: decision.amountCad
    }
  );

  if (enrollmentError || !enrollmentId) {
    throw new Error(enrollmentError?.message ?? "Unable to reserve enrollment.");
  }

  const { data: reservedEnrollment } = await supabase
    .from("enrollments")
    .select("payment_status")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (reservedEnrollment?.payment_status === "paid") {
    return `/${locale}/portal/dashboard?registration=already-registered`;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();
  const checkoutMetadata = {
    cohort_id: cohort.id,
    dancer_id: dancer.id,
    enrollment_id: enrollmentId,
    price_type: decision.priceType,
    returning_override_id: decision.overrideId ?? ""
  };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: enrollmentId,
    customer_email: user?.email ?? undefined,
    metadata: checkoutMetadata,
    payment_intent_data: {
      metadata: checkoutMetadata
    },
    success_url: `${origin}/${locale}/portal/dashboard?registration=success`,
    cancel_url: `${origin}/${locale}/cohorts/${cohort.id}?registration=cancelled`
  });

  await supabase
    .from("enrollments")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", enrollmentId);

  return session.url ?? `/${locale}/portal/dashboard`;
}

export async function createCheckoutSessionAction(
  cohortId: string,
  locale: Locale = defaultLocale
) {
  return createCheckoutSession(cohortId, locale);
}

export async function registerForCohortAction(formData: FormData) {
  const locale = actionLocale(formData);
  const cohortId = readString(formData, "cohort_id");
  let url: string;

  try {
    url = await createCheckoutSession(cohortId, locale);
  } catch (error) {
    redirect(
      `/${locale}/cohorts/${cohortId}?error=${encodeURIComponent((error as Error).message)}`
    );
  }

  redirect(url);
}

export async function markDevEnrollmentPaidAction(formData: FormData) {
  const locale = actionLocale(formData);

  if (process.env.NODE_ENV !== "development") {
    redirect(`/${locale}/portal/dashboard?error=not-available`);
  }
  const dancer = await requireCompleteDancerProfile(locale);
  const enrollmentId = readString(formData, "enrollment_id");
  const supabase = createServerClient();

  const { error } = await supabase
    .from("enrollments")
    .update({
      payment_status: "paid",
      enrollment_status: "registered"
    })
    .eq("id", enrollmentId)
    .eq("dancer_id", dancer.id);

  if (!error) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "VISION LABS registration confirmed",
        html: "<p>Your VISION LABS registration is confirmed.</p>"
      });
    }
  }

  revalidatePath(`/${locale}/portal/dashboard`);
  redirect(`/${locale}/portal/dashboard`);
}
