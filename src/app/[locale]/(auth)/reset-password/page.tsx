import { getTranslations } from "next-intl/server";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";

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
          <ResetPasswordForm
            locale={params.locale}
            newPasswordLabel={t("newPassword")}
            confirmPasswordLabel={t("confirmPassword")}
            submitLabel={t("submitResetPassword")}
            error={searchParams.error}
          />
        </CardContent>
      </Card>
    </main>
  );
}
