import { cn } from "@/lib/utils";

/** App mark: a stylised barbell inside an ember tile. Mirrors public/icons/icon.svg. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.78 0.17 55)" />
          <stop offset="1" stopColor="oklch(0.64 0.21 35)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-g)" />
      <g fill="oklch(0.16 0.02 40)">
        <rect x="10" y="22" width="6" height="20" rx="2" />
        <rect x="17" y="17" width="7" height="30" rx="2.5" />
        <rect x="24" y="29.5" width="16" height="5" rx="1.5" />
        <rect x="40" y="17" width="7" height="30" rx="2.5" />
        <rect x="48" y="22" width="6" height="20" rx="2" />
      </g>
    </svg>
  );
}
