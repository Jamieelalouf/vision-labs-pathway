import { PortalPageSkeleton } from "@/components/portal/portal-skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-3xl">
      <PortalPageSkeleton cards={3} />
    </div>
  );
}
