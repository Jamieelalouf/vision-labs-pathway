import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { getAttendanceCohortsForAdmin } from "@/server/queries/data";

export default async function AdminAttendancePage({ params }: { params: { locale: Locale } }) {
  const cohorts = await getAttendanceCohortsForAdmin();

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 5</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Attendance</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Pick a cohort to mark attendance by session. Paid, registered dancers appear in the
            cohort grid.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/${params.locale}/admin/cohorts`}>Manage cohorts</Link>
        </Button>
      </div>

      {cohorts.length === 0 ? (
        <EmptyState
          title="No cohorts ready for attendance"
          description="Create or open a cohort first. Once a cohort has paid enrollments, it can be run from this hub."
          action={
            <Button asChild>
              <Link href={`/${params.locale}/admin/cohorts`}>Go to cohorts</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {cohorts.map((cohort: any) => {
            const sessions = cohort.cohort_sessions ?? [];
            const enrollments = cohort.enrollments ?? [];
            const eligibleEnrollments = enrollments.filter(
              (enrollment: any) =>
                enrollment.payment_status === "paid" &&
                ["registered", "completed"].includes(enrollment.enrollment_status)
            );

            return (
              <Card key={cohort.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{cohort.name}</CardTitle>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        {formatDate(cohort.start_date, params.locale)} -{" "}
                        {formatDate(cohort.end_date, params.locale)}
                      </p>
                    </div>
                    <Badge variant={cohort.status === "active" ? "success" : "secondary"}>
                      {cohort.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-border bg-secondary p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Sessions
                      </p>
                      <p className="mt-2 font-display text-2xl font-bold">{sessions.length}/4</p>
                    </div>
                    <div className="rounded-md border border-border bg-secondary p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Enrollments
                      </p>
                      <p className="mt-2 font-display text-2xl font-bold">
                        {eligibleEnrollments.length}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-secondary p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Capacity
                      </p>
                      <p className="mt-2 font-display text-2xl font-bold">{cohort.capacity}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-4">
                    {[...sessions]
                      .sort((a: any, b: any) => a.session_number - b.session_number)
                      .map((session: any) => (
                        <div
                          key={session.id}
                          className="rounded-md border border-border bg-background p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">Week {session.session_number}</p>
                            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(session.session_date, params.locale)}
                          </p>
                        </div>
                      ))}
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/${params.locale}/admin/attendance/${cohort.id}`}>
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      Mark attendance
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
