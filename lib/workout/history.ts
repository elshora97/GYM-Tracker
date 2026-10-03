import { addWeeks, format, startOfWeek } from "date-fns";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { fromDateKey, toDateKey } from "@/lib/utils/date";
import { totalVolume } from "@/lib/workout/metrics";

export interface WorkoutSummary {
  workout: Workout;
  items: { exerciseId: string; sets: WorkoutSet[] }[];
  totalSets: number;
  volume: number;
}

export function buildWorkoutSummaries(
  workouts: Workout[],
  workoutExercises: WorkoutExercise[],
  sets: WorkoutSet[],
): WorkoutSummary[] {
  const setsByWe = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    const list = setsByWe.get(s.workoutExerciseId) ?? [];
    list.push(s);
    setsByWe.set(s.workoutExerciseId, list);
  }
  const wesByWorkout = new Map<string, WorkoutExercise[]>();
  for (const we of workoutExercises) {
    const list = wesByWorkout.get(we.workoutId) ?? [];
    list.push(we);
    wesByWorkout.set(we.workoutId, list);
  }
  return workouts.map((workout) => {
    const items = (wesByWorkout.get(workout.id) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((we) => ({
        exerciseId: we.exerciseId,
        sets: (setsByWe.get(we.id) ?? []).sort((a, b) => a.setNumber - b.setNumber),
      }))
      .filter((i) => i.sets.length > 0);
    const all = items.flatMap((i) => i.sets);
    return { workout, items, totalSets: all.length, volume: totalVolume(all) };
  });
}

/** Workouts per week for the last `weeks` weeks (Monday-based), oldest first. */
export function weeklyFrequency(workouts: Workout[], weeks = 8, today = new Date()) {
  const thisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = addWeeks(thisWeek, i - weeks + 1);
    return { key: toDateKey(start), label: i === weeks - 1 ? "Now" : format(start, "d/M"), value: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const w of workouts) {
    const key = toDateKey(startOfWeek(fromDateKey(w.date), { weekStartsOn: 1 }));
    const i = index.get(key);
    if (i !== undefined) buckets[i].value++;
  }
  return buckets;
}

/** Group summaries by "October 2026". Input must be newest-first. */
export function groupByMonth<T extends { workout: Workout }>(items: T[]) {
  const groups: { month: string; items: T[] }[] = [];
  for (const item of items) {
    const month = format(fromDateKey(item.workout.date), "MMMM yyyy");
    const last = groups.at(-1);
    if (last?.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }
  return groups;
}
