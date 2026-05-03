"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type LatestEnrollment = {
  payment_status: string;
  enrollment_status: string;
  cohorts?: { name?: string } | { name?: string }[] | null;
} | null;

export function PaymentStatusNotice({
  title,
  description,
  confirmedTitle
}: {
  title: string;
  description: string;
  confirmedTitle: string;
}) {
  const [enrollment, setEnrollment] = useState<LatestEnrollment>(null);
  const confirmed = enrollment?.payment_status === "paid";

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      const response = await fetch("/api/me/enrollments/latest", { cache: "no-store" });
      if (!response.ok || cancelled) return;
      const payload = (await response.json()) as { enrollment: LatestEnrollment };
      setEnrollment(payload.enrollment);

      if (payload.enrollment?.payment_status !== "paid" && attempts < 10) {
        window.setTimeout(poll, 3000);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className={confirmed ? "border-primary/40" : "border-border"}>
      <CardContent className="flex items-start gap-4 p-5">
        {confirmed ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" aria-hidden="true" />
        ) : (
          <Clock className="mt-0.5 h-5 w-5 flex-none text-primary" aria-hidden="true" />
        )}
        <div>
          <p className="font-display text-lg font-semibold">{confirmed ? confirmedTitle : title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
