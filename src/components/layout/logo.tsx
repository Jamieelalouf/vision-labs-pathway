import Link from "next/link";

export function Logo({ locale = "fr" }: { locale?: string }) {
  return (
    <Link href={`/${locale}`} className="focus-ring inline-flex items-center gap-3 rounded-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary font-display text-sm font-bold text-primary-foreground">
        V
      </span>
      <span className="font-display text-sm font-bold uppercase tracking-[0.18em]">
        VISION LABS
      </span>
    </Link>
  );
}
