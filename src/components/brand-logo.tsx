import Image from "next/image";
import { cn } from "@/lib/cn";

const sizes = {
  sm: { className: "h-8 w-auto", width: 160, height: 80 },
  md: { className: "h-10 w-auto sm:h-11", width: 200, height: 100 },
  lg: { className: "h-16 w-auto sm:h-[4.5rem]", width: 320, height: 160 },
  hero: { className: "h-[5.5rem] w-auto sm:h-28 md:h-32", width: 420, height: 210 },
} as const;

export function BrandLogo({
  className,
  priority = false,
  size = "md",
  glow = false,
}: {
  className?: string;
  priority?: boolean;
  size?: keyof typeof sizes;
  glow?: boolean;
}) {
  const chosen = sizes[size];

  return (
    <span
      className={cn("relative inline-flex items-center", glow && "logo-glow", className)}
      aria-label="iCash Exchange"
    >
      {glow ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[8%] top-[10%] h-16 w-16 rounded-full bg-[#ff2d2d]/40 blur-2xl sm:h-24 sm:w-24"
        />
      ) : null}
      <Image
        src="/icash-clean.png"
        alt="iCash Exchange"
        width={chosen.width}
        height={chosen.height}
        priority={priority}
        className={cn("relative object-contain object-left", chosen.className)}
      />
    </span>
  );
}
