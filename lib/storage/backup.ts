import { getDb } from "@/lib/storage/db";
import { recomputeStats } from "@/lib/storage/repositories/user";
import type { BackupFile } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

export async function exportBackup(): Promise<BackupFile> {
  const db = getDb();
  const [users, exercises, workouts, workoutExercises, workoutSets] = await Promise.all([
    db.users.toArray(),
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.workoutSets.toArray(),
  ]);
  return {
    app: "gym-tracker",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { users, exercises, workouts, workoutExercises, workoutSets },
  };
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Structural validation — rejects anything that isn't a Gym Tracker backup. */
export function parseBackup(raw: unknown): BackupFile {
  if (!isObj(raw) || raw.app !== "gym-tracker" || raw.version !== 1 || !isObj(raw.data)) {
    throw new Error("This file isn't a Gym Tracker backup");
  }
  const d = raw.data;
  for (const key of ["users", "exercises", "workouts", "workoutExercises", "workoutSets"]) {
    if (!Array.isArray(d[key])) throw new Error(`Backup is missing "${key}"`);
  }
  const data = d as BackupFile["data"];
  if (!data.users.every((u) => isObj(u) && isStr(u.id) && isStr(u.name) && isObj(u.settings))) {
    throw new Error("Backup has an invalid profile");
  }
  if (!data.exercises.every((e) => isObj(e) && isStr(e.id) && isStr(e.name) && CATEGORIES.includes(e.category))) {
    throw new Error("Backup has invalid exercises");
  }
  if (
    !data.workouts.every(
      (w) => isObj(w) && isStr(w.id) && isStr(w.date) && CATEGORIES.includes(w.category) && isNum(w.startedAt),
    )
  ) {
    throw new Error("Backup has invalid workouts");
  }
  if (!data.workoutExercises.every((we) => isObj(we) && isStr(we.id) && isStr(we.workoutId) && isStr(we.exerciseId))) {
    throw new Error("Backup has invalid workout exercises");
  }
  if (
    !data.workoutSets.every(
      (s) => isObj(s) && isStr(s.id) && isStr(s.workoutId) && isNum(s.reps) && (s.weight === null || isNum(s.weight)),
    )
  ) {
    throw new Error("Backup has invalid sets");
  }
  return raw as unknown as BackupFile;
}

/** Replaces all local data with the backup contents. */
export async function importBackup(file: BackupFile) {
  const db = getDb();
  const { users, exercises, workouts, workoutExercises, workoutSets } = file.data;
  await db.transaction("rw", [db.users, db.exercises, db.workouts, db.workoutExercises, db.workoutSets], async () => {
    await Promise.all([
      db.users.clear(),
      db.exercises.clear(),
      db.workouts.clear(),
      db.workoutExercises.clear(),
      db.workoutSets.clear(),
    ]);
    await db.users.bulkAdd(users);
    await db.exercises.bulkAdd(exercises);
    await db.workouts.bulkAdd(workouts);
    await db.workoutExercises.bulkAdd(workoutExercises);
    await db.workoutSets.bulkAdd(workoutSets);
    await recomputeStats();
  });
}
