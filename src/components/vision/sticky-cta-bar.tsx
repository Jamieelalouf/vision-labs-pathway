"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Mobile-only sticky bottom CTA. Keeps the primary money action one tap away on
 * the landing and cohort-detail pages. Hidden on md+ where header CTAs are visible.
 */
export function StickyCtaBar({
  href,
  label,
  title,
  priceLabel,
  external = false,
  disabled = false
}: {
  href: string;
  label: string;
  title?: string;
  priceLabel?: string;
  external?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="min-w-0">
          {title ? <p className="truncate text-sm font-semibold">{title}</p> : null}
          {priceLabel ? (
            <p className="text-xs text-muted-foreground">{priceLabel}</p>
          ) : null}
        </div>
        {disabled ? (
          <Button size="lg" className="shrink-0" disabled>
            {label}
          </Button>
        ) : external ? (
          <Button asChild size="lg" className="shrink-0">
            <a href={href}>{label}</a>
          </Button>
        ) : (
          <Button asChild size="lg" className="shrink-0">
            <Link href={href}>{label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
