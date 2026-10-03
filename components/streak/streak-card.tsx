"use client";

import { Flame, Trophy } from "lucide-react";
import type { StreakStats } from "@/lib/types";
import { streakMessage, weekActivity } from "@/lib/streak";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { cn } from "@/lib/utils";
import { WeekStrip } from "@/components/streak/week-strip";

interface StreakCardProps {
  stats: StreakStats;
  workoutDates: string[];
  atRisk: boolean;
}

export function StreakCard({ stats, workoutDates, atRisk }: StreakCardProps) {
  const count = useCountUp(stats.currentStreak);
  const alive = stats.currentStreak > 0;

  return (
    <section
      aria-labelledby="streak-heading"
      className="surface relative overflow-hidden rounded-3xl p-5"
    >
      {/* ember glow */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -left-16 size-64 rounded-full blur-3xl transition-opacity",
          alive ? "bg-primary/25 opacity-100" : "bg-white/5",
        )}
      />
      <h2 id="streak-heading" className="sr-only">
        Gym streak
      </h2>

      <div className="relative flex items-center gap-4">
        <div className="relative grid size-20 shrink-0 place-items-center">
          <Flame
            className={cn("size-16", alive ? "animate-flicker fill-primary/30 text-primary" : "text-muted-foreground")}
            strokeWidth={1.6}
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <p className="sr-only">{stats.currentStreak} day streak</p>
          <p aria-hidden className="font-display text-7xl leading-[0.85] font-extrabold tabular">
            {count}
          </p>
          <p aria-hidden className="mt-1 font-display text-lg font-bold tracking-[0.18em] text-primary uppercase">
            Day streak
          </p>
        </div>
      </div>

      <p className={cn("relative mt-4 text-sm", atRisk ? "font-medium text-primary" : "text-muted-foreground")}>
        {atRisk ? "Train today to keep your streak alive." : streakMessage(stats)}
      </p>

      <dl className="relative mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <Trophy className="size-4 text-muted-foreground" aria-hidden />
          <div>
            <dt className="text-[11px] tracking-wider text-muted-foreground uppercase">Longest</dt>
            <dd className="font-display text-xl leading-tight font-bold tabular">
              {stats.longestStreak} <span className="text-xs font-medium text-muted-foreground">days</span>
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <Flame className="size-4 text-muted-foreground" aria-hidden />
          <div>
            <dt className="text-[11px] tracking-wider text-muted-foreground uppercase">Sessions</dt>
            <dd className="font-display text-xl leading-tight font-bold tabular">{stats.totalWorkouts}</dd>
          </div>
        </div>
      </dl>

      <div className="relative mt-5 border-t border-border pt-4">
        <WeekStrip days={weekActivity(workoutDates)} />
      </div>
    </section>
  );
}
