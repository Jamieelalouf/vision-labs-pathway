import { PortalPageSkeleton } from "@/components/portal/portal-skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl">
      <PortalPageSkeleton cards={2} />
    </div>
  );
}
