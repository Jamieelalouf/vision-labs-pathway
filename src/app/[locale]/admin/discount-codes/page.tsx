import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { Locale } from "@/i18n/routing";
import { markCodeRedeemedAction } from "@/server/actions/admin";
import { getDiscountCodesForAdmin } from "@/server/queries/data";

export default async function AdminDiscountCodesPage({ params }: { params: { locale: Locale } }) {
  const codes = await getDiscountCodesForAdmin();
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 7</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Discount Codes</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Issued codes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Dancer</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code: any) => {
                const dancer = Array.isArray(code.dancers) ? code.dancers[0] : code.dancers;
                const season = Array.isArray(code.seasons) ? code.seasons[0] : code.seasons;
                return (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">{code.code}</TableCell>
                    <TableCell>
                      {dancer?.first_name} {dancer?.last_name}
                    </TableCell>
                    <TableCell>{season?.name ?? "-"}</TableCell>
                    <TableCell>
                      {code.is_free_pass ? "Weekend Pass" : `$${code.amount_cad}`}
                    </TableCell>
                    <TableCell>{code.status}</TableCell>
                    <TableCell>{code.expires_at?.slice(0, 10)}</TableCell>
                    <TableCell>
                      {code.status === "active" ? (
                        <form action={markCodeRedeemedAction}>
                          <input type="hidden" name="locale" value={params.locale} />
                          <input type="hidden" name="code_id" value={code.id} />
                          <Button size="sm" variant="secondary">
                            Redeemed
                          </Button>
                        </form>
                      ) : null}
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
