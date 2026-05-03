import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

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
import type { Locale } from "@/i18n/routing";
import { cn, formatDate } from "@/lib/utils";
import { bulkMarkAttendanceAction } from "@/server/actions/admin";
import { getAttendanceForCohortAdmin } from "@/server/queries/data";

const attendanceStatuses = ["unmarked", "present", "absent", "excused"] as const;

export default async function AdminCohortAttendancePage({
  params,
  searchParams
}: {
  params: { locale: Locale; cohort_id: string };
  searchParams?: { session?: string };
}) {
  const data = await getAttendanceForCohortAdmin(params.cohort_id);
  if (!data) notFound();

  const selectedSession =
    data.sessions.find((session: any) => session.id === searchParams?.session) ??
    data.sessions[0] ??
    null;

  const completionPreview = data.enrollments.filter((enrollment: any) => {
    const presentCount = (enrollment.attendance ?? []).filter((row: any) =>
      ["present", "excused"].includes(row.status)
    ).length;
    return presentCount >= 3;
  }).length;

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Button asChild variant="link" className="mb-3">
            <Link href={`/${params.locale}/admin/attendance`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Attendance hub
            </Link>
          </Button>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Attendance grid
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{data.cohort.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {formatDate(data.cohort.start_date, params.locale)} -{" "}
            {formatDate(data.cohort.end_date, params.locale)} · {data.cohort.location_name}
          </p>
        </div>
        <div className="grid gap-2 text-sm md:text-right">
          <Badge variant={data.cohort.status === "active" ? "success" : "secondary"}>
            {data.cohort.status}
          </Badge>
          <span className="text-muted-foreground">
            {completionPreview} dancer{completionPreview === 1 ? "" : "s"} on track to complete
          </span>
        </div>
      </div>

      {data.sessions.length === 0 ? (
        <EmptyState
          title="No sessions found"
          description="This cohort needs its four generated sessions before attendance can be marked."
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Session attendance</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Save each session after class. Excused attendance counts toward completion.
                </p>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {data.sessions.map((session: any) => (
                  <Button
                    key={session.id}
                    asChild
                    variant={selectedSession?.id === session.id ? "default" : "secondary"}
                    size="sm"
                    className={cn("min-w-28 justify-start")}
                  >
                    <Link
                      href={`/${params.locale}/admin/attendance/${params.cohort_id}?session=${session.id}`}
                    >
                      Week {session.session_number}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.enrollments.length === 0 || !selectedSession ? (
              <EmptyState
                title="No paid dancers yet"
                description="Paid, registered enrollments will appear here after Stripe confirms payment."
              />
            ) : (
              <form action={bulkMarkAttendanceAction} className="space-y-4">
                <input type="hidden" name="locale" value={params.locale} />
                <input type="hidden" name="cohort_id" value={params.cohort_id} />
                <input type="hidden" name="cohort_session_id" value={selectedSession.id} />

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dancer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>This season</TableHead>
                        <TableHead>Week {selectedSession.session_number}</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.enrollments.map((enrollment: any) => {
                        const dancer = Array.isArray(enrollment.dancers)
                          ? enrollment.dancers[0]
                          : enrollment.dancers;
                        const profile = Array.isArray(dancer?.profiles)
                          ? dancer?.profiles[0]
                          : dancer?.profiles;
                        const attendance = (enrollment.attendance ?? []).find(
                          (row: any) => row.cohort_session_id === selectedSession.id
                        );
                        const presentCount = (enrollment.attendance ?? []).filter((row: any) =>
                          ["present", "excused"].includes(row.status)
                        ).length;

                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              <Link
                                href={`/${params.locale}/admin/dancers/${dancer?.id}`}
                                className="hover:text-primary"
                              >
                                {dancer?.first_name} {dancer?.last_name}
                              </Link>
                            </TableCell>
                            <TableCell>{profile?.email ?? "-"}</TableCell>
                            <TableCell>{presentCount}/4 present or excused</TableCell>
                            <TableCell>
                              {attendance ? (
                                <select
                                  name={`status:${attendance.id}`}
                                  defaultValue={attendance.status}
                                  className="h-10 min-w-32 rounded-md border border-input bg-secondary px-3 text-sm"
                                >
                                  {attendanceStatuses.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Badge variant="muted">Missing row</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {attendance ? (
                                <Input
                                  name={`notes:${attendance.id}`}
                                  defaultValue={attendance.notes ?? ""}
                                  placeholder="Optional note"
                                  className="min-w-48"
                                />
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="sticky bottom-4 flex justify-end">
                  <Button>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save attendance
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
