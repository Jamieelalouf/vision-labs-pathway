"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type PortalDesktopNavProps = {
  locale: string;
  items: readonly string[];
  labels: Record<string, string>;
};

export function PortalDesktopNav({ locale, items, labels }: PortalDesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map((item) => {
        const href = `/${locale}/portal/${item}`;
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);

        return (
          <Link
            key={item}
            href={href}
            className={`focus-ring whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-primary/15 font-semibold text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {labels[item]}
          </Link>
        );
      })}
    </nav>
  );
}
