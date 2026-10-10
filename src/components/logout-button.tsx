"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
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
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white disabled:opacity-50",
        className,
      )}
    >
      Log out
    </button>
  );
}
