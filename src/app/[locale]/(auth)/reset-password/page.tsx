import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/routing";
import { updatePasswordAction } from "@/server/actions/auth";

export default async function ResetPasswordPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { error?: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });

  return (
    <main className="page-shell flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">{t("resetTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePasswordAction} className="space-y-5">
            <input type="hidden" name="locale" value={params.locale} />
            <div className="space-y-2">
              <Label htmlFor="password">{t("newPassword")}</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            {searchParams.error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                {decodeURIComponent(searchParams.error)}
              </p>
            ) : null}
            <Button className="w-full">{t("submitResetPassword")}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
