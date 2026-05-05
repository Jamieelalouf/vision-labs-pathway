"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MoreHorizontal, PlusSquare, Route, User, Users } from "lucide-react";
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
  { key: "profile", href: "profile", icon: User, label: "Profile" }
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur md:hidden">
      <div className="mx-auto grid h-16 max-w-xl grid-cols-4">
        {mobilePortalNav.map((item) => {
          const Icon = item.icon;

          if (item.isMore) {
            return (
              <details key={`${item.key}-${pathname ?? ""}`} className="group relative">
                <summary className="focus-ring flex h-full list-none flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{labels.more ?? item.label}</span>
                </summary>
                <div className="absolute bottom-16 right-2 min-w-44 rounded-xl border border-border bg-background p-2 shadow-2xl">
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
                  ? "relative -mt-3 rounded-full border border-primary/40 bg-primary px-3.5 py-2 text-primary-foreground shadow-[0_8px_20px_rgba(255,90,31,0.3)]"
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
