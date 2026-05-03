import Link from "next/link";

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
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { formatCad } from "@/lib/utils";
import { manuallyGrantReturningEligibilityAction } from "@/server/actions/admin";
import { getDancersForAdmin } from "@/server/queries/data";

export default async function AdminDancersPage({ params }: { params: { locale: Locale } }) {
  const dancers = await getDancersForAdmin();

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 5</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Dancers</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Scan enrollment health, rewards, returning-price eligibility, and dancer profiles.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All dancers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {dancers.length === 0 ? (
            <EmptyState
              title="No dancers yet"
              description="Dancers appear here after they complete their student profile."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IG</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completions</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Total paid</TableHead>
                  <TableHead>Returning override</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dancers.map((dancer: any) => {
                  const profile = Array.isArray(dancer.profiles)
                    ? dancer.profiles[0]
                    : dancer.profiles;
                  const enrollments = dancer.enrollments ?? [];
                  const rewards = dancer.dancer_rewards ?? [];
                  const completions = enrollments.filter(
                    (enrollment: any) => enrollment.completion_status === "completed"
                  ).length;
                  const paidEnrollments = enrollments.filter(
                    (enrollment: any) => enrollment.payment_status === "paid"
                  );
                  const totalPaid = paidEnrollments.reduce(
                    (sum: number, enrollment: any) => sum + enrollment.price_paid_cad,
                    0
                  );
                  const currentReward = rewards[0];

                  return (
                    <TableRow key={dancer.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/${params.locale}/admin/dancers/${dancer.id}`}
                          className="hover:text-primary"
                        >
                          {dancer.first_name} {dancer.last_name}
                        </Link>
                      </TableCell>
                      <TableCell>{profile?.email ?? "-"}</TableCell>
                      <TableCell>{dancer.instagram_handle ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={paidEnrollments.length > 0 ? "success" : "secondary"}>
                          {paidEnrollments.length > 0 ? "active" : "profile"}
                        </Badge>
                      </TableCell>
                      <TableCell>{completions}</TableCell>
                      <TableCell>
                        <TierBadge tier={currentReward?.tier ?? null} />
                      </TableCell>
                      <TableCell>{formatCad(totalPaid, params.locale)}</TableCell>
                      <TableCell>
                        <form
                          action={manuallyGrantReturningEligibilityAction}
                          className="flex min-w-56 gap-2"
                        >
                          <input type="hidden" name="locale" value={params.locale} />
                          <input type="hidden" name="dancer_id" value={dancer.id} />
                          <Input name="reason" placeholder="Reason" className="h-9" />
                          <Button size="sm" variant="secondary">
                            Grant
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
