"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/routing";
import { updateDancerProfileAction } from "@/server/actions/auth";
import { useFormState, useFormStatus } from "react-dom";

type ProfileActionState = { ok: boolean; message: string };

const initialState: ProfileActionState = { ok: false, message: "" };

export type ProfileFormDefaults = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  instagram_handle?: string | null;
  date_of_birth?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  guardian_name?: string | null;
  guardian_email?: string | null;
  guardian_phone?: string | null;
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? pendingLabel : label}</Button>;
}

export function ProfileForm({
  locale,
  mode,
  submitLabel,
  defaults,
  cohort,
  dashboardHref,
  labels
}: {
  locale: Locale;
  mode: "full" | "edit";
  submitLabel: string;
  defaults?: ProfileFormDefaults;
  cohort?: string;
  dashboardHref?: string;
  labels: {
    dancerDetails: string;
    personal?: string;
    emergency?: string;
    guardian?: string;
    firstName: string;
    lastName: string;
    phone: string;
    instagram: string;
    dateOfBirth: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    guardianName?: string;
    guardianEmail?: string;
    guardianPhone?: string;
    pending: string;
    success: string;
    errorPrefix: string;
    goToDashboard: string;
  };
}) {
  const [state, action] = useFormState(updateDancerProfileAction, initialState);
  const maxDob = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader className="p-4 pb-2 md:p-6 md:pb-3">
        <CardTitle>{labels.dancerDetails}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <form action={action} className="grid gap-4 md:grid-cols-2 md:gap-5">
          <input type="hidden" name="language_pref" value={locale} />
          <input type="hidden" name="cohort" value={cohort ?? ""} />
          <div className="md:col-span-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {labels.personal ?? ""}
          </div>
          <div className="space-y-2">
            <Label htmlFor="first_name">{labels.firstName}</Label>
            <Input id="first_name" name="first_name" defaultValue={defaults?.first_name ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">{labels.lastName}</Label>
            <Input id="last_name" name="last_name" defaultValue={defaults?.last_name ?? ""} required />
          </div>
          {mode === "full" ? (
            <div className="space-y-2">
              <Label htmlFor="phone">{labels.phone}</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={defaults?.phone ?? ""} />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="instagram_handle">{labels.instagram}</Label>
            <Input id="instagram_handle" name="instagram_handle" defaultValue={defaults?.instagram_handle ?? ""} placeholder="@yourhandle" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">{labels.dateOfBirth}</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              min="1900-01-01"
              max={maxDob}
              defaultValue={defaults?.date_of_birth ?? ""}
            />
          </div>
          {mode === "full" ? (
            <>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:col-span-2">
                {labels.emergency}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">{labels.emergencyContactName}</Label>
                <Input
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  defaultValue={defaults?.emergency_contact_name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">{labels.emergencyContactPhone}</Label>
                <Input
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  type="tel"
                  defaultValue={defaults?.emergency_contact_phone ?? ""}
                />
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:col-span-2">
                {labels.guardian}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_name">{labels.guardianName}</Label>
                <Input id="guardian_name" name="guardian_name" defaultValue={defaults?.guardian_name ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_email">{labels.guardianEmail}</Label>
                <Input
                  id="guardian_email"
                  name="guardian_email"
                  type="email"
                  defaultValue={defaults?.guardian_email ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_phone">{labels.guardianPhone}</Label>
                <Input
                  id="guardian_phone"
                  name="guardian_phone"
                  type="tel"
                  defaultValue={defaults?.guardian_phone ?? ""}
                />
              </div>
            </>
          ) : null}
          {state.message ? (
            <div className="md:col-span-2 space-y-3">
              <p
                className={`text-sm ${state.ok ? "text-emerald-400" : "text-destructive"}`}
                role="status"
                aria-live="polite"
              >
                {state.ok ? labels.success : `${labels.errorPrefix} ${state.message}`}
              </p>
              {state.ok && dashboardHref ? (
                <Button asChild variant="secondary">
                  <Link href={dashboardHref}>{labels.goToDashboard}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className="md:col-span-2">
            <SubmitButton label={submitLabel} pendingLabel={labels.pending} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
