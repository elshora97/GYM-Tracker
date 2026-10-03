"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Workout } from "@/lib/types";
import { useExerciseMap, useSettings, useWorkoutDetail } from "@/lib/hooks/use-data";
import { useNow } from "@/lib/hooks/use-count-up";
import { addExerciseToWorkout, deleteWorkout, finishWorkout } from "@/lib/storage/repositories/workouts";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { formatClock } from "@/lib/utils/date";
import { pluralize } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExerciseLogger } from "@/components/workout/exercise-logger";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { catVar } from "@/components/workout/category-style";
import { EmptyState } from "@/components/layout/empty-state";

export function ActiveWorkout({ workout }: { workout: Workout }) {
  const router = useRouter();
  const detail = useWorkoutDetail(workout.id);
  const exercises = useExerciseMap();
  const { unit } = useSettings();
  const now = useNow();
  const [expandedId, setExpandedId] = useState<string | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirm, setConfirm] = useState<"finish" | "discard" | null>(null);
  const [busy, setBusy] = useState(false);

  if (!detail || !exercises) {
    return (
      <div className="flex flex-col gap-3 pt-6" aria-busy="true">
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  const items = detail.exercises;
  // Default: the first exercise that isn't complete is open.
  const openId = expandedId === undefined ? (items.find((i) => !i.we.completed)?.we.id ?? null) : expandedId;
  const allSets = items.flatMap((i) => i.sets);
  const doneSets = allSets.filter((s) => s.completed).length;
  const openSets = allSets.length - doneSets;

  const openNext = (afterId: string) => {
    const idx = items.findIndex((i) => i.we.id === afterId);
    const next = items.slice(idx + 1).find((i) => !i.we.completed) ?? items.find((i) => !i.we.completed && i.we.id !== afterId);
    setExpandedId(next?.we.id ?? null);
  };

  const requestFinish = () => {
    if (doneSets === 0) {
      toast("Log at least one set first", { description: "Tap ✓ next to a set once you've done it." });
      return;
    }
    if (openSets > 0) setConfirm("finish");
    else void doFinish();
  };

  const doFinish = async () => {
    setBusy(true);
    try {
      await finishWorkout(workout.id);
      router.replace(`/workout/complete?id=${workout.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't finish workout");
      setBusy(false);
    }
  };

  const doDiscard = async () => {
    await deleteWorkout(workout.id);
    toast("Workout discarded");
    router.replace("/");
  };

  return (
    <div style={catVar(workout.category)}>
      {/* Sticky header with live timer */}
      <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-border bg-background/80 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl leading-none font-extrabold tracking-wide uppercase">
              {CATEGORY_META[workout.category].dayLabel}
            </h1>
            <p className="mt-1 font-display text-3xl leading-none font-bold text-primary tabular" role="timer" aria-label="Workout duration">
              {formatClock((now - workout.startedAt) / 1000)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Workout options">
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setPickerOpen(true)}>
                <Plus /> Add exercises
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("discard")}>
                <Trash2 /> Discard workout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={requestFinish} disabled={busy} className="px-5">
            <Flag className="size-4" aria-hidden /> Finish
          </Button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${allSets.length ? (doneSets / allSets.length) * 100 : 0}%` }}
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {doneSets} of {allSets.length} sets done
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No exercises yet"
          description="Add exercises to start logging sets."
          action={
            <Button size="lg" className="w-full" onClick={() => setPickerOpen(true)}>
              Add exercises
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(({ we, sets }) => (
            <ExerciseLogger
              key={we.id}
              we={we}
              sets={sets}
              exercise={exercises.get(we.exerciseId)}
              unit={unit}
              expanded={openId === we.id}
              onToggle={() => setExpandedId(openId === we.id ? null : we.id)}
              onCompleted={() => openNext(we.id)}
            />
          ))}
          <Button variant="outline" size="lg" className="border-dashed" onClick={() => setPickerOpen(true)}>
            <Plus className="size-5" aria-hidden /> Add exercise
          </Button>
          <Button size="lg" className="mt-2" onClick={requestFinish} disabled={busy}>
            <Flag className="size-5" aria-hidden /> Finish Workout
          </Button>
        </div>
      )}

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialCategory={workout.category}
        exclude={items.map((i) => i.we.exerciseId)}
        onConfirm={async (ids) => {
          for (const id of ids) await addExerciseToWorkout(workout.id, id);
        }}
      />

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          {confirm === "finish" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Finish workout?</AlertDialogTitle>
                <AlertDialogDescription>
                  {pluralize(openSets, "set")} {openSets === 1 ? "isn't" : "aren't"} checked off and won&apos;t be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep going</AlertDialogCancel>
                <AlertDialogAction onClick={doFinish}>Finish</AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard workout?</AlertDialogTitle>
                <AlertDialogDescription>All sets from this session will be deleted.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={doDiscard}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
