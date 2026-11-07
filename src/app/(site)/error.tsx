"use client";

import { ErrorScreen } from "@/components/error-screen";
import { useT } from "@/i18n/provider";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return (
    <ErrorScreen
      error={error}
      reset={reset}
      kicker={t("crash.kicker")}
      title={t("crash.title")}
      body={t("crash.body")}
      busyTitle={t("crash.busyTitle")}
      busyBody={t("crash.busyBody")}
      retry={t("crash.retry")}
      home={t("crash.home")}
    />
  );
}
