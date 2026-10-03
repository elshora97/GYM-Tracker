import { Check } from "lucide-react";
import type { WeekDay } from "@/lib/streak";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<WeekDay["state"], string> = {
  completed: "trained",
  "today-completed": "today, trained",
  today: "today, not trained yet",
  missed: "rest day",
  upcoming: "upcoming",
};

export function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="This week">
      {days.map((d) => {
        const done = d.state === "completed" || d.state === "today-completed";
        const isToday = d.state === "today" || d.state === "today-completed";
        return (
          <li key={d.key} className="flex flex-col items-center gap-1.5" aria-label={`${d.label}: ${STATE_LABEL[d.state]}`}>
            <span
              className={cn(
                "text-[11px] font-medium",
                isToday ? "font-bold text-foreground" : "text-muted-foreground",
              )}
              aria-hidden
            >
              {d.label}
            </span>
            <span
              aria-hidden
              className={cn(
                "grid size-8 place-items-center rounded-full transition-colors",
                done && "bg-primary text-primary-foreground shadow-[0_0_14px_-2px_var(--primary)]",
                d.state === "today" && "border-2 border-dashed border-primary/70",
                d.state === "missed" && "bg-white/[0.05]",
                d.state === "upcoming" && "border border-white/10",
              )}
            >
              {done ? (
                <Check className="size-4" strokeWidth={3} />
              ) : d.state === "missed" ? (
                <span className="size-1 rounded-full bg-muted-foreground/60" />
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
