"use client";

import { Mail } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeEmailAction } from "@/server/actions/auth";

type Copy = {
  currentEmail: string;
  newEmail: string;
  currentPassword: string;
  hint: string;
  save: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending}>
      <Mail className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

export function SettingsEmailForm({
  locale,
  currentEmail,
  copy
}: {
  locale: string;
  currentEmail: string;
  copy: Copy;
}) {
  return (
    <form action={changeEmailAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="current_email">{copy.currentEmail}</Label>
          <Input id="current_email" value={currentEmail} readOnly disabled className="opacity-70" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new_email">{copy.newEmail}</Label>
          <Input id="new_email" name="new_email" type="email" autoComplete="email" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email_current_password">{copy.currentPassword}</Label>
        <Input
          id="email_current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <p className="text-xs text-muted-foreground">{copy.hint}</p>
      <SubmitButton label={copy.save} />
    </form>
  );
}
