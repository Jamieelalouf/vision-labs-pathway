"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateLanguagePrefAction } from "@/server/actions/auth";

export function LanguageSwitcher({ locale }: { locale: "en" | "fr" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextLocale = locale === "fr" ? "en" : "fr";

  function switchLanguage() {
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const nextPath = segments.join("/") || `/${nextLocale}`;

    startTransition(async () => {
      await updateLanguagePrefAction(nextLocale);
      router.push(nextPath);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={switchLanguage}
      disabled={isPending}
      aria-label={locale === "fr" ? "Switch to English" : "Passer au francais"}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      {nextLocale.toUpperCase()}
    </Button>
  );
}
