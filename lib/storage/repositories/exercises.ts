import { getDb } from "@/lib/storage/db";
import type { Category, Exercise } from "@/lib/types";
import { uid } from "@/lib/utils";

export interface ExerciseInput {
  name: string;
  category: Category;
  muscleGroup: string;
  isBodyweight: boolean;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: keyof ExerciseInput,
  ) {
    super(message);
  }
}

async function assertValid(input: ExerciseInput, ignoreId?: string) {
  const name = input.name.trim();
  if (name.length < 2) throw new ValidationError("Name must be at least 2 characters", "name");
  if (name.length > 60) throw new ValidationError("Name must be 60 characters or fewer", "name");
  if (!input.muscleGroup) throw new ValidationError("Choose a target muscle", "muscleGroup");
  const clash = await getDb()
    .exercises.filter((e) => !e.archived && e.id !== ignoreId && e.name.toLowerCase() === name.toLowerCase())
    .first();
  if (clash) throw new ValidationError(`"${clash.name}" already exists`, "name");
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  await assertValid(input);
  const now = Date.now();
  const exercise: Exercise = {
    id: uid(),
    name: input.name.trim(),
    category: input.category,
    muscleGroup: input.muscleGroup,
    isBodyweight: input.isBodyweight,
    isCustom: true,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().exercises.add(exercise);
  return exercise;
}

/** Edit name / muscle, or move between categories. Works for default exercises too. */
export async function updateExercise(id: string, input: ExerciseInput) {
  await assertValid(input, id);
  await getDb().exercises.update(id, {
    name: input.name.trim(),
    category: input.category,
    muscleGroup: input.muscleGroup,
    isBodyweight: input.isBodyweight,
    updatedAt: Date.now(),
  });
}

/**
 * Custom exercises are soft-deleted (archived) so past workouts keep their names.
 * Default exercises cannot be deleted.
 */
export async function deleteExercise(id: string) {
  const db = getDb();
  const ex = await db.exercises.get(id);
  if (!ex) return;
  if (!ex.isCustom) throw new Error("Default exercises can't be deleted");
  await db.exercises.update(id, { archived: true, updatedAt: Date.now() });
}
