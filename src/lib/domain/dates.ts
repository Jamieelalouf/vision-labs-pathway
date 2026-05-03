export function addDays(date: string | Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function toDateInputValue(date: string | null | undefined) {
  if (!date) return "";
  return date.slice(0, 10);
}

export function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function combineDateAndTime(date: string, time = "00:00") {
  return new Date(`${date}T${time}:00.000Z`).toISOString();
}
