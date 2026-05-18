import Image from "next/image";

export function Logo({ locale = "fr" }: { locale?: string }) {
  void locale;

  return (
    <div className="inline-flex items-center gap-3">
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
    </div>
  );
}
