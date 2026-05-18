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
import { formatCad } from "@/lib/utils";
import { overrideEnrollmentAction } from "@/server/actions/admin";
import { getEnrollmentsForAdmin } from "@/server/queries/data";

function badgeVariant(status: string | null | undefined) {
  if (!status) return "secondary" as const;
  if (status === "paid" || status === "registered" || status === "completed") return "success" as const;
  if (status === "failed" || status === "cancelled" || status === "dropped" || status === "refunded") {
    return "muted" as const;
  }
  return "secondary" as const;
}

export default async function AdminEnrollmentsPage({ params }: { params: { locale: Locale } }) {
  const enrollments = await getEnrollmentsForAdmin();
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 5</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Enrollments</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Enrollments are cohort-specific registration and payment records. Dancers contains each
          dancer profile across all cohorts.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enrollment operations</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {enrollments.length === 0 ? (
            <EmptyState
              title="No enrollments yet"
              description="Enrollments appear here after dancers register for a cohort."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dancer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead className="w-[380px]">Override</TableHead>
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
                  const profile = Array.isArray(dancer?.profiles) ? dancer.profiles[0] : dancer?.profiles;
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {dancer?.first_name} {dancer?.last_name}
                      </TableCell>
                      <TableCell>{profile?.email ?? "-"}</TableCell>
                      <TableCell>{cohort?.name ?? "-"}</TableCell>
                      <TableCell>
                        {formatCad(enrollment.price_paid_cad, params.locale)} / {enrollment.price_type}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(enrollment.payment_status)}>
                          {enrollment.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(enrollment.enrollment_status)}>
                          {enrollment.enrollment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(enrollment.completion_status)}>
                          {enrollment.completion_status ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <form
                          action={overrideEnrollmentAction}
                          className="grid gap-2 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr]"
                        >
                          <input type="hidden" name="locale" value={params.locale} />
                          <input type="hidden" name="enrollment_id" value={enrollment.id} />
                          <select
                            name="payment_status"
                            defaultValue=""
                            className="h-9 rounded-md border border-input bg-secondary px-2 text-xs"
                            aria-label="Payment override"
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
                            aria-label="Enrollment override"
                          >
                            <option value="">Enrollment</option>
                            {["pending", "registered", "completed", "dropped", "refunded", "cancelled"].map(
                              (status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              )
                            )}
                          </select>
                          <select
                            name="completion_status"
                            defaultValue=""
                            className="h-9 rounded-md border border-input bg-secondary px-2 text-xs"
                            aria-label="Completion override"
                          >
                            <option value="">Completion</option>
                            <option value="completed">completed</option>
                            <option value="incomplete">incomplete</option>
                          </select>
                          <Input
                            name="admin_notes"
                            defaultValue={enrollment.admin_notes ?? ""}
                            placeholder="Notes"
                            className="h-9 text-xs sm:col-span-2 lg:col-span-2"
                          />
                          <Button size="sm" variant="secondary" className="h-9">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
