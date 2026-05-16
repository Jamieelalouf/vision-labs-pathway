import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
        <CardContent className="space-y-4">
          {enrollments.map((enrollment: any) => {
            const dancer = Array.isArray(enrollment.dancers) ? enrollment.dancers[0] : enrollment.dancers;
            const cohort = Array.isArray(enrollment.cohorts) ? enrollment.cohorts[0] : enrollment.cohorts;
            return (
              <Card key={enrollment.id} className="border-border/70 bg-secondary/10">
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <p>
                      <span className="text-muted-foreground">Dancer:</span>{" "}
                      <span className="font-medium">
                        {dancer?.first_name} {dancer?.last_name}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Cohort:</span>{" "}
                      <span className="font-medium">{cohort?.name ?? "-"}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      <span className="font-medium">
                        {formatCad(enrollment.price_paid_cad, params.locale)} / {enrollment.price_type}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Current payment:</span> {enrollment.payment_status}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Current enrollment:</span> {enrollment.enrollment_status}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Current completion:</span> {enrollment.completion_status ?? "-"}
                    </p>
                  </div>
                  <form action={overrideEnrollmentAction} className="grid gap-3 md:grid-cols-3">
                    <input type="hidden" name="locale" value={params.locale} />
                    <input type="hidden" name="enrollment_id" value={enrollment.id} />
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Payment override</p>
                      <select
                        name="payment_status"
                        defaultValue=""
                        className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm"
                      >
                        <option value="">No change</option>
                        {["pending", "paid", "failed", "refunded"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Enrollment override</p>
                      <select
                        name="enrollment_status"
                        defaultValue=""
                        className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm"
                      >
                        <option value="">No change</option>
                        {["pending", "registered", "completed", "dropped", "refunded", "cancelled"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Completion override</p>
                      <select
                        name="completion_status"
                        defaultValue=""
                        className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm"
                      >
                        <option value="">No change</option>
                        <option value="completed">completed</option>
                        <option value="incomplete">incomplete</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Admin notes</p>
                      <Textarea name="admin_notes" placeholder="Admin notes" className="min-h-16" />
                    </div>
                    <div className="md:col-span-3">
                      <Button size="sm" variant="secondary">
                        Save override
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
