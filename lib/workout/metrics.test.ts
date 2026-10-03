import { describe, expect, it } from "vitest";
import { bestSet, summarizeSets, totalVolume } from "@/lib/workout/metrics";
import { nextCategory, suggestNextCategory } from "@/lib/workout/catalog";

describe("volume", () => {
  it("is weight × reps summed over sets (65 × 8 × 3 = 1560)", () => {
    const sets = Array.from({ length: 3 }, () => ({ weight: 65, reps: 8 }));
    expect(totalVolume(sets)).toBe(1560);
  });

  it("treats bodyweight-only sets as zero load", () => {
    expect(totalVolume([{ weight: null, reps: 12 }])).toBe(0);
  });
});

describe("bestSet / summarizeSets", () => {
  it("picks the heaviest set, breaking ties by reps", () => {
    const sets = [
      { weight: 60, reps: 10 },
      { weight: 65, reps: 6 },
      { weight: 65, reps: 8 },
    ];
    expect(bestSet(sets)).toEqual({ weight: 65, reps: 8 });
    expect(summarizeSets(sets)).toEqual({ weight: 65, reps: 8, sets: 3 });
  });
});

describe("rotation", () => {
  it("cycles push → pull → legs", () => {
    expect(nextCategory("push")).toBe("pull");
    expect(nextCategory("pull")).toBe("legs");
    expect(nextCategory("legs")).toBe("push");
    expect(nextCategory(null)).toBe("push");
  });

  it("continues from a skip that happened after the last workout", () => {
    const last = { category: "pull" as const, completedAt: 1000 };
    expect(suggestNextCategory(last, null)).toBe("legs");
    expect(suggestNextCategory(last, { category: "legs", at: 2000 })).toBe("push");
    expect(suggestNextCategory(last, { category: "legs", at: 500 })).toBe("legs");
  });
});
