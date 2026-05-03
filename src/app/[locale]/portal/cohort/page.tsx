import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { requireCompleteDancerProfile } from "@/server/queries/auth";

export default async function MyCohortPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);

  return (
    <section className="space-y-6">
      <h1 className="font-display text-4xl font-bold">My Cohort</h1>
      <EmptyState
        title="No active cohort yet"
        description="After payment is confirmed, your current cohort details, sessions, and resources will appear here."
        action={
          <Button asChild>
            <Link href={`/${params.locale}/cohorts`}>View cohorts</Link>
          </Button>
        }
      />
    </section>
  );
}
