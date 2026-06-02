import Link from "next/link";
import { AlertCircle, CheckCircle2, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SettingsEmailForm } from "@/components/portal/settings-email-form";
import { SettingsPasswordForm } from "@/components/portal/settings-password-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";
import { getCurrentProfile, requireUser } from "@/server/queries/auth";

export default async function SettingsPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { password?: string; email?: string; error?: string };
}) {
  await requireUser(params.locale);
  const profile = await getCurrentProfile();
  const t = await getTranslations({ locale: params.locale, namespace: "portal.settings" });

  const successMessage =
    searchParams?.password === "changed"
      ? t("success.changed")
      : searchParams?.password === "demo" || searchParams?.email === "demo"
        ? t("success.demo")
        : searchParams?.email === "check"
          ? t("success.emailCheck")
          : null;
  const errorMessages: Record<string, string> = {
    weak: t("errors.weak"),
    mismatch: t("errors.mismatch"),
    "current-wrong": t("errors.currentWrong"),
    session: t("errors.session"),
    "update-failed": t("errors.updateFailed"),
    "bad-email": t("errors.badEmail"),
    "email-failed": t("errors.emailFailed")
  };
  const errorMessage = searchParams?.error
    ? errorMessages[searchParams.error] ?? t("errors.updateFailed")
    : null;

  return (
    <section className="max-w-3xl space-y-6 pb-36 md:space-y-8 md:pb-8">
      <Card className="relative overflow-hidden rounded-3xl border-primary/30 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] shadow-[0_18px_60px_-24px_rgba(249,115,22,0.45)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
        <CardContent className="relative space-y-3 p-5 md:p-8">
          <Badge className="w-fit rounded-full bg-primary/20 text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
            {t("eyebrow")}
          </Badge>
          <h1 className="font-display text-3xl font-bold text-white md:text-5xl">{t("title")}</h1>
          <p className="text-sm text-white/75">{t("subtitle")}</p>
        </CardContent>
      </Card>

      {successMessage ? (
        <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {successMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      <Card className="rounded-2xl border-border/70 bg-secondary/15">
        <CardHeader>
          <CardTitle className="text-lg">{t("accountTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("emailLabel")}</p>
              <p className="truncate font-medium">{profile?.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("roleLabel")}</p>
                <p className="font-medium capitalize">{profile?.role ?? "student"}</p>
              </div>
            </div>
            {profile?.created_at ? (
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("memberSince")}</p>
                <p className="font-medium">{formatDate(profile.created_at, params.locale)}</p>
              </div>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("personalDetailsNote")}{" "}
            <Link href={`/${params.locale}/portal/profile`} className="font-medium text-primary hover:underline">
              {t("personalDetailsLink")}
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 bg-secondary/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("emailTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsEmailForm
            locale={params.locale}
            currentEmail={profile?.email ?? ""}
            copy={{
              currentEmail: t("emailLabel"),
              newEmail: t("newEmailLabel"),
              currentPassword: t("currentPassword"),
              hint: t("emailPasswordHint"),
              save: t("saveEmail")
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 bg-secondary/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("passwordTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsPasswordForm
            locale={params.locale}
            copy={{
              currentPassword: t("currentPassword"),
              newPassword: t("newPassword"),
              confirmPassword: t("confirmPassword"),
              passwordHint: t("passwordHint"),
              save: t("savePassword"),
              show: t("showPasswords"),
              hide: t("hidePasswords")
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 bg-secondary/15">
        <CardHeader>
          <CardTitle className="text-lg">{t("sessionTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("sessionBody")}</p>
          <form action={signOutAction}>
            <Button variant="secondary" className="rounded-full">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("signOut")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
