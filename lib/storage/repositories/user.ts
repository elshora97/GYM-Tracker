import { getDb, USER_ID } from "@/lib/storage/db";
import { computeStreakStats, withSessionCount } from "@/lib/streak";
import type { Category, StreakStats, User, UserSettings } from "@/lib/types";
import { todayKey } from "@/lib/utils/date";

export const DEFAULT_SETTINGS: UserSettings = { unit: "kg", streakRestDays: 0 };

export const EMPTY_STATS: StreakStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalWorkouts: 0,
  lastWorkoutDate: null,
};

export function createUser(name = "Athlete"): User {
  const now = Date.now();
  return {
    id: USER_ID,
    name,
    settings: { ...DEFAULT_SETTINGS },
    stats: { ...EMPTY_STATS },
    todayPlan: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getUser(): Promise<User | undefined> {
  return getDb().users.get(USER_ID);
}

export async function updateUserName(name: string) {
  await getDb().users.update(USER_ID, { name: name.trim(), updatedAt: Date.now() });
}

export async function updateSettings(patch: Partial<UserSettings>) {
  const db = getDb();
  await db.transaction("rw", db.users, db.workouts, async () => {
    const user = await db.users.get(USER_ID);
    if (!user) return;
    await db.users.update(USER_ID, { settings: { ...user.settings, ...patch }, updatedAt: Date.now() });
    if (patch.streakRestDays !== undefined) await recomputeStats();
  });
}

export async function setTodayPlan(category: Category | null) {
  await getDb().users.update(USER_ID, {
    todayPlan: category ? { date: todayKey(), category } : null,
    updatedAt: Date.now(),
  });
}

/**
 * Recomputes the streak snapshot from completed workouts and stores it on the user.
 * Must be called whenever completed workouts change.
 */
export async function recomputeStats(): Promise<StreakStats> {
  const db = getDb();
  return db.transaction("rw", db.users, db.workouts, async () => {
    const user = await db.users.get(USER_ID);
    const completed = await db.workouts.where("status").equals("completed").toArray();
    const restDays = user?.settings.streakRestDays ?? 0;
    const stats = withSessionCount(
      computeStreakStats(
        completed.map((w) => w.date),
        restDays,
      ),
      completed.length,
    );
    if (user) await db.users.update(USER_ID, { stats, updatedAt: Date.now() });
    return stats;
  });
}
