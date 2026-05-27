"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { createBrowserClient } from "@/lib/supabase/browser";

type BridgeState = "checking" | "preparing" | "ready" | "waiting" | "error";

type RecoverySessionContextValue = {
  state: BridgeState;
  canSubmit: boolean;
};

const RecoverySessionContext = createContext<RecoverySessionContextValue | null>(null);

export function RecoverySessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BridgeState>("checking");

  useEffect(() => {
    void (async () => {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const existingSession = sessionData.session;

      if (existingSession) {
        setState("ready");
        return;
      }

      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

      if (!hash) {
        setState("waiting");
        return;
      }

      const params = new URLSearchParams(hash);
      const type = params.get("type");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (type !== "recovery" || !accessToken || !refreshToken) {
        setState("waiting");
        return;
      }

      setState("preparing");

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

  const value = useMemo(
    () => ({
      state,
      canSubmit: state === "ready"
    }),
    [state]
  );

  return <RecoverySessionContext.Provider value={value}>{children}</RecoverySessionContext.Provider>;
}

export function useRecoverySession() {
  const context = useContext(RecoverySessionContext);
  if (!context) {
    throw new Error("useRecoverySession must be used within RecoverySessionProvider");
  }
  return context;
}

export function RecoverySessionBridge() {
  const { state } = useRecoverySession();

  return (
    <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">
      {state === "checking"
        ? "Checking reset link..."
        : state === "preparing"
          ? "Preparing secure reset link..."
          : state === "ready"
            ? "Reset link ready."
            : state === "waiting"
              ? 'Open the newest reset email and wait for "Reset link ready."'
              : "Could not prepare reset link. Request a new reset email if needed."}
    </p>
  );
}
