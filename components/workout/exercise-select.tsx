"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Dumbbell, Play, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/types";
import { useExercises, useLastPerformanceMap, useLastRoutine, useSettings } from "@/lib/hooks/use-data";
import { startWorkout } from "@/lib/storage/repositories/workouts";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { formatSet } from "@/lib/utils/units";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { catVar } from "@/components/workout/category-style";
import { EmptyState } from "@/components/layout/empty-state";
import { ExerciseFormSheet } from "@/components/exercises/exercise-form";

const DEFAULT_PICK = 5;

/** Step 2 of starting a workout: choose which exercises to do today. */
export function ExerciseSelect({ category }: { category: Category }) {
  const router = useRouter();
  const all = useExercises();
  const routine = useLastRoutine(category);
  const last = useLastPerformanceMap();
  const { unit } = useSettings();
  const [picked, setPicked] = useState<string[] | null>(null);
  const [starting, setStarting] = useState(false);
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => {
    if (!all || !routine) return undefined;
    const inCat = all.filter((e) => e.category === category);
    const rank = (id: string) => {
      const i = routine.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...inCat].sort((a, b) => rank(a.id) - rank(b.id));
  }, [all, routine, category]);

  if (!list || !routine || !last) {
    return (
      <div className="flex flex-col gap-2 pt-6" aria-busy="true">
        <Skeleton className="mb-4 h-10 w-48" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const defaults = routine.length
    ? routine.filter((id) => list.some((e) => e.id === id))
    : list.slice(0, DEFAULT_PICK).map((e) => e.id);
  const selected = picked ?? defaults;
  const toggle = (id: string) =>
    setPicked(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const start = async () => {
    setStarting(true);
    try {
      // Keep list order so the session follows the familiar routine.
      const ordered = list.filter((e) => selected.includes(e.id)).map((e) => e.id);
      await startWorkout(category, ordered);
      // the /workout page swaps to the active-workout view via its live query
      router.replace("/workout");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start workout");
      setStarting(false);
    }
  };

  return (
    <div style={catVar(category)}>
      <PageHeader eyebrow="Select exercises" title={CATEGORY_META[category].dayLabel} backHref="/workout" />

      {list.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Build your workout routine."
          description={`Add the exercises you do on ${CATEGORY_META[category].label} day. They'll be remembered for next time.`}
          action={
            <Button size="lg" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="size-5" aria-hidden /> Add Exercise
            </Button>
          }
        />
      ) : (
      <ul className="flex flex-col gap-2" aria-label={`${CATEGORY_META[category].label} exercises`}>
        {list.map((e) => {
          const on = selected.includes(e.id);
          const lp = last.get(e.id);
          return (
            <li key={e.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(e.id)}
                className={cn(
                  "surface press flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                  on && "border-primary/40 bg-primary/[0.06]",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-lg border transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-white/20",
                  )}
                  aria-hidden
                >
                  {on && <Check className="size-4" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{e.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.muscleGroup}
                    {lp && ` · Last: ${formatSet(lp.weight, lp.reps, unit, e.isBodyweight)}`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        <li>
          <Button variant="outline" size="lg" className="w-full border-dashed" onClick={() => setAdding(true)}>
            <Plus className="size-5" aria-hidden /> New exercise
          </Button>
        </li>
      </ul>
      )}

      <ExerciseFormSheet
        open={adding}
        onOpenChange={setAdding}
        defaultCategory={category}
        onSaved={(ex) => {
          if (ex?.category === category) setPicked([...selected, ex.id]);
        }}
      />

      {/* Sticky start button sits above the bottom nav */}
      {list.length > 0 && (
      <div className="sticky bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom)+0.75rem)] mt-6 lg:bottom-6">
        <Button size="lg" className="w-full" disabled={selected.length === 0 || starting} onClick={start}>
          <Play className="size-5 fill-current" aria-hidden />
          {selected.length === 0
            ? "Select exercises"
            : `Start Workout · ${selected.length} ${selected.length === 1 ? "exercise" : "exercises"}`}
        </Button>
      </div>
      )}
    </div>
  );
}
