"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "2026-05-12" + "18:30:00" -> "20260512T183000" (floating local time). */
function toIcsLocal(date: string, time: string) {
  const datePart = date.replace(/-/g, "");
  const [h = "00", m = "00", s = "00"] = time.split(":");
  return `${datePart}T${h.padStart(2, "0")}${m.padStart(2, "0")}${s.padStart(2, "0")}`;
}

export function AddToCalendarButton({
  uid,
  title,
  date,
  startTime,
  endTime,
  location,
  description,
  label,
  filename = "vision-labs-session.ics"
}: {
  uid: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  description?: string | null;
  label: string;
  filename?: string;
}) {
  function download() {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//VISION LABS//Portal//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsLocal(date, startTime)}`,
      `DTEND:${toIcsLocal(date, endTime)}`,
      `SUMMARY:${escapeIcsText(title)}`,
      location ? `LOCATION:${escapeIcsText(location)}` : null,
      description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
      "END:VEVENT",
      "END:VCALENDAR"
    ].filter(Boolean);

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={download}>
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
