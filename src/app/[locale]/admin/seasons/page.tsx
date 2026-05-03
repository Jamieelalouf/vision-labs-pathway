import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { Locale } from "@/i18n/routing";
import {
  createSeasonAction,
  setActiveSeasonAction,
  updateSeasonAction
} from "@/server/actions/admin";
import { getSeasons } from "@/server/queries/data";

export default async function AdminSeasonsPage({ params }: { params: { locale: Locale } }) {
  const seasons = await getSeasons();
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 3</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Seasons</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create season</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSeasonAction} className="grid gap-4 md:grid-cols-3">
            <input type="hidden" name="locale" value={params.locale} />
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="VISION 2027 Season" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convention_start_date">Convention start</Label>
              <Input id="convention_start_date" name="convention_start_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convention_end_date">Convention end</Label>
              <Input id="convention_end_date" name="convention_end_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convention_name">Convention name</Label>
              <Input id="convention_name" name="convention_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekend_pass_value_cad">Weekend value</Label>
              <Input
                id="weekend_pass_value_cad"
                name="weekend_pass_value_cad"
                type="number"
                defaultValue="429"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="all_access_pass_value_cad">All access value</Label>
              <Input
                id="all_access_pass_value_cad"
                name="all_access_pass_value_cad"
                type="number"
                defaultValue="600"
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-3">
              <input type="checkbox" name="is_active" className="h-4 w-4" />
              Make active season
            </label>
            <div className="md:col-span-3">
              <Button>Create season</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        {seasons.map((season) => (
          <Card key={season.id}>
            <CardHeader>
              <CardTitle>Edit {season.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateSeasonAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="locale" value={params.locale} />
                <input type="hidden" name="season_id" value={season.id} />
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`name-${season.id}`}>Name</Label>
                  <Input id={`name-${season.id}`} name="name" defaultValue={season.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`start-${season.id}`}>Start date</Label>
                  <Input
                    id={`start-${season.id}`}
                    name="start_date"
                    type="date"
                    defaultValue={season.start_date}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`end-${season.id}`}>End date</Label>
                  <Input
                    id={`end-${season.id}`}
                    name="end_date"
                    type="date"
                    defaultValue={season.end_date}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`convention-name-${season.id}`}>Convention name</Label>
                  <Input
                    id={`convention-name-${season.id}`}
                    name="convention_name"
                    defaultValue={season.convention_name ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`convention-start-${season.id}`}>Convention start</Label>
                  <Input
                    id={`convention-start-${season.id}`}
                    name="convention_start_date"
                    type="date"
                    defaultValue={season.convention_start_date ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`convention-end-${season.id}`}>Convention end</Label>
                  <Input
                    id={`convention-end-${season.id}`}
                    name="convention_end_date"
                    type="date"
                    defaultValue={season.convention_end_date ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`weekend-${season.id}`}>Weekend value</Label>
                  <Input
                    id={`weekend-${season.id}`}
                    name="weekend_pass_value_cad"
                    type="number"
                    defaultValue={season.weekend_pass_value_cad}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`all-access-${season.id}`}>All access value</Label>
                  <Input
                    id={`all-access-${season.id}`}
                    name="all_access_pass_value_cad"
                    type="number"
                    defaultValue={season.all_access_pass_value_cad}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    className="h-4 w-4"
                    defaultChecked={season.is_active}
                  />
                  Active season
                </label>
                <div className="md:col-span-2">
                  <Button variant="secondary">Save season</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All seasons</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Convention</TableHead>
                <TableHead>Active</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasons.map((season) => (
                <TableRow key={season.id}>
                  <TableCell className="font-medium">{season.name}</TableCell>
                  <TableCell>
                    {season.start_date} - {season.end_date}
                  </TableCell>
                  <TableCell>{season.convention_name ?? "Not set"}</TableCell>
                  <TableCell>{season.is_active ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {!season.is_active ? (
                      <form action={setActiveSeasonAction}>
                        <input type="hidden" name="locale" value={params.locale} />
                        <input type="hidden" name="season_id" value={season.id} />
                        <Button size="sm" variant="secondary">
                          Set active
                        </Button>
                      </form>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
