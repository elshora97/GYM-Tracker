"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Dumbbell, ListPlus } from "lucide-react";
import { useActiveWorkout, useExerciseMap, useHistoryIndex, useUser } from "@/lib/hooks/use-data";
import { isStreakAtRisk } from "@/lib/streak";
import { buildWorkoutSummaries } from "@/lib/workout/history";
import { greeting, todayKey } from "@/lib/utils/date";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { EmptyState } from "@/components/layout/empty-state";
import { StreakCard } from "@/components/streak/streak-card";
import { TodayWorkout } from "@/components/dashboard/today-workout";
import { InstallBanner } from "@/components/dashboard/install-banner";
import { WorkoutCard } from "@/components/history/workout-card";
import { AppTour } from "@/components/onboarding/app-tour";

export default function HomePage() {
  const user = useUser();
  const active = useActiveWorkout();
  const index = useHistoryIndex();
  const exercises = useExerciseMap();

  const recent = useMemo(
    () => (index ? buildWorkoutSummaries(index.workouts.slice(0, 3), index.workoutExercises, index.sets) : undefined),
    [index],
  );

  if (!user || active === undefined || !index || !exercises || !recent) return <HomeSkeleton />;

  const today = todayKey();
  const trainedToday = index.workouts.find((w) => w.date === today) ?? null;
  const dates = index.workouts.map((w) => w.date);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between pt-5 lg:pt-8">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="truncate font-display text-3xl font-bold tracking-wide uppercase">{user.name}</h1>
        </div>
        <Logo className="size-10 lg:hidden" />
      </header>

      {exercises.size === 0 && (
        <section className="surface flex items-center gap-4 rounded-2xl border-primary/30 p-4" aria-label="Get started">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <ListPlus className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Build your exercise library</p>
            <p className="text-sm text-muted-foreground">Add the exercises you train on Push, Pull and Legs days.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/exercises">Add</Link>
          </Button>
        </section>
      )}

      <StreakCard
        stats={user.stats}
        workoutDates={dates}
        atRisk={isStreakAtRisk(user.stats, user.settings.streakRestDays)}
      />

      <div data-tour="today">
      <TodayWorkout
        user={user}
        active={active}
        trainedToday={trainedToday}
        lastWorkout={index.workouts[0] ?? null}
      />
      </div>

      {!user.tourCompletedAt && <AppTour hasExercises={exercises.size > 0} />}

      <InstallBanner />

      <section aria-labelledby="recent-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Recent workouts
          </h2>
          {recent.length > 0 && (
            <Link href="/history" className="rounded-md px-1 text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            description="Your first workout starts here."
            action={
              <Button asChild size="lg" className="w-full">
                <Link href="/workout">Start Workout</Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((s) => (
              <WorkoutCard key={s.workout.id} summary={s} exercises={exercises} unit={user.settings.unit} maxLines={3} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-5 lg:pt-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}
