"use client";

import { useEffect, useState } from "react";

/**
 * Time-of-day greeting based on the visitor's *local* clock (server renders in
 * UTC, which would mislabel mornings/evenings). Renders a stable fallback on the
 * server and first paint, then resolves to the local-time greeting after mount.
 */
export function TimeGreeting({
  morning,
  afternoon,
  evening,
  fallback,
  name
}: {
  morning: string;
  afternoon: string;
  evening: string;
  fallback: string;
  name?: string | null;
}) {
  const [greeting, setGreeting] = useState(fallback);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? morning : hour < 18 ? afternoon : evening);
  }, [morning, afternoon, evening]);

  return <>{name ? `${greeting}, ${name}` : greeting}</>;
}
