import { Footer } from "@/components/layout/footer";
import { PublicHeader } from "@/components/layout/public-header";
import type { Locale } from "@/i18n/routing";

export default function PublicLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader locale={params.locale} />
      {children}
      <Footer locale={params.locale} />
    </div>
  );
}
