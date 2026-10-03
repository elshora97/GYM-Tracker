import type { Category } from "@/lib/types";

export interface CategoryMeta {
  id: Category;
  label: string;
  dayLabel: string;
  muscles: string[];
  /** Muscle groups offered when creating an exercise in this category. */
  muscleGroups: string[];
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  push: {
    id: "push",
    label: "Push",
    dayLabel: "Push Day",
    muscles: ["Chest", "Shoulders", "Triceps"],
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
  },
  pull: {
    id: "pull",
    label: "Pull",
    dayLabel: "Pull Day",
    muscles: ["Back", "Biceps", "Rear Delts"],
    muscleGroups: ["Back", "Lats", "Traps", "Biceps", "Forearms", "Rear Delts"],
  },
  legs: {
    id: "legs",
    label: "Legs",
    dayLabel: "Leg Day",
    muscles: ["Quads", "Hamstrings", "Glutes", "Calves"],
    muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves", "Adductors", "Core"],
  },
};

export const ALL_MUSCLE_GROUPS = Array.from(
  new Set(Object.values(CATEGORY_META).flatMap((c) => c.muscleGroups)),
).sort();

export interface DefaultExercise {
  name: string;
  category: Category;
  muscleGroup: string;
  isBodyweight?: boolean;
}

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  // PUSH
  { name: "Bench Press", category: "push", muscleGroup: "Chest" },
  { name: "Incline Bench Press", category: "push", muscleGroup: "Chest" },
  { name: "Dumbbell Bench Press", category: "push", muscleGroup: "Chest" },
  { name: "Shoulder Press", category: "push", muscleGroup: "Shoulders" },
  { name: "Dumbbell Shoulder Press", category: "push", muscleGroup: "Shoulders" },
  { name: "Lateral Raise", category: "push", muscleGroup: "Shoulders" },
  { name: "Front Raise", category: "push", muscleGroup: "Shoulders" },
  { name: "Chest Fly", category: "push", muscleGroup: "Chest" },
  { name: "Cable Fly", category: "push", muscleGroup: "Chest" },
  { name: "Triceps Pushdown", category: "push", muscleGroup: "Triceps" },
  { name: "Overhead Triceps Extension", category: "push", muscleGroup: "Triceps" },
  { name: "Dips", category: "push", muscleGroup: "Triceps", isBodyweight: true },
  // PULL
  { name: "Deadlift", category: "pull", muscleGroup: "Back" },
  { name: "Lat Pulldown", category: "pull", muscleGroup: "Lats" },
  { name: "Pull Ups", category: "pull", muscleGroup: "Lats", isBodyweight: true },
  { name: "Barbell Row", category: "pull", muscleGroup: "Back" },
  { name: "Seated Cable Row", category: "pull", muscleGroup: "Back" },
  { name: "Dumbbell Row", category: "pull", muscleGroup: "Back" },
  { name: "Face Pull", category: "pull", muscleGroup: "Rear Delts" },
  { name: "Rear Delt Fly", category: "pull", muscleGroup: "Rear Delts" },
  { name: "Barbell Curl", category: "pull", muscleGroup: "Biceps" },
  { name: "Dumbbell Curl", category: "pull", muscleGroup: "Biceps" },
  { name: "Hammer Curl", category: "pull", muscleGroup: "Biceps" },
  { name: "Preacher Curl", category: "pull", muscleGroup: "Biceps" },
  // LEGS
  { name: "Squat", category: "legs", muscleGroup: "Quads" },
  { name: "Leg Press", category: "legs", muscleGroup: "Quads" },
  { name: "Romanian Deadlift", category: "legs", muscleGroup: "Hamstrings" },
  { name: "Leg Extension", category: "legs", muscleGroup: "Quads" },
  { name: "Leg Curl", category: "legs", muscleGroup: "Hamstrings" },
  { name: "Lunges", category: "legs", muscleGroup: "Quads" },
  { name: "Bulgarian Split Squat", category: "legs", muscleGroup: "Glutes" },
  { name: "Hip Thrust", category: "legs", muscleGroup: "Glutes" },
  { name: "Calf Raise", category: "legs", muscleGroup: "Calves" },
];

/** Stable ids for default exercises so seed data and backups line up. */
export function defaultExerciseId(name: string): string {
  return `ex-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function nextCategory(last: Category | null | undefined): Category {
  if (last === "push") return "pull";
  if (last === "pull") return "legs";
  return "push";
}
