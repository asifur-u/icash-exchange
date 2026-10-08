"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BuyGate({
  href,
  loggedIn,
  disabled,
  label = "Buy this note",
}: {
  href: string;
  loggedIn: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const router = useRouter();

  if (disabled) {
    return (
      <Button className="h-14 w-full text-base" disabled>
        Sold out
      </Button>
    );
  }

  return (
    <Button
      className="h-14 w-full text-base"
      onClick={() => {
        if (!loggedIn) {
          try {
            sessionStorage.setItem("icash_pending_buy", href);
          } catch {
            /* ignore */
          }
          router.push("/auth?next=/account");
          return;
        }
        router.push(href);
      }}
    >
      {label}
    </Button>
  );
}
