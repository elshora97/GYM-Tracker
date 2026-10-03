import Dexie, { type EntityTable } from "dexie";
import type { Exercise, User, Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";

/**
 * IndexedDB database (via Dexie). Tables map 1:1 to the domain models and to the
 * future relational schema. Only the repositories in `lib/storage/repositories`
 * should touch this directly.
 */
export class GymDatabase extends Dexie {
  users!: EntityTable<User, "id">;
  exercises!: EntityTable<Exercise, "id">;
  workouts!: EntityTable<Workout, "id">;
  workoutExercises!: EntityTable<WorkoutExercise, "id">;
  workoutSets!: EntityTable<WorkoutSet, "id">;

  constructor() {
    super("gym-tracker");
    this.version(1).stores({
      users: "id",
      exercises: "id, category, name, archived",
      workouts: "id, date, status, startedAt, category",
      workoutExercises: "id, workoutId, exerciseId, [workoutId+order]",
      workoutSets: "id, workoutId, workoutExerciseId, exerciseId",
    });
  }
}

let instance: GymDatabase | null = null;

export function getDb(): GymDatabase {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  instance ??= new GymDatabase();
  return instance;
}

export const USER_ID = "me";
