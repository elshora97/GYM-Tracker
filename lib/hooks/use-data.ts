"use client";

/**
 * Reactive read hooks over IndexedDB (Dexie live queries). Components re-render
 * automatically when the underlying tables change. `undefined` means "loading".
 */
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getDb, USER_ID } from "@/lib/storage/db";
import { DEFAULT_SETTINGS } from "@/lib/storage/repositories/user";
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { bestSet, groupSessions, type ExerciseSession } from "@/lib/workout/metrics";

export function useUser() {
  return useLiveQuery(() => getDb().users.get(USER_ID), []);
}

export function useExercises() {
  return useLiveQuery(() => getDb().exercises.filter((e) => !e.archived).sortBy("name"), []);
}

/** Includes archived exercises — for rendering historical workouts. */
export function useExerciseMap() {
  const all = useLiveQuery(() => getDb().exercises.toArray(), []);
  return useMemo(() => (all ? new Map(all.map((e) => [e.id, e])) : undefined), [all]);
}

export function useExercise(id: string | null) {
  // `null` = not found, `undefined` = loading
  return useLiveQuery(async () => (id ? ((await getDb().exercises.get(id)) ?? null) : null), [id]);
}

export function useActiveWorkout() {
  // `null` = loaded, none active (distinguishes from `undefined` = loading)
  return useLiveQuery(async () => (await getDb().workouts.where("status").equals("active").first()) ?? null, []);
}

export function useCompletedWorkouts() {
  return useLiveQuery(
    () =>
      getDb()
        .workouts.where("status")
        .equals("completed")
        .reverse()
        .sortBy("startedAt"),
    [],
  );
}

export interface WorkoutDetail {
  workout: Workout;
  exercises: { we: WorkoutExercise; sets: WorkoutSet[] }[];
}

export function useWorkoutDetail(id: string | null | undefined) {
  return useLiveQuery(async (): Promise<WorkoutDetail | null> => {
    if (!id) return null;
    const db = getDb();
    const workout = await db.workouts.get(id);
    if (!workout) return null;
    const [wes, sets] = await Promise.all([
      db.workoutExercises.where("workoutId").equals(id).sortBy("order"),
      db.workoutSets.where("workoutId").equals(id).toArray(),
    ]);
    return {
      workout,
      exercises: wes.map((we) => ({
        we,
        sets: sets.filter((s) => s.workoutExerciseId === we.id).sort((a, b) => a.setNumber - b.setNumber),
      })),
    };
  }, [id]);
}

/** All completed sets + completed workouts, indexed for history views. */
export function useHistoryIndex() {
  return useLiveQuery(async () => {
    const db = getDb();
    const workouts = await db.workouts.where("status").equals("completed").toArray();
    const ids = workouts.map((w) => w.id);
    const [sets, wes] = await Promise.all([
      db.workoutSets.where("workoutId").anyOf(ids).toArray(),
      db.workoutExercises.where("workoutId").anyOf(ids).toArray(),
    ]);
    return {
      workouts: workouts.sort((a, b) => b.startedAt - a.startedAt),
      workoutMap: new Map(workouts.map((w) => [w.id, w])),
      sets: sets.filter((s) => s.completed),
      workoutExercises: wes,
    };
  }, []);
}

export interface LastPerformance {
  weight: number | null;
  reps: number;
  date: string;
}

/** exerciseId → best set of the most recent session. */
export function useLastPerformanceMap() {
  const index = useHistoryIndex();
  return useMemo(() => {
    if (!index) return undefined;
    const map = new Map<string, LastPerformance>();
    const byExercise = new Map<string, WorkoutSet[]>();
    for (const s of index.sets) {
      const list = byExercise.get(s.exerciseId) ?? [];
      list.push(s);
      byExercise.set(s.exerciseId, list);
    }
    for (const [exerciseId, sets] of byExercise) {
      const last = groupSessions(sets, index.workoutMap).at(-1);
      if (!last) continue;
      const top = bestSet(last.sets)!;
      map.set(exerciseId, { weight: top.weight, reps: top.reps, date: last.date });
    }
    return map;
  }, [index]);
}

export function useExerciseSessions(exerciseId: string | null): ExerciseSession[] | undefined {
  return useLiveQuery(async () => {
    if (!exerciseId) return [];
    const db = getDb();
    const sets = await db.workoutSets.where("exerciseId").equals(exerciseId).toArray();
    const workouts = await db.workouts.bulkGet(Array.from(new Set(sets.map((s) => s.workoutId))));
    const map = new Map(workouts.filter((w): w is Workout => !!w).map((w) => [w.id, w]));
    return groupSessions(sets, map);
  }, [exerciseId]);
}

/** Exercise ids used in the most recent completed workout of a category. */
export function useLastRoutine(category: Exercise["category"] | null) {
  return useLiveQuery(async () => {
    if (!category) return [];
    const db = getDb();
    const last = (
      await db.workouts
        .where("category")
        .equals(category)
        .filter((w) => w.status === "completed")
        .sortBy("startedAt")
    ).at(-1);
    if (!last) return [];
    const wes = await db.workoutExercises.where("workoutId").equals(last.id).sortBy("order");
    return wes.map((we) => we.exerciseId);
  }, [category]);
}

export function useSettings() {
  const user = useUser();
  return user?.settings ?? DEFAULT_SETTINGS;
}
