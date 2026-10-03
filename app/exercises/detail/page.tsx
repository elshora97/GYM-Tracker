"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { LineChart as LineIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useExercise, useExerciseSessions, useSettings } from "@/lib/hooks/use-data";
import { deleteExercise } from "@/lib/storage/repositories/exercises";
import { exerciseStats } from "@/lib/workout/metrics";
import { fromDateKey } from "@/lib/utils/date";
import { displayWeight, formatNumber, formatSet, formatVolume, formatWeight, kgToUnit } from "@/lib/utils/units";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EmptyState } from "@/components/layout/empty-state";
import { LineChart } from "@/components/charts/line-chart";
import { ExerciseFormSheet } from "@/components/exercises/exercise-form";
import { CategoryBadge } from "@/components/workout/category-style";

export default function ExerciseDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ExerciseDetail />
    </Suspense>
  );
}

function ExerciseDetail() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const exercise = useExercise(id);
  const sessions = useExerciseSessions(id);
  const { unit } = useSettings();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [metric, setMetric] = useState<"weight" | "volume">("weight");

  const stats = useMemo(() => (sessions ? exerciseStats(sessions) : null), [sessions]);

  if (exercise === undefined || sessions === undefined || !stats) return <DetailSkeleton />;
  if (exercise === null) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted-foreground">Exercise not found.</p>
        <Button asChild className="mt-4">
          <Link href="/exercises">Back to exercises</Link>
        </Button>
      </div>
    );
  }

  const isBW = exercise.isBodyweight;
  const chartData = sessions.slice(-12).map((s) => ({
    label: format(fromDateKey(s.date), "d MMM"),
    value: metric === "weight" ? displayWeight(s.topWeight, unit) : Math.round(kgToUnit(s.volume, unit)),
  }));
  const showWeightChart = !(isBW && metric === "weight" && sessions.every((s) => s.topWeight === 0));

  const onDelete = async () => {
    try {
      await deleteExercise(exercise.id);
      toast.success(`${exercise.name} deleted`);
      router.replace("/exercises");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete");
    }
  };

  return (
    <div>
      <PageHeader
        backHref="/exercises"
        eyebrow={
          <span className="flex items-center gap-2">
            <CategoryBadge category={exercise.category} />
            <span className="normal-case tracking-normal">{exercise.muscleGroup}</span>
          </span>
        }
        title={exercise.name}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Exercise options">
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Pencil /> Edit / move category
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Delete exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={LineIcon}
          title="No history yet"
          description="Log this exercise in a workout to start tracking progress."
          action={
            <Button asChild size="lg" className="w-full">
              <Link href={`/workout?category=${exercise.category}`}>Start a workout</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-label="Key stats" className="grid grid-cols-2 gap-2">
            <StatTile
              label="Personal best"
              accent
              value={
                stats.personalBest
                  ? isBW && !stats.personalBest.weight
                    ? `${stats.personalBest.reps}`
                    : formatNumber(displayWeight(stats.personalBest.weight ?? 0, unit))
                  : "—"
              }
              unit={isBW && !stats.personalBest?.weight ? "reps" : unit}
              hint={
                stats.personalBest &&
                `× ${stats.personalBest.reps} · ${format(fromDateKey(stats.personalBest.date), "d MMM")}`
              }
            />
            <StatTile
              label="Last workout"
              value={
                stats.lastSession
                  ? formatSet(stats.lastSession.topWeight || null, stats.lastSession.topReps, unit, isBW)
                  : "—"
              }
              hint={stats.lastSession && format(fromDateKey(stats.lastSession.date), "EEE d MMM")}
              className="[&_span.font-display]:text-2xl"
            />
            <StatTile label="Total sets" value={stats.totalSets} hint={`${stats.sessions} sessions`} />
            <StatTile
              label="Total volume"
              value={formatNumber(Math.round(kgToUnit(stats.totalVolume, unit)), 0)}
              unit={unit}
              hint={`${formatNumber(stats.totalReps, 0)} reps`}
            />
          </section>

          <section aria-labelledby="progress-heading" className="surface rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="progress-heading" className="font-semibold">
                Progress
              </h2>
              <Tabs value={metric} onValueChange={(v) => setMetric(v as "weight" | "volume")}>
                <TabsList className="w-auto">
                  <TabsTrigger value="weight" className="h-8 px-3 text-xs">
                    Weight
                  </TabsTrigger>
                  <TabsTrigger value="volume" className="h-8 px-3 text-xs">
                    Volume
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {showWeightChart ? (
              <LineChart
                key={metric}
                data={chartData}
                format={(v) => `${formatNumber(v)} ${unit}`}
                ariaLabel={`${metric === "weight" ? "Top set weight" : "Session volume"} over the last ${chartData.length} sessions`}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Bodyweight only — switch to volume, or add load to track weight.
              </p>
            )}
          </section>

          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Workout history
            </h2>
            <ul className="flex flex-col gap-2">
              {[...sessions].reverse().map((s) => (
                <li key={s.workoutId}>
                  <Link
                    href={`/history/detail?id=${s.workoutId}`}
                    className="surface press block rounded-2xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{format(fromDateKey(s.date), "EEEE, d MMM yyyy")}</span>
                      <span className="text-xs text-muted-foreground tabular">{formatVolume(s.volume, unit)}</span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground tabular">
                      {s.sets.map((set) => (
                        <span key={set.id}>
                          {formatWeight(set.weight, unit, isBW)} × {set.reps}
                        </span>
                      ))}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <ExerciseFormSheet open={editing} onOpenChange={setEditing} exercise={exercise} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {exercise.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from your library. Past workouts keep their logged sets.
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

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-6" aria-busy="true">
      <Skeleton className="h-12 w-3/4" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-52" />
    </div>
  );
}
