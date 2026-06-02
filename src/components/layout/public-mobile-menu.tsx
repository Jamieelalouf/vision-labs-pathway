"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";

type NavLink = { href: string; label: string };

export function PublicMobileMenu({
  locale,
  links,
  loginLabel,
  registerLabel,
  menuLabel
}: {
  locale: Locale;
  links: NavLink[];
  loginLabel: string;
  registerLabel: string;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={menuLabel}
        className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open ? (
        <div className="fixed inset-0 top-16 z-50 bg-background/98 backdrop-blur">
          <nav className="page-shell flex flex-col gap-1 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring rounded-xl px-3 py-3 text-lg font-medium text-foreground transition-colors hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-4 h-px bg-border" />
            <div className="grid gap-3">
              <Button asChild size="lg" className="w-full">
                <Link href={`/${locale}/cohorts`}>{registerLabel}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link href={`/${locale}/login`}>{loginLabel}</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <LanguageSwitcher locale={locale} />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
