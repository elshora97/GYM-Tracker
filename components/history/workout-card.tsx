import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Clock, Dumbbell } from "lucide-react";
import type { Exercise, WeightUnit } from "@/lib/types";
import type { WorkoutSummary } from "@/lib/workout/history";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { summarizeSets } from "@/lib/workout/metrics";
import { formatDuration, fromDateKey } from "@/lib/utils/date";
import { formatWeight } from "@/lib/utils/units";
import { pluralize } from "@/lib/utils";
import { catVar } from "@/components/workout/category-style";

interface WorkoutCardProps {
  summary: WorkoutSummary;
  exercises: Map<string, Exercise>;
  unit: WeightUnit;
  /** Max exercise lines to show (rest summarised). */
  maxLines?: number;
}

export function WorkoutCard({ summary, exercises, unit, maxLines = 4 }: WorkoutCardProps) {
  const { workout, items } = summary;
  const shown = items.slice(0, maxLines);
  const hidden = items.length - shown.length;

  return (
    <Link
      href={`/history/detail?id=${workout.id}`}
      style={catVar(workout.category)}
      className="surface press group relative block overflow-hidden rounded-2xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <span aria-hidden className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-(--cat)" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {format(fromDateKey(workout.date), "EEEE, MMMM d")}
          </p>
          <p className="mt-0.5 font-display text-2xl leading-tight font-bold tracking-wide uppercase">
            {CATEGORY_META[workout.category].dayLabel}
          </p>
        </div>
        <ChevronRight
          className="mt-3 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
      <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Dumbbell className="size-3.5" aria-hidden />
          {pluralize(items.length, "exercise")}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {formatDuration(workout.duration)}
        </span>
      </p>
      {shown.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {shown.map((item) => {
            const ex = exercises.get(item.exerciseId);
            const s = summarizeSets(item.sets);
            return (
              <li key={item.exerciseId} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{ex?.name ?? "Deleted exercise"}</span>
                {s && (
                  <span className="shrink-0 text-muted-foreground tabular">
                    {formatWeight(s.weight, unit, ex?.isBodyweight)} × {s.reps} × {s.sets}
                  </span>
                )}
              </li>
            );
          })}
          {hidden > 0 && <li className="text-xs text-muted-foreground">+ {pluralize(hidden, "more exercise")}</li>}
        </ul>
      )}
    </Link>
  );
}
