"use client";

import { RecoverySessionBridge, RecoverySessionProvider, useRecoverySession } from "@/components/auth/recovery-session-bridge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/routing";
import { updatePasswordAction } from "@/server/actions/auth";

type ResetPasswordFormProps = {
  locale: Locale;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  submitLabel: string;
  error?: string;
};

function ResetPasswordFormFields({
  locale,
  newPasswordLabel,
  confirmPasswordLabel,
  submitLabel,
  error
}: ResetPasswordFormProps) {
  const { canSubmit } = useRecoverySession();

  return (
    <form action={updatePasswordAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-2">
        <Label htmlFor="password">{newPasswordLabel}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={!canSubmit}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{confirmPasswordLabel}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={!canSubmit}
        />
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground">
          {decodeURIComponent(error)}
        </p>
      ) : null}
      <Button className="w-full" disabled={!canSubmit}>
        {submitLabel}
      </Button>
    </form>
  );
}

export function ResetPasswordForm(props: ResetPasswordFormProps) {
  return (
    <RecoverySessionProvider>
      <RecoverySessionBridge />
      <ResetPasswordFormFields {...props} />
    </RecoverySessionProvider>
  );
}
