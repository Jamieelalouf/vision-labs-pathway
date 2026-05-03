import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createCohortAction, updateCohortAction } from "@/server/actions/admin";
import { getCohorts, getSeasons } from "@/server/queries/data";

export default async function AdminCohortsPage({ params }: { params: { locale: Locale } }) {
  const [cohorts, seasons] = await Promise.all([getCohorts(), getSeasons()]);
  const activeSeason = seasons.find((season) => season.is_active) ?? seasons[0];

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 3</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Cohorts</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create cohort</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCohortAction} className="grid gap-4 md:grid-cols-4">
            <input type="hidden" name="locale" value={params.locale} />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="season_id">Season</Label>
              <select
                id="season_id"
                name="season_id"
                defaultValue={activeSeason?.id}
                className="h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Cohort 3 - November" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cohort_number">Number</Label>
              <Input id="cohort_number" name="cohort_number" type="number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Day</Label>
              <Input
                id="day_of_week"
                name="day_of_week"
                type="number"
                min="0"
                max="6"
                placeholder="0-6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Start time</Label>
              <Input id="start_time" name="start_time" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End time</Label>
              <Input id="end_time" name="end_time" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" defaultValue="30" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue="draft"
                className="h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm"
              >
                {["draft", "open", "active", "completed", "cancelled"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location_name">Location</Label>
              <Input id="location_name" name="location_name" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location_address">Address</Label>
              <Input id="location_address" name="location_address" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regular_price_cad">Regular</Label>
              <Input
                id="regular_price_cad"
                name="regular_price_cad"
                type="number"
                defaultValue="297"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="returning_price_cad">Returning</Label>
              <Input
                id="returning_price_cad"
                name="returning_price_cad"
                type="number"
                defaultValue="247"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_status">Registration</Label>
              <select
                id="registration_status"
                name="registration_status"
                defaultValue="closed"
                className="h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm"
              >
                {["closed", "open", "full"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description_en">Description EN</Label>
              <Textarea id="description_en" name="description_en" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description_fr">Description FR</Label>
              <Textarea id="description_fr" name="description_fr" />
            </div>
            <div className="md:col-span-4">
              <Button>Create cohort</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All cohorts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Quick edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohorts.map((cohort) => (
                <TableRow key={cohort.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/${params.locale}/admin/cohorts/${cohort.id}`}
                      className="hover:text-primary"
                    >
                      {cohort.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {cohort.start_date} - {cohort.end_date}
                  </TableCell>
                  <TableCell>{cohort.status}</TableCell>
                  <TableCell>{cohort.registration_status}</TableCell>
                  <TableCell>{cohort.capacity}</TableCell>
                  <TableCell>
                    <form action={updateCohortAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="locale" value={params.locale} />
                      <input type="hidden" name="cohort_id" value={cohort.id} />
                      <input
                        type="hidden"
                        name="description_en"
                        value={cohort.description_en ?? ""}
                      />
                      <input
                        type="hidden"
                        name="description_fr"
                        value={cohort.description_fr ?? ""}
                      />
                      <Input
                        className="w-20"
                        name="capacity"
                        type="number"
                        defaultValue={cohort.capacity}
                        aria-label="Capacity"
                      />
                      <select
                        name="status"
                        defaultValue={cohort.status}
                        className="h-9 rounded-md border border-input bg-secondary px-2 text-xs"
                      >
                        {["draft", "open", "active", "completed", "cancelled"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <select
                        name="registration_status"
                        defaultValue={cohort.registration_status}
                        className="h-9 rounded-md border border-input bg-secondary px-2 text-xs"
                      >
                        {["closed", "open", "full"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" variant="secondary">
                        Save
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/${params.locale}/admin/cohorts/${cohort.id}`}>Edit</Link>
                      </Button>
                    </form>
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
