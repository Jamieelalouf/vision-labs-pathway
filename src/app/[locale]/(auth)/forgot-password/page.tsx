import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/routing";
import { requestPasswordResetAction } from "@/server/actions/auth";

export default async function ForgotPasswordPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { sent?: string; error?: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });

  return (
    <main className="page-shell flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">{t("forgotTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={requestPasswordResetAction} className="space-y-5">
            <input type="hidden" name="locale" value={params.locale} />
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            {searchParams.sent ? (
              <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Check your email for the reset link.
              </p>
            ) : null}
            {searchParams.error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                {decodeURIComponent(searchParams.error)}
              </p>
            ) : null}
            <Button className="w-full">{t("sendReset")}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
