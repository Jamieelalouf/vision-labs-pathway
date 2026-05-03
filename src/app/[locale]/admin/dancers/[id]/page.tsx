import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { EmptyState } from "@/components/vision/empty-state";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { formatCad, formatDate } from "@/lib/utils";
import { manuallyGrantReturningEligibilityAction } from "@/server/actions/admin";
import { getDancerForAdmin } from "@/server/queries/data";

function formatNullableDate(value: string | null | undefined, locale: Locale) {
  return value ? formatDate(value, locale) : "-";
}

export default async function AdminDancerDetailPage({
  params
}: {
  params: { locale: Locale; id: string };
}) {
  const dancer = (await getDancerForAdmin(params.id)) as any | null;
  if (!dancer) notFound();

  const profile = Array.isArray(dancer.profiles) ? dancer.profiles[0] : dancer.profiles;
  const enrollments = dancer.enrollments ?? [];
  const rewards = dancer.dancer_rewards ?? [];
  const videos = dancer.video_uploads ?? [];
  const overrides = dancer.returning_price_overrides ?? [];
  const completedCount = enrollments.filter(
    (enrollment: any) => enrollment.completion_status === "completed"
  ).length;
  const paidCount = enrollments.filter(
    (enrollment: any) => enrollment.payment_status === "paid"
  ).length;
  const totalPaid = enrollments
    .filter((enrollment: any) => enrollment.payment_status === "paid")
    .reduce((total: number, enrollment: any) => total + enrollment.price_paid_cad, 0);
  const currentReward = [...rewards].sort((a: any, b: any) =>
    String(b.unlocked_at ?? b.updated_at).localeCompare(String(a.unlocked_at ?? a.updated_at))
  )[0];

  return (
    <section className="space-y-8">
      <div>
        <Button asChild variant="link" className="mb-3">
          <Link href={`/${params.locale}/admin/dancers`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to dancers
          </Link>
        </Button>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Dancer profile
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold">
              {dancer.first_name} {dancer.last_name}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{profile?.email ?? "No email"}</p>
          </div>
          <TierBadge tier={currentReward?.tier ?? null} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Paid</p>
            <p className="mt-3 font-display text-3xl font-bold">{paidCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">cohort enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Completed</p>
            <p className="mt-3 font-display text-3xl font-bold">{completedCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">lifetime cohorts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Paid total</p>
            <p className="mt-3 font-display text-3xl font-bold">
              {formatCad(totalPaid, params.locale)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">CAD snapshot</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Videos</p>
            <p className="mt-3 font-display text-3xl font-bold">{videos.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">uploads or links</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Detail label="Phone" value={dancer.phone ?? "-"} />
            <Detail label="Instagram" value={dancer.instagram_handle ?? "-"} />
            <Detail
              label="Date of birth"
              value={formatNullableDate(dancer.date_of_birth, params.locale)}
            />
            <Detail label="Language" value={profile?.language_pref?.toUpperCase() ?? "-"} />
            <Detail label="Emergency contact" value={dancer.emergency_contact_name ?? "-"} />
            <Detail label="Emergency phone" value={dancer.emergency_contact_phone ?? "-"} />
            <Detail label="Guardian" value={dancer.guardian_name ?? "-"} />
            <Detail label="Guardian email" value={dancer.guardian_email ?? "-"} />
            <Detail label="Guardian phone" value={dancer.guardian_phone ?? "-"} />
            <Detail label="Internal notes" value={dancer.internal_notes ?? "-"} wide />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pathway control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <PathwayProgress completed={currentReward?.cohorts_completed_count ?? 0} />
            <div className="rounded-md border border-border bg-secondary p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="font-medium">Current reward</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentReward
                  ? `${currentReward.tier} · ${currentReward.status} · ${currentReward.cohorts_completed_count}/5`
                  : "No season reward has been unlocked yet."}
              </p>
            </div>
            <form action={manuallyGrantReturningEligibilityAction} className="space-y-3">
              <input type="hidden" name="locale" value={params.locale} />
              <input type="hidden" name="dancer_id" value={dancer.id} />
              <Input name="reason" placeholder="Reason for returning price override" />
              <Button variant="secondary" className="w-full">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Grant returning price
              </Button>
            </form>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Returning overrides
              </p>
              {overrides.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overrides granted.</p>
              ) : (
                overrides.slice(0, 4).map((override: any) => (
                  <div
                    key={override.id}
                    className="rounded-md border border-border bg-background p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{override.reason ?? "Manual override"}</span>
                      <Badge variant={override.consumed ? "muted" : "success"}>
                        {override.consumed ? "consumed" : "available"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires {formatDate(override.expires_at, params.locale)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminDancerTable
        title="Enrollments"
        emptyTitle="No enrollments yet"
        emptyDescription="This dancer has not registered for a cohort."
        isEmpty={enrollments.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cohort</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment: any) => {
              const cohort = Array.isArray(enrollment.cohorts)
                ? enrollment.cohorts[0]
                : enrollment.cohorts;
              return (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">{cohort?.name ?? "-"}</TableCell>
                  <TableCell>
                    {formatCad(enrollment.price_paid_cad, params.locale)} · {enrollment.price_type}
                  </TableCell>
                  <TableCell>
                    <Badge variant={enrollment.payment_status === "paid" ? "success" : "secondary"}>
                      {enrollment.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{enrollment.enrollment_status}</TableCell>
                  <TableCell>{enrollment.completion_status ?? "-"}</TableCell>
                  <TableCell>{formatDate(enrollment.created_at, params.locale)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDancerTable>

      <AdminDancerTable
        title="Rewards"
        emptyTitle="No rewards yet"
        emptyDescription="Rewards appear after the dancer completes cohorts in a season."
        isEmpty={rewards.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Season</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Unlocked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.map((reward: any) => {
              const season = Array.isArray(reward.seasons) ? reward.seasons[0] : reward.seasons;
              const code = Array.isArray(reward.discount_codes)
                ? reward.discount_codes[0]
                : reward.discount_codes;
              return (
                <TableRow key={reward.id}>
                  <TableCell className="font-medium">{season?.name ?? "-"}</TableCell>
                  <TableCell>{reward.tier}</TableCell>
                  <TableCell>{reward.status}</TableCell>
                  <TableCell>{reward.cohorts_completed_count}</TableCell>
                  <TableCell className="font-mono">{code?.code ?? "-"}</TableCell>
                  <TableCell>{formatDate(reward.unlocked_at, params.locale)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDancerTable>

      <AdminDancerTable
        title="Videos"
        emptyTitle="No videos yet"
        emptyDescription="Student uploads and external links will be listed here for review."
        isEmpty={videos.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video: any) => {
              const cohort = Array.isArray(video.cohorts) ? video.cohorts[0] : video.cohorts;
              const session = Array.isArray(video.cohort_sessions)
                ? video.cohort_sessions[0]
                : video.cohort_sessions;
              return (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">
                    {video.external_url ? (
                      <Link
                        href={video.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary"
                      >
                        {video.title}
                      </Link>
                    ) : (
                      video.title
                    )}
                  </TableCell>
                  <TableCell>{video.source}</TableCell>
                  <TableCell>{cohort?.name ?? "-"}</TableCell>
                  <TableCell>{session?.session_number ?? "General"}</TableCell>
                  <TableCell>{formatDate(video.created_at, params.locale)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminDancerTable>
    </section>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm text-foreground">{value}</p>
    </div>
  );
}

function AdminDancerTable({
  title,
  emptyTitle,
  emptyDescription,
  isEmpty,
  children
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isEmpty ? <EmptyState title={emptyTitle} description={emptyDescription} /> : children}
      </CardContent>
    </Card>
  );
}
