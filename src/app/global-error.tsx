"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-full bg-black font-sans text-white">
        <ErrorScreen
          error={error}
          reset={reset}
          kicker="iCash Exchange"
          title="This page could not load"
          body="Nothing was charged. Codes and requests on the desk are unchanged."
          busyTitle="The desk is busy"
          busyBody="Postgres could not hand us a connection. Wait a few seconds, then try again."
          retry="Try again"
          home="Go home"
        />
      </body>
    </html>
  );
}
