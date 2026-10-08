"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/auth");
        router.refresh();
      }}
      className="inline-flex h-12 items-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white disabled:opacity-50"
    >
      Log out
    </button>
  );
}
