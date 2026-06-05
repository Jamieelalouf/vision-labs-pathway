"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/server/actions/auth";

type Copy = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordHint: string;
  save: string;
  show: string;
  hide: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} className="w-full sm:w-auto">
      <Lock className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

export function SettingsPasswordForm({ locale, copy }: { locale: string; copy: Copy }) {
  const [reveal, setReveal] = useState(false);
  const inputType = reveal ? "text" : "password";

  return (
    <form action={changePasswordAction} className="space-y-3 md:space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-2">
        <Label htmlFor="current_password">{copy.currentPassword}</Label>
        <Input
          id="current_password"
          name="current_password"
          type={inputType}
          autoComplete="current-password"
          required
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">{copy.newPassword}</Label>
          <Input
            id="password"
            name="password"
            type={inputType}
            autoComplete="new-password"
            minLength={10}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{copy.confirmPassword}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={inputType}
            autoComplete="new-password"
            minLength={10}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{copy.passwordHint}</p>
        <button
          type="button"
          onClick={() => setReveal((value) => !value)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {reveal ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          {reveal ? copy.hide : copy.show}
        </button>
      </div>

      <SubmitButton label={copy.save} />
    </form>
  );
}
