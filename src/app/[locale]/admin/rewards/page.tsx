import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Locale } from "@/i18n/routing";
import { manuallyGrantRewardAction } from "@/server/actions/admin";
import { getDancersForAdmin, getRewardsForAdmin, getSeasons } from "@/server/queries/data";

export default async function AdminRewardsPage({ params }: { params: { locale: Locale } }) {
  const [rewards, dancers, seasons] = await Promise.all([
    getRewardsForAdmin(),
    getDancersForAdmin(),
    getSeasons()
  ]);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 7</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Rewards</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manual reward override</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={manuallyGrantRewardAction} className="grid gap-4 md:grid-cols-4">
            <input type="hidden" name="locale" value={params.locale} />
            <select name="dancer_id" className="h-11 rounded-md border border-input bg-secondary px-3 text-sm" required>
              <option value="">Dancer</option>
              {dancers.map((dancer: any) => <option key={dancer.id} value={dancer.id}>{dancer.first_name} {dancer.last_name}</option>)}
            </select>
            <select name="season_id" className="h-11 rounded-md border border-input bg-secondary px-3 text-sm" required>
              <option value="">Season</option>
              {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
            </select>
            <select name="tier" className="h-11 rounded-md border border-input bg-secondary px-3 text-sm" required>
              {["member", "alumni", "elite", "legacy"].map((tier) => <option key={tier} value={tier}>{tier}</option>)}
            </select>
            <Input name="admin_notes" placeholder="Reason" />
            <div className="md:col-span-4">
              <Button>Grant reward</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current rewards</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dancer</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward: any) => {
                const dancer = Array.isArray(reward.dancers) ? reward.dancers[0] : reward.dancers;
                const season = Array.isArray(reward.seasons) ? reward.seasons[0] : reward.seasons;
                const code = Array.isArray(reward.discount_codes) ? reward.discount_codes[0] : reward.discount_codes;
                return (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">{dancer?.first_name} {dancer?.last_name}</TableCell>
                    <TableCell>{season?.name ?? "-"}</TableCell>
                    <TableCell>{reward.tier}</TableCell>
                    <TableCell>{reward.status}</TableCell>
                    <TableCell>{reward.cohorts_completed_count}</TableCell>
                    <TableCell>{code?.code ?? "-"}</TableCell>
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
