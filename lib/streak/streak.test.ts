import { describe, expect, it } from "vitest";
import { computeStreakStats, streakMessage, weekActivity } from "@/lib/streak";

const TODAY = "2026-10-08"; // Thursday

describe("computeStreakStats (strict)", () => {
  it("is empty with no workouts", () => {
    expect(computeStreakStats([], 0, TODAY)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      lastWorkoutDate: null,
    });
  });

  it("counts consecutive days ending today", () => {
    const s = computeStreakStats(["2026-10-06", "2026-10-07", "2026-10-08"], 0, TODAY);
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it("keeps the streak alive when the last workout was yesterday", () => {
    expect(computeStreakStats(["2026-10-06", "2026-10-07"], 0, TODAY).currentStreak).toBe(2);
  });

  it("resets after a missed day", () => {
    const s = computeStreakStats(["2026-10-04", "2026-10-05", "2026-10-06"], 0, TODAY);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(3);
  });

  it("does not double-count multiple workouts on the same day", () => {
    const s = computeStreakStats(["2026-10-07", "2026-10-07", "2026-10-08", "2026-10-08"], 0, TODAY);
    expect(s.currentStreak).toBe(2);
    expect(s.totalWorkouts).toBe(2);
  });

  it("breaks the chain on a gap (Mon ✓ Tue ✓ Wed – Thu ✓)", () => {
    const s = computeStreakStats(["2026-10-05", "2026-10-06", "2026-10-08"], 0, TODAY);
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(2);
  });

  it("ignores future dates", () => {
    expect(computeStreakStats(["2026-10-08", "2026-10-09"], 0, TODAY).currentStreak).toBe(1);
  });
});

describe("computeStreakStats (rest days allowed)", () => {
  it("bridges a single rest day when restDays = 1", () => {
    const s = computeStreakStats(["2026-10-05", "2026-10-06", "2026-10-08"], 1, TODAY);
    expect(s.currentStreak).toBe(3);
  });

  it("stays alive two days after the last workout with restDays = 1", () => {
    expect(computeStreakStats(["2026-10-06"], 1, TODAY).currentStreak).toBe(1);
    expect(computeStreakStats(["2026-10-05"], 1, TODAY).currentStreak).toBe(0);
  });
});

describe("streakMessage", () => {
  it("tells the user how many workouts until a new record", () => {
    const msg = streakMessage({ currentStreak: 7, longestStreak: 9, totalWorkouts: 20, lastWorkoutDate: "2026-10-07" }, TODAY);
    expect(msg).toBe("3 more workouts to beat your record");
  });
});

describe("weekActivity", () => {
  it("marks completed, today and upcoming days Monday-first", () => {
    const week = weekActivity(["2026-10-05", "2026-10-07"], TODAY);
    expect(week.map((d) => d.state)).toEqual([
      "completed",
      "missed",
      "completed",
      "today",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });
});
