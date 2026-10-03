"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { useExerciseMap, useHistoryIndex, useSettings } from "@/lib/hooks/use-data";
import { buildWorkoutSummaries, groupByMonth, weeklyFrequency } from "@/lib/workout/history";
import { formatNumber, kgToUnit } from "@/lib/utils/units";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { StatTile } from "@/components/layout/stat-tile";
import { BarChart } from "@/components/charts/bar-chart";
import { WorkoutCard } from "@/components/history/workout-card";

const compact = (n: number) =>
  n >= 10_000 ? `${formatNumber(n / 1000, 1)}k` : formatNumber(Math.round(n), 0);

export default function HistoryPage() {
  const index = useHistoryIndex();
  const exercises = useExerciseMap();
  const { unit } = useSettings();

  const data = useMemo(() => {
    if (!index) return undefined;
    const summaries = buildWorkoutSummaries(index.workouts, index.workoutExercises, index.sets);
    const recent = summaries.filter((s) => Date.now() - s.workout.startedAt < 30 * 864e5);
    const avgDuration = recent.length
      ? recent.reduce((n, s) => n + (s.workout.duration ?? 0), 0) / recent.length
      : 0;
    return {
      groups: groupByMonth(summaries),
      frequency: weeklyFrequency(index.workouts),
      last30: recent.length,
      avgDuration,
      volume30: recent.reduce((n, s) => n + s.volume, 0),
    };
  }, [index]);

  return (
    <div>
      <PageHeader title="History" />
      {!data || !exercises ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-40" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : data.groups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No workouts yet"
          description="Your first workout starts here."
          action={
            <Button asChild size="lg" className="w-full">
              <Link href="/workout">Start Workout</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-labelledby="freq-heading" className="surface rounded-2xl p-4">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 id="freq-heading" className="font-semibold">
                Workouts per week
              </h2>
              <span className="text-xs text-muted-foreground">Last 8 weeks</span>
            </div>
            <BarChart data={data.frequency} ariaLabel="Number of workouts in each of the last 8 weeks" />
          </section>

          <section aria-label="Last 30 days" className="grid grid-cols-3 gap-2">
            <StatTile label="30 days" value={data.last30} hint="sessions" />
            <StatTile label="Avg time" value={Math.round(data.avgDuration / 60)} unit="min" />
            <StatTile label="Volume" value={compact(kgToUnit(data.volume30, unit))} unit={unit} />
          </section>

          {data.groups.map((g) => (
            <section key={g.month} aria-label={g.month}>
              <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">{g.month}</h2>
              <div className="flex flex-col gap-3">
                {g.items.map((s) => (
                  <WorkoutCard key={s.workout.id} summary={s} exercises={exercises} unit={unit} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
