/**
 * Domain models.
 *
 * These mirror a relational schema so they can map 1:1 onto PostgreSQL/Prisma later
 * (see docs/schema.prisma.example). All weights are stored in **kilograms**; the UI
 * converts to the user's preferred unit for display and input.
 */

export type Category = "push" | "pull" | "legs";

export const CATEGORIES: Category[] = ["push", "pull", "legs"];

export type WeightUnit = "kg" | "lbs";

export interface UserSettings {
  unit: WeightUnit;
  /** Rest days allowed between sessions before a streak breaks (0 = strict consecutive days). */
  streakRestDays: 0 | 1 | 2;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  /** Local calendar date (YYYY-MM-DD) of the last completed workout. */
  lastWorkoutDate: string | null;
}

export interface TodayPlan {
  /** Local calendar date (YYYY-MM-DD) the plan applies to. */
  date: string;
  category: Category;
}

export interface User {
  id: string;
  name: string;
  settings: UserSettings;
  /** Snapshot of streak stats, refreshed whenever workouts change. */
  stats: StreakStats;
  todayPlan: TodayPlan | null;
  createdAt: number;
  updatedAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  muscleGroup: string;
  isCustom: boolean;
  isBodyweight: boolean;
  /** Soft delete so history referencing the exercise stays intact. */
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export type WorkoutStatus = "active" | "completed";

export interface Workout {
  id: string;
  /** Local calendar date (YYYY-MM-DD) the workout started on. */
  date: string;
  category: Category;
  status: WorkoutStatus;
  startedAt: number;
  completedAt: number | null;
  /** Duration in seconds, set on completion. */
  duration: number | null;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  completed: boolean;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  /** Denormalised for fast per-workout queries. */
  workoutId: string;
  /** Denormalised for fast per-exercise history queries. */
  exerciseId: string;
  setNumber: number;
  /** Kilograms. `null` = bodyweight only; for bodyweight exercises a number is added load. */
  weight: number | null;
  reps: number;
  completed: boolean;
  completedAt: number | null;
}

/** Shape of the JSON backup file. */
export interface BackupFile {
  app: "gym-tracker";
  version: 1;
  exportedAt: string;
  data: {
    users: User[];
    exercises: Exercise[];
    workouts: Workout[];
    workoutExercises: WorkoutExercise[];
    workoutSets: WorkoutSet[];
  };
}
