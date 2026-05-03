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
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
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
