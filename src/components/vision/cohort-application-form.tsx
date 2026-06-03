"use client";

import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const APPLICATION_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyaZiXJgdgSyfUYZO2Tf_0AiJ04RvvvKEstQJ7SpXcA52Szp9NvgWDQjLlLGQlHwMlB/exec";

export type CohortApplicationFormCopy = {
  submit: string;
  submitting: string;
  successTitle: string;
  successDescription: string;
  errorTitle: string;
  errorBody: string;
  requiredNote: string;
  fields: {
    firstName: string;
    lastName: string;
    instagram: string;
    email: string;
    level: string;
    hearSource: string;
    mondayInterest: string;
    referredBy: string;
    otherInfo: string;
    age: string;
    videoLink: string;
  };
  placeholders: {
    instagram: string;
    hearSource: string;
    referredBy: string;
    otherInfo: string;
    videoLink: string;
  };
  options: {
    choose: string;
    yes: string;
    no: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    professional: string;
  };
};

export function CohortApplicationForm({
  copy,
  disabled = false
}: {
  copy: CohortApplicationFormCopy;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || status === "submitting") return;

    setStatus("submitting");

    const formData = new FormData(event.currentTarget);
    const body = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      body.append(key, String(value));
    }
    const mondayInterest = String(formData.get("monday_interest") ?? "");
    if (mondayInterest) {
      body.set("friday_interest", mondayInterest);
    }

    try {
      await fetch(APPLICATION_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      });
      event.currentTarget.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {status === "success" ? (
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {copy.successTitle}
          </p>
          <p className="mt-2 text-emerald-100/80">{copy.successDescription}</p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {copy.errorTitle}
          </p>
          <p className="mt-2 text-muted-foreground">{copy.errorBody}</p>
        </div>
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground">{copy.requiredNote}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.fields.firstName} name="first_name" required />
        <Field label={copy.fields.lastName} name="last_name" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={copy.fields.email}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Field
          label={copy.fields.age}
          name="age"
          type="number"
          min={1}
          inputMode="numeric"
          required
        />
      </div>

      <Field
        label={copy.fields.instagram}
        name="instagram"
        autoComplete="off"
        placeholder={copy.placeholders.instagram}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={copy.fields.level} name="level" required>
          <option value="">{copy.options.choose}</option>
          <option value="Beginner">{copy.options.beginner}</option>
          <option value="Intermediate">{copy.options.intermediate}</option>
          <option value="Advanced">{copy.options.advanced}</option>
          <option value="Professional">{copy.options.professional}</option>
        </SelectField>
        <Field
          label={copy.fields.hearSource}
          name="hear_source"
          placeholder={copy.placeholders.hearSource}
          required
        />
      </div>

      <SelectField label={copy.fields.mondayInterest} name="monday_interest" required>
        <option value="">{copy.options.choose}</option>
        <option value="Yes">{copy.options.yes}</option>
        <option value="No">{copy.options.no}</option>
      </SelectField>

      <Field
        label={copy.fields.referredBy}
        name="referred_by"
        placeholder={copy.placeholders.referredBy}
      />

      <Field
        label={copy.fields.videoLink}
        name="video_link"
        type="url"
        inputMode="url"
        placeholder={copy.placeholders.videoLink}
      />

      <div className="space-y-2">
        <Label htmlFor="other_info">{copy.fields.otherInfo}</Label>
        <Textarea id="other_info" name="other_info" placeholder={copy.placeholders.otherInfo} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={disabled || status === "submitting"}>
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {copy.submitting}
          </>
        ) : (
          copy.submit
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

function SelectField({
  label,
  name,
  children,
  required
}: {
  label: string;
  name: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required={required}
        className="focus-ring flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
}
