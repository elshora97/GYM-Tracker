"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useExerciseMap, useSettings, useWorkoutDetail } from "@/lib/hooks/use-data";
import { deleteWorkout } from "@/lib/storage/repositories/workouts";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { bestSet, totalVolume } from "@/lib/workout/metrics";
import { formatDuration, fromDateKey } from "@/lib/utils/date";
import { formatVolume, formatWeight } from "@/lib/utils/units";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatTile } from "@/components/layout/stat-tile";
import { catVar } from "@/components/workout/category-style";

export default function WorkoutDetailPage() {
  return (
    <Suspense fallback={<Skeleton className="mt-6 h-96" />}>
      <WorkoutDetailView />
    </Suspense>
  );
}

function WorkoutDetailView() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const detail = useWorkoutDetail(id);
  const exercises = useExerciseMap();
  const { unit } = useSettings();
  const [confirm, setConfirm] = useState(false);

  if (detail === undefined || !exercises) {
    return (
      <div className="flex flex-col gap-3 pt-6" aria-busy="true">
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted-foreground">Workout not found.</p>
        <Button asChild className="mt-4">
          <Link href="/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  const { workout } = detail;
  const sets = detail.exercises.flatMap((e) => e.sets);

  const onDelete = async () => {
    await deleteWorkout(workout.id);
    toast.success("Workout deleted");
    router.replace("/history");
  };

  return (
    <div style={catVar(workout.category)}>
      <PageHeader
        backHref="/history"
        eyebrow={format(fromDateKey(workout.date), "EEEE, MMMM d, yyyy")}
        title={CATEGORY_META[workout.category].dayLabel}
        actions={
          workout.status === "completed" && (
            <Button variant="ghost" size="icon" aria-label="Delete workout" onClick={() => setConfirm(true)}>
              <Trash2 className="size-5" />
            </Button>
          )
        }
      />

      <section aria-label="Summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Duration" value={formatDuration(workout.duration)} />
        <StatTile label="Exercises" value={detail.exercises.length} />
        <StatTile label="Sets" value={sets.length} />
        <StatTile label="Volume" value={formatVolume(totalVolume(sets), unit)} />
      </section>

      <div className="mt-6 flex flex-col gap-3">
        {detail.exercises.map(({ we, sets }) => {
          const ex = exercises.get(we.exerciseId);
          const top = bestSet(sets);
          return (
            <article key={we.id} className="surface rounded-2xl p-4" aria-label={ex?.name}>
              <div className="flex items-baseline justify-between gap-3">
                {ex ? (
                  <Link href={`/exercises/detail?id=${ex.id}`} className="font-semibold hover:text-primary">
                    {ex.name}
                  </Link>
                ) : (
                  <span className="font-semibold">Deleted exercise</span>
                )}
                <span className="shrink-0 text-xs text-muted-foreground tabular">
                  {formatVolume(totalVolume(sets), unit)}
                </span>
              </div>
              <ol className="mt-3 flex flex-col gap-1">
                {sets.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">Set {s.setNumber}</span>
                    <span className="flex items-center gap-2 font-display text-lg font-bold tabular">
                      {s === top && sets.length > 1 && (
                        <Trophy className="size-3.5 text-primary" aria-label="Top set" />
                      )}
                      {formatWeight(s.weight, unit, ex?.isBodyweight)} × {s.reps}
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              Its sets will be removed and your streak recalculated. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
