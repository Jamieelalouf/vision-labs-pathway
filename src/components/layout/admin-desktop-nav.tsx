"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavItem = {
  key: string;
  path: string;
};

type AdminDesktopNavProps = {
  locale: string;
  items: readonly AdminNavItem[];
  labels: Record<string, string>;
};

export function AdminDesktopNav({ locale, items, labels }: AdminDesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex max-w-full gap-2 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map((item) => {
        const href = `/${locale}/admin${item.path}`;
        const isActive =
          item.path === ""
            ? pathname === href
            : pathname === href || pathname?.startsWith(`${href}/`);

        return (
          <Link
            key={item.key}
            href={href}
            className={`focus-ring flex-none whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-primary/15 font-semibold text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {labels[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
