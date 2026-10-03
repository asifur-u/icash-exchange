import Image from "next/image";
import { cn } from "@/lib/cn";

const sizes = {
  sm: { className: "h-10 w-auto", width: 220, height: 110 },
  md: { className: "h-12 w-auto sm:h-14", width: 280, height: 140 },
  lg: { className: "h-20 w-auto sm:h-24", width: 420, height: 210 },
  hero: { className: "h-28 w-auto sm:h-36 md:h-44 lg:h-48", width: 720, height: 360 },
} as const;

export function BrandLogo({
  className,
  priority = false,
  size = "md",
}: {
  className?: string;
  priority?: boolean;
  size?: keyof typeof sizes;
}) {
  const chosen = sizes[size];

  return (
    <span className={cn("relative inline-flex items-center", className)} aria-label="iCash Exchange">
      <Image
        src="/icash-clean.png"
        alt="iCash Exchange"
        width={chosen.width}
        height={chosen.height}
        priority={priority}
        unoptimized
        className={cn("relative object-contain object-left select-none", chosen.className)}
      />
    </span>
  );
}
