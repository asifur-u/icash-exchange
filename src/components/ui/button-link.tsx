import Link from "next/link";
import { cn } from "@/lib/cn";

const styles = {
  gold:
    "inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold tracking-tight text-black transition hover:bg-white/85 active:scale-[0.98]",
  ghost:
    "inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 text-sm font-semibold tracking-tight text-white transition hover:border-white hover:bg-white/5 active:scale-[0.98]",
};

export function ButtonLink({
  href,
  children,
  variant = "gold",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(styles[variant], className)}>
      {children}
    </Link>
  );
}
