import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { requireCompleteDancerProfile } from "@/server/queries/auth";

export default async function VideosPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);

  return (
    <section className="space-y-6">
      <h1 className="font-display text-4xl font-bold">Videos</h1>
      <EmptyState
        title="No videos yet"
        description="Video uploads and external links are scheduled for Phase 6. This route is ready for that work."
        action={<Button disabled>Upload video</Button>}
      />
    </section>
  );
}
