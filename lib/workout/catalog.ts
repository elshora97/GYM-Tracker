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

export function nextCategory(last: Category | null | undefined): Category {
  if (last === "push") return "pull";
  if (last === "pull") return "legs";
  return "push";
}
