import { getDb, USER_ID } from "@/lib/storage/db";
import { createUser, recomputeStats } from "@/lib/storage/repositories/user";

/**
 * First launch: create an empty profile. The app ships with no exercises and no
 * sample data — users build their own library.
 */
export async function seedIfEmpty(): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.users, async () => {
    if (await db.users.get(USER_ID)) return;
    await db.users.add(createUser());
  });
}

/** Deletes all workouts and exercises. Keeps the user's name and settings. */
export async function resetDatabase() {
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
    if (previous) {
      user.settings = previous.settings;
      user.tourCompletedAt = previous.tourCompletedAt ?? null;
    }
    await db.users.add(user);
    await recomputeStats();
  });
}
