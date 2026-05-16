"use client";

import { useEffect, useState } from "react";

import { createBrowserClient } from "@/lib/supabase/browser";

type BridgeState = "idle" | "preparing" | "ready" | "error";

export function RecoverySessionBridge() {
  const [state, setState] = useState<BridgeState>("idle");

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (type !== "recovery" || !accessToken || !refreshToken) {
      return;
    }

    setState("preparing");

    void (async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

      if (error) {
        setState("error");
        return;
      }

      setState("ready");
    })();
  }, []);

  if (state === "idle") {
    return null;
  }

  return (
    <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">
      {state === "preparing"
        ? "Preparing secure reset link..."
        : state === "ready"
          ? "Reset link ready."
          : "Could not prepare reset link. Request a new reset email if needed."}
    </p>
  );
}
