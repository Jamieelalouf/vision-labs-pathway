import Image from "next/image";
import Link from "next/link";

export function Logo({ locale = "fr" }: { locale?: string }) {
  return (
    <Link href={`/${locale}`} className="inline-flex items-center gap-3" aria-label="VISION LABS home">
      <Image
        src="/brand-assets/vision-labs-logo-black.png"
        alt="VISION LABS"
        width={168}
        height={30}
        className="h-[22px] w-auto dark:hidden"
        priority
      />
      <Image
        src="/brand-assets/vision-labs-logo-white.png"
        alt="VISION LABS"
        width={168}
        height={30}
        className="hidden h-[22px] w-auto dark:block"
        priority
      />
      <span className="sr-only">VISION LABS</span>
    </Link>
  );
}
