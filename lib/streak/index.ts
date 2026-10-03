/**
 * Streak engine — pure functions, no storage or React dependencies.
 *
 * Rules:
 * - A "gym day" is a calendar day (local time) with at least one *completed* workout.
 *   Multiple workouts on the same day count once.
 * - Two gym days are part of the same streak when the gap between them is at most
 *   `restDays + 1` calendar days (restDays = 0 → strictly consecutive days).
 * - The current streak is alive while today is still within that window of the last
 *   gym day. Once the window passes, the current streak resets to 0.
 * - Streak length is measured in gym days.
 */
import { startOfWeek } from "date-fns";
import type { StreakStats } from "@/lib/types";
import { daysBetweenKeys, fromDateKey, shiftDateKey, toDateKey } from "@/lib/utils/date";

export function uniqueSortedDays(dateKeys: Iterable<string>): string[] {
  return Array.from(new Set(dateKeys)).sort();
}

export function computeStreakStats(
  dateKeys: Iterable<string>,
  restDays: number,
  today: string = toDateKey(),
): StreakStats {
  const days = uniqueSortedDays(dateKeys).filter((d) => d <= today);
  if (days.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, lastWorkoutDate: null };
  }

  const maxGap = restDays + 1;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = daysBetweenKeys(days[i - 1], days[i]) <= maxGap ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const last = days[days.length - 1];
  const current = daysBetweenKeys(last, today) <= maxGap ? run : 0;

  return {
    currentStreak: current,
    longestStreak: longest,
    totalWorkouts: days.length,
    lastWorkoutDate: last,
  };
}

/** Total workouts counts sessions, not days — callers pass the session count separately. */
export function withSessionCount(stats: StreakStats, sessions: number): StreakStats {
  return { ...stats, totalWorkouts: sessions };
}

/** Streak is alive but needs a workout today (or soon) to survive. */
export function isStreakAtRisk(stats: StreakStats, restDays: number, today = toDateKey()): boolean {
  if (!stats.lastWorkoutDate || stats.currentStreak === 0) return false;
  return daysBetweenKeys(stats.lastWorkoutDate, today) === restDays + 1;
}

export function streakMessage(stats: StreakStats, today = toDateKey()): string {
  const { currentStreak: cur, longestStreak: best, lastWorkoutDate } = stats;
  if (stats.totalWorkouts === 0) return "Your first workout starts the streak.";
  if (cur === 0) return "Start a new streak today.";
  const trainedToday = lastWorkoutDate === today;
  if (cur >= best) {
    return trainedToday ? "New record. Keep showing up." : "You're at your record. Train today to beat it.";
  }
  const needed = best - cur + 1;
  return `${needed} more ${needed === 1 ? "workout" : "workouts"} to beat your record`;
}

export type DayState = "completed" | "today" | "today-completed" | "missed" | "upcoming";

export interface WeekDay {
  key: string;
  label: string;
  state: DayState;
}

/** Monday-first activity strip for the current week. */
export function weekActivity(dateKeys: Iterable<string>, today = toDateKey()): WeekDay[] {
  const done = new Set(dateKeys);
  const monday = toDateKey(startOfWeek(fromDateKey(today), { weekStartsOn: 1 }));
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => {
    const key = shiftDateKey(monday, i);
    let state: DayState;
    if (key === today) state = done.has(key) ? "today-completed" : "today";
    else if (key > today) state = "upcoming";
    else state = done.has(key) ? "completed" : "missed";
    return { key, label, state };
  });
}
