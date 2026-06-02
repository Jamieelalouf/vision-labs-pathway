import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { sendEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";
import { getRewardSnapshot, sendRewardChangeEmail } from "@/server/rewards/automation";

export const dynamic = "force-dynamic";

async function recordEvent(event: Stripe.Event) {
  const supabase = createServiceClient();
  const object = event.data.object as Stripe.Event.Data.Object & {
    id?: string;
    amount_total?: number;
    amount_received?: number;
    amount_refunded?: number;
    currency?: string;
    status?: string;
    metadata?: Record<string, string>;
  };

  const enrollmentId = object.metadata?.enrollment_id ?? null;
  const dancerId = object.metadata?.dancer_id ?? null;

  const { data: existing } = await supabase
    .from("payments")
    .select("id,processed_at")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing?.processed_at) {
    return { duplicate: true };
  }

  if (!existing) {
    await supabase.from("payments").insert({
      enrollment_id: enrollmentId,
      dancer_id: dancerId,
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      stripe_object_id: object.id ?? null,
      amount_cad: object.amount_total
        ? Math.round(object.amount_total / 100)
        : object.amount_received
          ? Math.round(object.amount_received / 100)
          : object.amount_refunded
            ? Math.round(object.amount_refunded / 100)
            : null,
      currency: object.currency ?? "cad",
      status: object.status ?? null,
      raw_payload: event as any
    });
  }

  return { duplicate: false };
}

function metadataValue(object: any, key: string) {
  const value = object?.metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function markEnrollmentPaid({
  enrollmentId,
  dancerId,
  paymentIntentId,
  returningOverrideId
}: {
  enrollmentId: string;
  dancerId: string | null;
  paymentIntentId: string | null;
  returningOverrideId: string | null;
}) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id,payment_status")
    .eq("id", enrollmentId)
    .maybeSingle();

  const wasAlreadyPaid = existing?.payment_status === "paid";

  await supabase
    .from("enrollments")
    .update({
      payment_status: "paid",
      enrollment_status: "registered",
      stripe_payment_intent_id: paymentIntentId
    })
    .eq("id", enrollmentId);

  if (returningOverrideId) {
    await supabase
      .from("returning_price_overrides")
      .update({ consumed: true, consumed_enrollment_id: enrollmentId })
      .eq("id", returningOverrideId)
      .eq("consumed", false);
  }

  if (!wasAlreadyPaid && dancerId) {
    const { data: dancer } = await supabase
      .from("dancers")
      .select("profiles!inner(email)")
      .eq("id", dancerId)
      .maybeSingle();
    const profile = Array.isArray(dancer?.profiles) ? dancer?.profiles[0] : dancer?.profiles;
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: "VISION LABS registration confirmed",
        html: "<p>Your VISION LABS registration is confirmed. Welcome to the cohort.</p>"
      });
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature config." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  const supabase = createServiceClient();
  const record = await recordEvent(event);
  if (record.duplicate) return NextResponse.json({ received: true });

  const object = event.data.object as any;
  const enrollmentId = metadataValue(object, "enrollment_id");
  const dancerId = metadataValue(object, "dancer_id");
  const returningOverrideId = metadataValue(object, "returning_override_id");
  const paymentIntentId =
    typeof object.payment_intent === "string"
      ? object.payment_intent
      : event.type.startsWith("payment_intent.")
        ? object.id
        : null;

  if (enrollmentId) {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded" ||
      event.type === "payment_intent.succeeded"
    ) {
      await markEnrollmentPaid({
        enrollmentId,
        dancerId,
        paymentIntentId,
        returningOverrideId
      });
    }

    if (
      event.type === "checkout.session.async_payment_failed" ||
      event.type === "payment_intent.payment_failed"
    ) {
      await supabase
        .from("enrollments")
        .update({ payment_status: "failed" })
        .eq("id", enrollmentId);
    }

    if (event.type === "checkout.session.expired") {
      await supabase
        .from("enrollments")
        .update({ enrollment_status: "cancelled" })
        .eq("id", enrollmentId)
        .eq("payment_status", "pending");
    }
  }

  if (event.type === "charge.refunded" && object.payment_intent) {
    const { data: refundedEnrollments } = await supabase
      .from("enrollments")
      .select("id,dancer_id,season_id")
      .eq("stripe_payment_intent_id", object.payment_intent);
    const beforeRewards = await Promise.all(
      (refundedEnrollments ?? []).map(async (enrollment) => ({
        enrollment,
        reward: await getRewardSnapshot(supabase, enrollment.dancer_id, enrollment.season_id)
      }))
    );

    await supabase
      .from("enrollments")
      .update({
        payment_status: "refunded",
        enrollment_status: "refunded",
        amount_refunded_cad: object.amount_refunded ? Math.round(object.amount_refunded / 100) : 0
      })
      .eq("stripe_payment_intent_id", object.payment_intent);

    await Promise.all(
      beforeRewards.map(({ enrollment, reward }) =>
        sendRewardChangeEmail({
          supabase,
          dancerId: enrollment.dancer_id,
          seasonId: enrollment.season_id,
          before: reward
        })
      )
    );
  }

  await supabase
    .from("payments")
    .update({ processed_at: new Date().toISOString() })
    .eq("stripe_event_id", event.id);

  return NextResponse.json({ received: true });
}
