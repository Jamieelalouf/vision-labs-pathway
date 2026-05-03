import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { Locale } from "@/i18n/routing";
import { formatCad } from "@/lib/utils";
import { overrideEnrollmentAction } from "@/server/actions/admin";
import { getEnrollmentsForAdmin } from "@/server/queries/data";

export default async function AdminEnrollmentsPage({ params }: { params: { locale: Locale } }) {
  const enrollments = await getEnrollmentsForAdmin();
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 5</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Enrollments</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enrollment operations</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dancer</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment: any) => {
                const dancer = Array.isArray(enrollment.dancers)
                  ? enrollment.dancers[0]
                  : enrollment.dancers;
                const cohort = Array.isArray(enrollment.cohorts)
                  ? enrollment.cohorts[0]
                  : enrollment.cohorts;
                return (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {dancer?.first_name} {dancer?.last_name}
                    </TableCell>
                    <TableCell>{cohort?.name ?? "-"}</TableCell>
                    <TableCell>
                      {formatCad(enrollment.price_paid_cad, params.locale)} /{" "}
                      {enrollment.price_type}
                    </TableCell>
                    <TableCell>{enrollment.payment_status}</TableCell>
                    <TableCell>{enrollment.enrollment_status}</TableCell>
                    <TableCell>{enrollment.completion_status ?? "-"}</TableCell>
                    <TableCell>
                      <form action={overrideEnrollmentAction} className="grid min-w-[360px] gap-2">
                        <input type="hidden" name="locale" value={params.locale} />
                        <input type="hidden" name="enrollment_id" value={enrollment.id} />
                        <div className="flex gap-2">
                          <select
                            name="payment_status"
                            defaultValue=""
                            className="h-9 rounded-md border border-input bg-secondary px-2 text-xs"
                          >
                            <option value="">Payment</option>
                            {["pending", "paid", "failed", "refunded"].map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <select
                            name="enrollment_status"
                            defaultValue=""
                            className="h-9 rounded-md border border-input bg-secondary px-2 text-xs"
                          >
                            <option value="">Enrollment</option>
                            {[
                              "pending",
                              "registered",
                              "completed",
                              "dropped",
                              "refunded",
                              "cancelled"
                            ].map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <select
                            name="completion_status"
                            defaultValue=""
                            className="h-9 rounded-md border border-input bg-secondary px-2 text-xs"
                          >
                            <option value="">Completion</option>
                            <option value="completed">completed</option>
                            <option value="incomplete">incomplete</option>
                          </select>
                        </div>
                        <Textarea
                          name="admin_notes"
                          placeholder="Admin notes"
                          className="min-h-16"
                        />
                        <Button size="sm" variant="secondary">
                          Save override
                        </Button>
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
