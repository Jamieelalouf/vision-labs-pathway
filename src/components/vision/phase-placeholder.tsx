import { Card, CardContent } from "@/components/ui/card";

export function PhasePlaceholder({
  title,
  phase,
  description
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{phase}</p>
        <h1 className="mt-2 font-display text-4xl font-bold">{title}</h1>
      </div>
      <Card>
        <CardContent className="p-6 text-sm leading-6 text-muted-foreground">{description}</CardContent>
      </Card>
    </section>
  );
}
