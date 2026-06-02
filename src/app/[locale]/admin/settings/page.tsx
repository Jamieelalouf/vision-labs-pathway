import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/routing";
import { updateSettingsAction } from "@/server/actions/admin";
import { getSettings } from "@/server/queries/data";

export default async function AdminSettingsPage({ params }: { params: { locale: Locale } }) {
  const settings = await getSettings();
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 3</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Settings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettingsAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="locale" value={params.locale} />
            <div className="space-y-2">
              <Label htmlFor="regular_price_cad">Regular price CAD</Label>
              <Input
                id="regular_price_cad"
                name="regular_price_cad"
                type="number"
                defaultValue={settings?.regular_price_cad ?? 297}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="returning_price_cad">Returning price CAD</Label>
              <Input
                id="returning_price_cad"
                name="returning_price_cad"
                type="number"
                defaultValue={settings?.returning_price_cad ?? 247}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completion_min_attendance">Completion attendance minimum</Label>
              <Input
                id="completion_min_attendance"
                name="completion_min_attendance"
                type="number"
                min="1"
                max="4"
                defaultValue={settings?.completion_min_attendance ?? 3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_video_size_mb">Max video size MB</Label>
              <Input
                id="max_video_size_mb"
                name="max_video_size_mb"
                type="number"
                max="500"
                defaultValue={settings?.max_video_size_mb ?? 500}
              />
              <p className="text-xs text-muted-foreground">
                Current Supabase direct-upload hard cap: 500 MB.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_regular_price_id">Stripe regular price ID</Label>
              <Input
                id="stripe_regular_price_id"
                name="stripe_regular_price_id"
                defaultValue={settings?.stripe_regular_price_id ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_returning_price_id">Stripe returning price ID</Label>
              <Input
                id="stripe_returning_price_id"
                name="stripe_returning_price_id"
                defaultValue={settings?.stripe_returning_price_id ?? ""}
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                name="legacy_pass_uses_stripe"
                defaultChecked={settings?.legacy_pass_uses_stripe ?? false}
              />
              Generate Stripe promotion codes for eligible convention discounts
            </label>
            <div className="md:col-span-2">
              <Button>Save settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
