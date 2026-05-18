import Image from "next/image";

export function Logo({ locale = "fr" }: { locale?: string }) {
  void locale;

  return (
    <div className="inline-flex items-center gap-3 rounded-sm">
      <span className="inline-flex items-center rounded-full bg-neutral-950 px-3 py-1.5 shadow-sm ring-1 ring-black/10 dark:bg-black dark:ring-white/15">
        <Image
          src="/brand-assets/vision-labs-logo-white.png"
          alt="VISION LABS"
          width={168}
          height={30}
          className="h-[22px] w-auto"
          priority
        />
      </span>
      <span className="sr-only">VISION LABS</span>
    </div>
  );
}
