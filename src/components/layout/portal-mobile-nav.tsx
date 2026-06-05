"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp, Home, MoreHorizontal, PlusSquare, Route, Settings, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MobileNavItem = {
  key: string;
  href?: string;
  label: string;
  isPost?: boolean;
  isMore?: boolean;
  icon: LucideIcon;
};

const mobilePortalNav: MobileNavItem[] = [
  { key: "dashboard", href: "dashboard", icon: Home, label: "Dashboard" },
  { key: "community", href: "community", icon: Users, label: "Community" },
  { key: "post", href: "community#post", icon: PlusSquare, label: "Post", isPost: true },
  { key: "more", icon: MoreHorizontal, label: "More", isMore: true }
];

const overflowNav: MobileNavItem[] = [
  { key: "cohort", href: "cohort", icon: Users, label: "My Cohort" },
  { key: "pathway", href: "pathway", icon: Route, label: "Pathway" },
  { key: "profile", href: "profile", icon: User, label: "Profile" },
  { key: "settings", href: "settings", icon: Settings, label: "Settings" }
];

export function PortalMobileNav({
  locale,
  labels
}: {
  locale: string;
  labels: Record<string, string>;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[max(env(safe-area-inset-bottom),0.25rem)] shadow-[0_-8px_24px_-22px_rgba(0,0,0,0.8)] backdrop-blur md:hidden">
      <div className="mx-auto grid h-12 max-w-lg grid-cols-4 px-1">
        {mobilePortalNav.map((item) => {
          const Icon = item.icon;

          if (item.isMore) {
            return (
              <details key={`${item.key}-${pathname ?? ""}`} className="group relative">
                <summary className="focus-ring flex h-full list-none flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-open:text-primary">
                  <span className="relative flex items-center">
                    <Icon className="h-4 w-4" aria-hidden />
                    <ChevronUp className="ml-0.5 h-3 w-3 transition-transform group-open:rotate-180" aria-hidden />
                  </span>
                  <span>{labels.more ?? item.label}</span>
                </summary>
                <div className="absolute bottom-12 right-2 min-w-44 rounded-xl border border-border bg-background p-2 shadow-2xl">
                  {overflowNav.map((overflowItem) => {
                    const targetPath = `/${locale}/portal/${overflowItem.href}`;
                    const isActive = pathname === targetPath || pathname?.startsWith(`${targetPath}/`);
                    const OverflowIcon = overflowItem.icon;
                    return (
                      <Link
                        key={overflowItem.key}
                        href={`/${locale}/portal/${overflowItem.href}`}
                        className={`focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          isActive ? "bg-secondary text-primary" : "text-foreground"
                        }`}
                      >
                        <OverflowIcon className="h-4 w-4" aria-hidden />
                        <span>{labels[overflowItem.key] ?? overflowItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          }

          const targetPath = `/${locale}/portal/${item.href?.split("#")[0]}`;
          const isActive =
            !item.isPost &&
            (pathname === targetPath || pathname?.startsWith(`${targetPath}/`));

          return (
            <Link
              key={item.key}
              href={`/${locale}/portal/${item.href}`}
              className={`focus-ring flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                item.isPost
                  ? "mx-1 my-1 rounded-xl border border-primary/35 bg-primary/95 px-2 py-0.5 text-primary-foreground shadow-[0_6px_14px_-12px_rgba(255,90,31,0.65)]"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.isPost ? (labels.post ?? item.label) : (labels[item.key] ?? item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
