import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCad(amountCad: number, locale: string) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(amountCad);
}

export function formatDate(value: string | Date, locale: string) {
  const isDateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = isDateOnly
    ? new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))))
    : new Date(value);

  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(isDateOnly ? { timeZone: "UTC" } : {})
  }).format(date);
}

export function formatTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(`1970-01-01T${value}`));
}

export function localizedField<T extends Record<string, unknown>>(
  record: T,
  field: string,
  locale: "en" | "fr"
) {
  return record[`${field}_${locale}`] ?? record[`${field}_fr`] ?? record[`${field}_en`];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * "in 5 days" / "yesterday" / "2 months ago". Returns null for invalid input.
 * Uses date-only comparison so "today" never reads as "in 4 hours" on a same-day session.
 */
export function formatRelativeDate(value: string | Date, locale: string): string | null {
  const isDateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const target = isDateOnly
    ? new Date(
        Date.UTC(
          Number(value.slice(0, 4)),
          Number(value.slice(5, 7)) - 1,
          Number(value.slice(8, 10))
        )
      )
    : new Date(value);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const targetMidnight = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const nowMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.round((targetMidnight - nowMidnight) / MS_PER_DAY);

  const rtf = new Intl.RelativeTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    numeric: "auto"
  });

  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month");
  const diffYears = Math.round(diffDays / 365);
  return rtf.format(diffYears, "year");
}
