"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function BuyGate({
  href,
  loggedIn,
  disabled,
  label = "Buy this note",
  className,
  onContinue,
}: {
  href: string;
  loggedIn: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  /** When set, called instead of navigating — use for confirm popup. */
  onContinue?: () => void;
}) {
  const router = useRouter();

  if (disabled) {
    return (
      <Button className={cn("h-14 w-full text-base", className)} disabled>
        Sold out
      </Button>
    );
  }

  return (
    <Button
      className={cn("h-14 w-full text-base", className)}
      onClick={() => {
        if (onContinue) {
          onContinue();
          return;
        }
        if (!loggedIn) {
          try {
            sessionStorage.setItem("icash_pending_buy", href);
          } catch {
            /* ignore */
          }
          // Login first — after auth, land on checkout (or account if path is odd).
          const next = href.startsWith("/") ? href : "/account";
          router.push(`/auth?next=${encodeURIComponent(next)}`);
          return;
        }
        router.push(href);
      }}
    >
      {label}
    </Button>
  );
}
