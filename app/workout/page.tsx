"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { useActiveWorkout, useCompletedWorkouts, useUser } from "@/lib/hooks/use-data";
import { suggestNextCategory } from "@/lib/workout/catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { CategoryCard } from "@/components/workout/category-card";
import { ExerciseSelect } from "@/components/workout/exercise-select";

export default function WorkoutPage() {
  return (
    <Suspense fallback={<WorkoutSkeleton />}>
      <WorkoutRouter />
    </Suspense>
  );
}

function WorkoutRouter() {
  const params = useSearchParams();
  const active = useActiveWorkout();
  const raw = params.get("category");
  const category = CATEGORIES.includes(raw as Category) ? (raw as Category) : null;

  if (active === undefined) return <WorkoutSkeleton />;
  if (active) return <ActiveWorkout key={active.id} workout={active} />;
  if (category) return <ExerciseSelect key={category} category={category} />;
  return <ChooseCategory />;
}

function ChooseCategory() {
  const router = useRouter();
  const completed = useCompletedWorkouts();
  const user = useUser();
  const suggested = suggestNextCategory(completed?.[0], user?.lastSkip);
  return (
    <div>
      <PageHeader eyebrow="Start workout" title="What are you training?" />
      <div className="flex flex-col gap-3">
        {CATEGORIES.map((c) => (
          <CategoryCard
            key={c}
            category={c}
            suggested={!!completed && c === suggested}
            onSelect={(cat) => router.push(`/workout?category=${cat}`)}
          />
        ))}
      </div>
    </div>
  );
}

function WorkoutSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-6" aria-busy="true">
      <Skeleton className="mb-3 h-10 w-56" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
  );
}
