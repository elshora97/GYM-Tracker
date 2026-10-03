import { getDb } from "@/lib/storage/db";
import { recomputeStats, setTodayPlan } from "@/lib/storage/repositories/user";
import type { Category, StreakStats, Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { uid } from "@/lib/utils";
import { todayKey } from "@/lib/utils/date";
import { totalVolume } from "@/lib/workout/metrics";

const DEFAULT_SET_COUNT = 3;
const DEFAULT_REPS = 10;

export async function getActiveWorkout(): Promise<Workout | undefined> {
  return getDb().workouts.where("status").equals("active").first();
}

/** Completed sets from the most recent completed workout containing this exercise. */
export async function getLastSessionSets(exerciseId: string, excludeWorkoutId?: string): Promise<WorkoutSet[]> {
  const db = getDb();
  const sets = await db.workoutSets.where("exerciseId").equals(exerciseId).filter((s) => s.completed).toArray();
  if (sets.length === 0) return [];
  const workoutIds = Array.from(new Set(sets.map((s) => s.workoutId))).filter((id) => id !== excludeWorkoutId);
  const workouts = (await db.workouts.bulkGet(workoutIds)).filter(
    (w): w is Workout => !!w && w.status === "completed",
  );
  if (workouts.length === 0) return [];
  const latest = workouts.reduce((a, b) => ((a.completedAt ?? 0) >= (b.completedAt ?? 0) ? a : b));
  return sets.filter((s) => s.workoutId === latest.id).sort((a, b) => a.setNumber - b.setNumber);
}

/** Pre-fills sets from the previous session (weights + reps), or sensible defaults. */
async function buildInitialSets(
  workoutId: string,
  we: WorkoutExercise,
  isBodyweight: boolean,
): Promise<WorkoutSet[]> {
  const previous = await getLastSessionSets(we.exerciseId, workoutId);
  const template =
    previous.length > 0
      ? previous.map((s) => ({ weight: s.weight, reps: s.reps }))
      : Array.from({ length: DEFAULT_SET_COUNT }, () => ({
          weight: isBodyweight ? null : 20,
          reps: DEFAULT_REPS,
        }));
  return template.map((t, i) => ({
    id: uid(),
    workoutExerciseId: we.id,
    workoutId,
    exerciseId: we.exerciseId,
    setNumber: i + 1,
    weight: t.weight,
    reps: t.reps,
    completed: false,
    completedAt: null,
  }));
}

export async function startWorkout(category: Category, exerciseIds: string[]): Promise<Workout> {
  const db = getDb();
  const existing = await getActiveWorkout();
  if (existing) return existing;

  const now = Date.now();
  const workout: Workout = {
    id: uid(),
    date: todayKey(),
    category,
    status: "active",
    startedAt: now,
    completedAt: null,
    duration: null,
  };

  await db.transaction("rw", [db.workouts, db.workoutExercises, db.workoutSets, db.exercises, db.users], async () => {
    await db.workouts.add(workout);
    const exercises = await db.exercises.bulkGet(exerciseIds);
    for (const [order, ex] of exercises.entries()) {
      if (!ex) continue;
      const we: WorkoutExercise = { id: uid(), workoutId: workout.id, exerciseId: ex.id, order, completed: false };
      await db.workoutExercises.add(we);
      await db.workoutSets.bulkAdd(await buildInitialSets(workout.id, we, ex.isBodyweight));
    }
    await setTodayPlan(category);
  });
  return workout;
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const db = getDb();
  await db.transaction("rw", [db.workouts, db.workoutExercises, db.workoutSets, db.exercises], async () => {
    const ex = await db.exercises.get(exerciseId);
    if (!ex) return;
    const current = await db.workoutExercises.where("workoutId").equals(workoutId).toArray();
    if (current.some((we) => we.exerciseId === exerciseId)) return;
    const order = current.reduce((max, we) => Math.max(max, we.order + 1), 0);
    const we: WorkoutExercise = { id: uid(), workoutId, exerciseId, order, completed: false };
    await db.workoutExercises.add(we);
    await db.workoutSets.bulkAdd(await buildInitialSets(workoutId, we, ex.isBodyweight));
  });
}

export async function removeWorkoutExercise(workoutExerciseId: string) {
  const db = getDb();
  await db.transaction("rw", db.workoutExercises, db.workoutSets, async () => {
    await db.workoutSets.where("workoutExerciseId").equals(workoutExerciseId).delete();
    await db.workoutExercises.delete(workoutExerciseId);
  });
}

export async function setExerciseCompleted(workoutExerciseId: string, completed: boolean) {
  await getDb().workoutExercises.update(workoutExerciseId, { completed });
}

/** Adds a new set that duplicates the last one (fast "same again"). */
export async function addSet(workoutExerciseId: string): Promise<WorkoutSet | undefined> {
  const db = getDb();
  return db.transaction("rw", db.workoutExercises, db.workoutSets, async () => {
    const we = await db.workoutExercises.get(workoutExerciseId);
    if (!we) return;
    const sets = await db.workoutSets.where("workoutExerciseId").equals(workoutExerciseId).sortBy("setNumber");
    const last = sets.at(-1);
    const set: WorkoutSet = {
      id: uid(),
      workoutExerciseId,
      workoutId: we.workoutId,
      exerciseId: we.exerciseId,
      setNumber: sets.length + 1,
      weight: last ? last.weight : null,
      reps: last ? last.reps : DEFAULT_REPS,
      completed: false,
      completedAt: null,
    };
    await db.workoutSets.add(set);
    if (we.completed) await db.workoutExercises.update(we.id, { completed: false });
    return set;
  });
}

export async function updateSet(id: string, patch: Partial<Pick<WorkoutSet, "weight" | "reps" | "completed">>) {
  const changes: Partial<WorkoutSet> = { ...patch };
  if (patch.completed !== undefined) changes.completedAt = patch.completed ? Date.now() : null;
  if (patch.reps !== undefined) changes.reps = Math.max(0, Math.round(patch.reps));
  if (patch.weight !== undefined && patch.weight !== null) changes.weight = Math.max(0, patch.weight);
  await getDb().workoutSets.update(id, changes);
}

export async function deleteSet(id: string) {
  const db = getDb();
  await db.transaction("rw", db.workoutSets, async () => {
    const set = await db.workoutSets.get(id);
    if (!set) return;
    await db.workoutSets.delete(id);
    const rest = await db.workoutSets.where("workoutExerciseId").equals(set.workoutExerciseId).sortBy("setNumber");
    await Promise.all(rest.map((s, i) => db.workoutSets.update(s.id, { setNumber: i + 1 })));
  });
}

export interface FinishResult {
  workout: Workout;
  exercises: number;
  sets: number;
  volume: number;
  stats: StreakStats;
}

/**
 * Completes the workout: unchecked sets and exercises without completed sets are
 * dropped, duration is recorded, and the streak snapshot is recomputed.
 */
export async function finishWorkout(workoutId: string): Promise<FinishResult> {
  const db = getDb();
  return db.transaction("rw", [db.workouts, db.workoutExercises, db.workoutSets, db.users], async () => {
    const workout = await db.workouts.get(workoutId);
    if (!workout) throw new Error("Workout not found");

    const sets = await db.workoutSets.where("workoutId").equals(workoutId).toArray();
    const done = sets.filter((s) => s.completed);
    if (done.length === 0) throw new Error("Complete at least one set before finishing");

    await db.workoutSets.bulkDelete(sets.filter((s) => !s.completed).map((s) => s.id));
    const exercises = await db.workoutExercises.where("workoutId").equals(workoutId).sortBy("order");
    const withSets = new Set(done.map((s) => s.workoutExerciseId));
    const keep = exercises.filter((we) => withSets.has(we.id));
    await db.workoutExercises.bulkDelete(exercises.filter((we) => !withSets.has(we.id)).map((we) => we.id));
    for (const [order, we] of keep.entries()) {
      await db.workoutExercises.update(we.id, { order, completed: true });
      const own = done.filter((s) => s.workoutExerciseId === we.id).sort((a, b) => a.setNumber - b.setNumber);
      await Promise.all(own.map((s, i) => db.workoutSets.update(s.id, { setNumber: i + 1 })));
    }

    const completedAt = Date.now();
    const finished: Workout = {
      ...workout,
      status: "completed",
      completedAt,
      duration: Math.round((completedAt - workout.startedAt) / 1000),
    };
    await db.workouts.put(finished);
    const stats = await recomputeStats();
    return { workout: finished, exercises: keep.length, sets: done.length, volume: totalVolume(done), stats };
  });
}

/** Deletes a workout and everything under it (used for discard + history delete). */
export async function deleteWorkout(workoutId: string) {
  const db = getDb();
  await db.transaction("rw", [db.workouts, db.workoutExercises, db.workoutSets, db.users], async () => {
    await db.workoutSets.where("workoutId").equals(workoutId).delete();
    await db.workoutExercises.where("workoutId").equals(workoutId).delete();
    await db.workouts.delete(workoutId);
    await recomputeStats();
  });
}
