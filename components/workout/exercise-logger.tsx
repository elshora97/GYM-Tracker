"use client";

import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, ChevronDown, History, MoreVertical, Plus, Trash2 } from "lucide-react";
import type { Exercise, WeightUnit, WorkoutExercise, WorkoutSet } from "@/lib/types";
import {
  addSet,
  deleteSet,
  getLastSessionSets,
  removeWorkoutExercise,
  setExerciseCompleted,
  updateSet,
} from "@/lib/storage/repositories/workouts";
import { bestSet, summarizeSets } from "@/lib/workout/metrics";
import { formatSet, formatWeight } from "@/lib/utils/units";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SetEditor } from "@/components/workout/set-editor";

interface ExerciseLoggerProps {
  we: WorkoutExercise;
  sets: WorkoutSet[];
  exercise: Exercise | undefined;
  unit: WeightUnit;
  expanded: boolean;
  onToggle: () => void;
  onCompleted: () => void;
}

export function ExerciseLogger({ we, sets, exercise, unit, expanded, onToggle, onCompleted }: ExerciseLoggerProps) {
  const previous = useLiveQuery(() => getLastSessionSets(we.exerciseId, we.workoutId), [we.exerciseId, we.workoutId]);
  const [focusId, setFocusId] = useState<string | null>(null);

  const isBW = exercise?.isBodyweight ?? false;
  const done = sets.filter((s) => s.completed).length;
  const prevBest = previous && previous.length ? bestSet(previous) : null;
  const firstOpen = sets.find((s) => !s.completed);
  const focused = sets.find((s) => s.id === focusId) ?? firstOpen ?? null;
  const summary = summarizeSets(sets.filter((s) => s.completed));
  const name = exercise?.name ?? "Exercise";

  const afterLogged = (loggedId: string, before: number | null, after: number | null) => {
    const idx = sets.findIndex((s) => s.id === loggedId);
    // Weight changed? Carry it to the remaining unchecked sets that used the old weight.
    if (before !== after) {
      for (const s of sets.slice(idx + 1)) {
        if (!s.completed && s.weight === before) updateSet(s.id, { weight: after });
      }
    }
    const next = sets.slice(idx + 1).find((s) => !s.completed) ?? sets.find((s) => !s.completed && s.id !== loggedId);
    setFocusId(next?.id ?? null);
  };

  const onAddSet = async () => {
    const created = await addSet(we.id);
    if (created) setFocusId(created.id);
  };

  const onComplete = async () => {
    await setExerciseCompleted(we.id, true);
    onCompleted();
  };

  return (
    <article
      aria-label={name}
      className={cn(
        "surface overflow-hidden rounded-2xl transition-colors",
        we.completed && !expanded && "opacity-80",
      )}
    >
      <div className="flex items-center gap-2 p-2 pl-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold tabular",
              we.completed
                ? "border-success/40 bg-success/15 text-success"
                : done > 0
                  ? "border-primary/40 text-primary"
                  : "border-border text-muted-foreground",
            )}
            aria-hidden
          >
            {we.completed ? <Check className="size-4" strokeWidth={3} /> : `${done}/${sets.length}`}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {!expanded && summary
                ? `${done} ${done === 1 ? "set" : "sets"} · best ${formatSet(summary.weight, summary.reps, unit, isBW)}`
                : !expanded && prevBest
                  ? `Previous: ${formatSet(prevBest.weight, prevBest.reps, unit, isBW)}`
                  : exercise?.muscleGroup}
            </span>
          </span>
          <ChevronDown
            className={cn("size-5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`${name} options`} className="text-muted-foreground">
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {exercise && (
              <DropdownMenuItem asChild>
                <Link href={`/exercises/detail?id=${exercise.id}`}>
                  <History /> Exercise history
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onSelect={() => removeWorkoutExercise(we.id)}>
              <Trash2 /> Remove from workout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 pt-3 pb-3">
          {prevBest && (
            <p className="mb-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
              <span className="text-muted-foreground">Previous</span>
              <span className="font-semibold tabular">
                {formatPrevious(previous!, unit, isBW)}
              </span>
            </p>
          )}

          <ol className="flex flex-col gap-2">
            {sets.map((s) =>
              focused?.id === s.id ? (
                <li key={s.id}>
                  <SetEditor
                    key={s.id}
                    set={s}
                    unit={unit}
                    isBodyweight={isBW}
                    onLogged={(before, after) => afterLogged(s.id, before, after)}
                    onDelete={() => {
                      deleteSet(s.id);
                      setFocusId(null);
                    }}
                  />
                </li>
              ) : (
                <li key={s.id}>
                  <SetRow set={s} unit={unit} isBodyweight={isBW} onEdit={() => setFocusId(s.id)} />
                </li>
              ),
            )}
          </ol>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onAddSet}>
              <Plus className="size-4" aria-hidden /> Add Set
            </Button>
            <Button variant={done > 0 && !firstOpen ? "default" : "secondary"} onClick={onComplete} disabled={done === 0}>
              <Check className="size-4" strokeWidth={3} aria-hidden /> Complete
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function SetRow({
  set,
  unit,
  isBodyweight,
  onEdit,
}: {
  set: WorkoutSet;
  unit: WeightUnit;
  isBodyweight: boolean;
  onEdit: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border pl-1",
        set.completed ? "border-transparent bg-success/[0.07]" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        className="press flex min-h-12 flex-1 items-center gap-3 rounded-lg px-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Edit set ${set.setNumber}: ${formatSet(set.weight, set.reps, unit, isBodyweight)}`}
      >
        <span className="w-12 text-xs font-semibold text-muted-foreground uppercase">Set {set.setNumber}</span>
        <span className={cn("font-display text-xl font-bold tabular", !set.completed && "text-muted-foreground")}>
          {formatWeight(set.weight, unit, isBodyweight)}
          <span className="mx-1.5 text-base text-muted-foreground">×</span>
          {set.reps}
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          updateSet(set.id, { completed: !set.completed });
          if (!set.completed) navigator.vibrate?.(12);
        }}
        aria-pressed={set.completed}
        aria-label={set.completed ? `Set ${set.setNumber} done — tap to undo` : `Mark set ${set.setNumber} done`}
        className={cn(
          "press m-1 grid size-11 shrink-0 place-items-center rounded-lg border transition-colors",
          set.completed
            ? "border-success/40 bg-success text-background"
            : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary",
        )}
      >
        <Check className="size-5" strokeWidth={3} />
      </button>
    </div>
  );
}

/** "62.5 kg × 9, 9, 8" when weights match, otherwise "60 × 8 · 62.5 × 6". */
function formatPrevious(sets: WorkoutSet[], unit: WeightUnit, isBW: boolean) {
  const same = sets.every((s) => s.weight === sets[0].weight);
  if (same) return `${formatWeight(sets[0].weight, unit, isBW)} × ${sets.map((s) => s.reps).join(", ")}`;
  return sets.map((s) => `${formatWeight(s.weight, unit, isBW)} × ${s.reps}`).join(" · ");
}
