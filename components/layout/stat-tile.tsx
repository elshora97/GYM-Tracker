import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export function StatTile({ label, value, unit, hint, accent, className }: StatTileProps) {
  return (
    <div className={cn("surface flex min-w-0 flex-col rounded-2xl p-3.5", className)}>
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
      <span className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            "truncate font-display text-[28px] leading-none font-bold tabular",
            accent && "text-primary",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </span>
      {hint && <span className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
