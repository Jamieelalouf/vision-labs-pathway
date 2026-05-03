import { Card, CardContent } from "@/components/ui/card";

export function KPIStat({
  label,
  value,
  sublabel
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-3 font-display text-3xl font-bold">{value}</p>
        {sublabel ? <p className="mt-2 text-sm text-muted-foreground">{sublabel}</p> : null}
      </CardContent>
    </Card>
  );
}
