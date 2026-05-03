import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Locale } from "@/i18n/routing";
import { markAttendanceAction } from "@/server/actions/admin";
import { getAttendanceForAdmin } from "@/server/queries/data";

export default async function AdminAttendancePage({ params }: { params: { locale: Locale } }) {
  const attendanceRows = await getAttendanceForAdmin();
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 5</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Attendance</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent attendance rows</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dancer</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRows.map((row: any) => {
                const enrollment = Array.isArray(row.enrollments) ? row.enrollments[0] : row.enrollments;
                const dancer = Array.isArray(enrollment?.dancers) ? enrollment?.dancers[0] : enrollment?.dancers;
                const cohort = Array.isArray(enrollment?.cohorts) ? enrollment?.cohorts[0] : enrollment?.cohorts;
                const session = Array.isArray(row.cohort_sessions) ? row.cohort_sessions[0] : row.cohort_sessions;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{dancer?.first_name} {dancer?.last_name}</TableCell>
                    <TableCell>{cohort?.name ?? "-"}</TableCell>
                    <TableCell>#{session?.session_number} - {session?.session_date}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      <form action={markAttendanceAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="locale" value={params.locale} />
                        <input type="hidden" name="attendance_id" value={row.id} />
                        <select name="status" defaultValue={row.status} className="h-9 rounded-md border border-input bg-secondary px-2 text-xs">
                          {["unmarked", "present", "absent", "excused"].map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <Input name="notes" placeholder="Notes" defaultValue={row.notes ?? ""} className="h-9 w-36" />
                        <Button size="sm" variant="secondary">Save</Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
