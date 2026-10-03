/**
 * Pure workout metrics. Everything here works in kilograms.
 */
import type { Workout, WorkoutSet } from "@/lib/types";

type SetLike = Pick<WorkoutSet, "weight" | "reps">;

/** Volume = weight × reps. Bodyweight-only sets contribute 0 load volume. */
export function setVolume(set: SetLike): number {
  return (set.weight ?? 0) * set.reps;
}

export function totalVolume(sets: SetLike[]): number {
  return sets.reduce((sum, s) => sum + setVolume(s), 0);
}

/** Heaviest set (ties broken by reps). */
export function bestSet<T extends SetLike>(sets: T[]): T | null {
  let best: T | null = null;
  for (const s of sets) {
    if (
      !best ||
      (s.weight ?? 0) > (best.weight ?? 0) ||
      ((s.weight ?? 0) === (best.weight ?? 0) && s.reps > best.reps)
    ) {
      best = s;
    }
  }
  return best;
}

/** Epley estimated one-rep max. */
export function estimatedOneRepMax(set: SetLike): number {
  if (!set.weight) return 0;
  if (set.reps <= 1) return set.weight;
  return set.weight * (1 + set.reps / 30);
}

export interface SetSummary {
  weight: number | null;
  reps: number;
  sets: number;
}

/** Collapses an exercise's sets into "65 kg × 8 × 3" (top weight, its reps, set count). */
export function summarizeSets(sets: SetLike[]): SetSummary | null {
  const top = bestSet(sets);
  if (!top) return null;
  return { weight: top.weight, reps: top.reps, sets: sets.length };
}

export interface ExerciseSession {
  workoutId: string;
  date: string;
  completedAt: number;
  sets: WorkoutSet[];
  topWeight: number;
  topReps: number;
  volume: number;
}

/** Group an exercise's completed sets into sessions, oldest first. */
export function groupSessions(sets: WorkoutSet[], workouts: Map<string, Workout>): ExerciseSession[] {
  const byWorkout = new Map<string, WorkoutSet[]>();
  for (const s of sets) {
    if (!s.completed) continue;
    const w = workouts.get(s.workoutId);
    if (!w || w.status !== "completed") continue;
    const list = byWorkout.get(s.workoutId) ?? [];
    list.push(s);
    byWorkout.set(s.workoutId, list);
  }
  const sessions: ExerciseSession[] = [];
  for (const [workoutId, list] of byWorkout) {
    const w = workouts.get(workoutId)!;
    list.sort((a, b) => a.setNumber - b.setNumber);
    const top = bestSet(list)!;
    sessions.push({
      workoutId,
      date: w.date,
      completedAt: w.completedAt ?? w.startedAt,
      sets: list,
      topWeight: top.weight ?? 0,
      topReps: top.reps,
      volume: totalVolume(list),
    });
  }
  return sessions.sort((a, b) => a.completedAt - b.completedAt);
}

export interface ExerciseStats {
  personalBest: { weight: number | null; reps: number; date: string } | null;
  estimated1RM: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  sessions: number;
  lastSession: ExerciseSession | null;
}

export function exerciseStats(sessions: ExerciseSession[]): ExerciseStats {
  let pb: ExerciseStats["personalBest"] = null;
  let e1rm = 0;
  let totalSets = 0;
  let totalReps = 0;
  let volume = 0;
  for (const session of sessions) {
    for (const s of session.sets) {
      totalSets++;
      totalReps += s.reps;
      volume += setVolume(s);
      e1rm = Math.max(e1rm, estimatedOneRepMax(s));
      if (
        !pb ||
        (s.weight ?? 0) > (pb.weight ?? 0) ||
        ((s.weight ?? 0) === (pb.weight ?? 0) && s.reps > pb.reps)
      ) {
        pb = { weight: s.weight, reps: s.reps, date: session.date };
      }
    }
  }
  return {
    personalBest: pb,
    estimated1RM: e1rm,
    totalSets,
    totalReps,
    totalVolume: volume,
    sessions: sessions.length,
    lastSession: sessions.at(-1) ?? null,
  };
}
