"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DiscountCodeReveal({
  code,
  expiresLabel,
  expiresAt,
  copyLabel = "Copy",
  copiedLabel = "Copied"
}: {
  code: string;
  expiresLabel: string;
  expiresAt?: string | null;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/10 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Code</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="break-all font-mono text-2xl font-bold text-primary">{code}</p>
        <Button type="button" variant="secondary" size="sm" onClick={copyCode}>
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      {expiresAt ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {expiresLabel} {expiresAt}
        </p>
      ) : null}
    </div>
  );
}
