import { getDb, USER_ID } from "@/lib/storage/db";
import { createUser, recomputeStats } from "@/lib/storage/repositories/user";
import type { Category, Exercise, Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { uid } from "@/lib/utils";
import { shiftDateKey, todayKey, fromDateKey } from "@/lib/utils/date";
import { nextCategory } from "@/lib/workout/catalog";

/**
 * The app ships with an empty exercise library — users build their own.
 * These exercises exist only for the opt-in demo data (Profile → Load demo data).
 */
const DEMO_EXERCISES: { name: string; category: Category; muscleGroup: string; isBodyweight?: boolean }[] = [
  { name: "Bench Press", category: "push", muscleGroup: "Chest" },
  { name: "Incline Bench Press", category: "push", muscleGroup: "Chest" },
  { name: "Shoulder Press", category: "push", muscleGroup: "Shoulders" },
  { name: "Lateral Raise", category: "push", muscleGroup: "Shoulders" },
  { name: "Triceps Pushdown", category: "push", muscleGroup: "Triceps" },
  { name: "Deadlift", category: "pull", muscleGroup: "Back" },
  { name: "Lat Pulldown", category: "pull", muscleGroup: "Lats" },
  { name: "Pull Ups", category: "pull", muscleGroup: "Lats", isBodyweight: true },
  { name: "Barbell Row", category: "pull", muscleGroup: "Back" },
  { name: "Face Pull", category: "pull", muscleGroup: "Rear Delts" },
  { name: "Barbell Curl", category: "pull", muscleGroup: "Biceps" },
  { name: "Squat", category: "legs", muscleGroup: "Quads" },
  { name: "Romanian Deadlift", category: "legs", muscleGroup: "Hamstrings" },
  { name: "Leg Press", category: "legs", muscleGroup: "Quads" },
  { name: "Leg Curl", category: "legs", muscleGroup: "Hamstrings" },
  { name: "Calf Raise", category: "legs", muscleGroup: "Calves" },
];

function buildDemoExercises(): Exercise[] {
  const now = Date.now();
  return DEMO_EXERCISES.map((d) => ({
    id: uid(),
    name: d.name,
    category: d.category,
    muscleGroup: d.muscleGroup,
    isBodyweight: !!d.isBodyweight,
    isCustom: true,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }));
}

const ROUTINES: Record<Category, string[]> = {
  push: ["Bench Press", "Incline Bench Press", "Shoulder Press", "Lateral Raise", "Triceps Pushdown"],
  pull: ["Deadlift", "Lat Pulldown", "Pull Ups", "Barbell Row", "Face Pull", "Barbell Curl"],
  legs: ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raise"],
};

/** Starting working weights (kg) for the demo athlete. */
const BASE_WEIGHT: Record<string, number> = {
  "Bench Press": 55,
  "Incline Bench Press": 45,
  "Shoulder Press": 35,
  "Lateral Raise": 8,
  "Triceps Pushdown": 22.5,
  Deadlift: 110,
  "Lat Pulldown": 50,
  "Pull Ups": 0,
  "Barbell Row": 55,
  "Face Pull": 17.5,
  "Barbell Curl": 25,
  Squat: 80,
  "Romanian Deadlift": 70,
  "Leg Press": 140,
  "Leg Curl": 35,
  "Calf Raise": 55,
};

/** Deterministic PRNG so the demo looks the same on every device. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Day offsets (relative to today, negative = past) with a gym session.
 * Produces: a 10-day best streak a few weeks back, a few scattered sessions,
 * and a current 7-day streak ending yesterday — so finishing today makes it 8.
 */
const DEMO_DAY_OFFSETS = [
  -38, -36, -34, -31, -30, -29, -28, -27, -26, -25, -24, -23, -22, -19, -17, -14, -12, -10, -7, -6, -5, -4, -3, -2, -1,
];

function buildDemoHistory(exercises: Exercise[]) {
  const rand = mulberry32(42);
  const byName = new Map(exercises.map((e) => [e.name, e]));
  const workouts: Workout[] = [];
  const workoutExercises: WorkoutExercise[] = [];
  const workoutSets: WorkoutSet[] = [];
  const today = todayKey();
  const sessionCount: Record<Category, number> = { push: 0, pull: 0, legs: 0 };

  // Choose categories so the last demo session is LEGS → today's suggestion is PUSH.
  const order: Category[] = ["push", "pull", "legs"];
  const firstIndex = (3 - (DEMO_DAY_OFFSETS.length % 3)) % 3;

  DEMO_DAY_OFFSETS.forEach((offset, i) => {
    const category = order[(firstIndex + i) % 3];
    const date = shiftDateKey(today, offset);
    const start = fromDateKey(date);
    start.setHours(18, Math.floor(rand() * 40), 0, 0);
    const duration = (38 + Math.floor(rand() * 22)) * 60;
    const workout: Workout = {
      id: uid(),
      date,
      category,
      status: "completed",
      startedAt: start.getTime(),
      completedAt: start.getTime() + duration * 1000,
      duration,
    };
    workouts.push(workout);
    const progression = Math.floor(sessionCount[category] / 2);
    sessionCount[category]++;

    ROUTINES[category].forEach((name, order) => {
      const ex = byName.get(name);
      if (!ex) return;
      const we: WorkoutExercise = { id: uid(), workoutId: workout.id, exerciseId: ex.id, order, completed: true };
      workoutExercises.push(we);
      const base = BASE_WEIGHT[name] ?? 20;
      const step = base >= 20 ? 2.5 : 1;
      const weight = ex.isBodyweight ? null : base + step * progression;
      const topReps = ex.isBodyweight ? 6 + Math.floor(rand() * 4) : 8 + Math.floor(rand() * 3);
      for (let s = 0; s < 3; s++) {
        const reps = Math.max(5, topReps - (s === 2 && rand() > 0.5 ? 1 : 0));
        workoutSets.push({
          id: uid(),
          workoutExerciseId: we.id,
          workoutId: workout.id,
          exerciseId: ex.id,
          setNumber: s + 1,
          weight,
          reps,
          completed: true,
          completedAt: workout.startedAt + (order * 3 + s + 1) * 150_000,
        });
      }
    });
  });

  return { workouts, workoutExercises, workoutSets, lastCategory: workouts.at(-1)?.category ?? null };
}

/** First launch: create an empty profile. No exercises — the user adds their own. */
export async function seedIfEmpty(): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.users, async () => {
    if (await db.users.get(USER_ID)) return;
    await db.users.add(createUser());
  });
}

/** Wipes everything. With withDemoData, loads sample exercises and ~6 weeks of workouts. */
export async function seedDatabase({ withDemoData }: { withDemoData: boolean }) {
  const db = getDb();
  await db.transaction("rw", [db.users, db.exercises, db.workouts, db.workoutExercises, db.workoutSets], async () => {
    const previous = await db.users.get(USER_ID);
    await Promise.all([
      db.users.clear(),
      db.exercises.clear(),
      db.workouts.clear(),
      db.workoutExercises.clear(),
      db.workoutSets.clear(),
    ]);
    const user = createUser(previous?.name);
    if (previous) user.settings = previous.settings;
    if (withDemoData) {
      const exercises = buildDemoExercises();
      await db.exercises.bulkAdd(exercises);
      const history = buildDemoHistory(exercises);
      await db.workouts.bulkAdd(history.workouts);
      await db.workoutExercises.bulkAdd(history.workoutExercises);
      await db.workoutSets.bulkAdd(history.workoutSets);
      user.todayPlan = { date: todayKey(), category: nextCategory(history.lastCategory) };
    }
    await db.users.add(user);
    await recomputeStats();
  });
}
