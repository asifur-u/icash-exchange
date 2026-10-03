import { cn } from "@/lib/cn";

const styles = {
  gold:
    "inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-medium tracking-tight text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-40",
  ghost:
    "inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-medium tracking-tight text-white transition hover:border-white hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40",
  text: "inline-flex items-center text-sm text-white transition hover:text-white/70",
};

export function Button({
  variant = "gold",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return <button type={type} className={cn(styles[variant], className)} {...props} />;
}
