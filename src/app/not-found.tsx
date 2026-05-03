import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell flex min-h-screen flex-col items-start justify-center gap-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">404</p>
      <h1 className="max-w-2xl font-display text-4xl font-bold md:text-6xl">Page not found</h1>
      <p className="max-w-xl text-muted-foreground">
        This page is not part of the VISION LABS Pathway yet.
      </p>
      <Link
        href="/fr"
        className="focus-ring inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Back to VISION LABS
      </Link>
    </main>
  );
}
