import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Locale } from "@/i18n/routing";
import { formatCad } from "@/lib/utils";
import { manuallyGrantReturningEligibilityAction } from "@/server/actions/admin";
import { getDancersForAdmin } from "@/server/queries/data";

export default async function AdminDancersPage({ params }: { params: { locale: Locale } }) {
  const dancers = await getDancersForAdmin();
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 5</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Dancers</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All dancers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>IG</TableHead>
                <TableHead>Completions</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Total paid</TableHead>
                <TableHead>Grant returning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dancers.map((dancer: any) => {
                const profile = Array.isArray(dancer.profiles) ? dancer.profiles[0] : dancer.profiles;
                const enrollments = dancer.enrollments ?? [];
                const rewards = dancer.dancer_rewards ?? [];
                const completions = enrollments.filter((e: any) => e.completion_status === "completed").length;
                const totalPaid = enrollments
                  .filter((e: any) => e.payment_status === "paid")
                  .reduce((sum: number, e: any) => sum + e.price_paid_cad, 0);
                const currentReward = rewards[0];
                return (
                  <TableRow key={dancer.id}>
                    <TableCell className="font-medium">{dancer.first_name} {dancer.last_name}</TableCell>
                    <TableCell>{profile?.email ?? "-"}</TableCell>
                    <TableCell>{dancer.instagram_handle ?? "-"}</TableCell>
                    <TableCell>{completions}</TableCell>
                    <TableCell>{currentReward ? `${currentReward.tier} / ${currentReward.status}` : "-"}</TableCell>
                    <TableCell>{formatCad(totalPaid, params.locale)}</TableCell>
                    <TableCell>
                      <form action={manuallyGrantReturningEligibilityAction} className="flex gap-2">
                        <input type="hidden" name="locale" value={params.locale} />
                        <input type="hidden" name="dancer_id" value={dancer.id} />
                        <Input name="reason" placeholder="Reason" className="h-9 w-36" />
                        <Button size="sm" variant="secondary">Grant</Button>
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
