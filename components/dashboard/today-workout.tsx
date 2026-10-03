"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Play, RotateCcw, Timer } from "lucide-react";
import type { Category, User, Workout } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_META, nextCategory } from "@/lib/workout/catalog";
import { useLastRoutine, useWorkoutDetail } from "@/lib/hooks/use-data";
import { useNow } from "@/lib/hooks/use-count-up";
import { setTodayPlan } from "@/lib/storage/repositories/user";
import { formatClock, todayKey } from "@/lib/utils/date";
import { pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/workout/category-card";
import { CATEGORY_ICON, catVar } from "@/components/workout/category-style";

const DEFAULT_ROUTINE_SIZE = 5;

interface TodayWorkoutProps {
  user: User;
  active: Workout | null;
  lastCategory: Category | null;
  trainedToday: Workout | null;
}

export function TodayWorkout({ user, active, lastCategory, trainedToday }: TodayWorkoutProps) {
  if (active) return <ActiveWorkoutCard workout={active} />;
  if (trainedToday) return <DoneTodayCard workout={trainedToday} />;
  const plan = user.todayPlan?.date === todayKey() ? user.todayPlan.category : null;
  if (plan) return <PlannedCard category={plan} />;
  return <CategoryPicker suggested={nextCategory(lastCategory)} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 id="today-heading" className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

function PlannedCard({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  const Icon = CATEGORY_ICON[category];
  const routine = useLastRoutine(category);
  const count = routine?.length || DEFAULT_ROUTINE_SIZE;

  return (
    <section aria-labelledby="today-heading">
      <SectionTitle>Today&apos;s workout</SectionTitle>
      <div style={catVar(category)} className="surface relative overflow-hidden rounded-3xl p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-(--cat) opacity-15 blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-4xl leading-none font-extrabold tracking-wide uppercase">{meta.dayLabel}</p>
            <p className="mt-2 text-sm text-muted-foreground">{meta.muscles.join(" • ")}</p>
            <p className="mt-1 text-sm font-medium">{pluralize(count, "exercise")}</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklch,var(--cat)_16%,transparent)] text-(--cat)">
            <Icon className="size-6" aria-hidden />
          </span>
        </div>
        <div className="relative mt-5 flex gap-2">
          <Button asChild size="lg" className="flex-1">
            <Link href={`/workout?category=${category}`}>
              <Play className="size-5 fill-current" aria-hidden />
              Start Workout
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="px-4"
            onClick={() => setTodayPlan(null)}
            aria-label="Choose a different workout"
          >
            Change
          </Button>
        </div>
      </div>
    </section>
  );
}

function CategoryPicker({ suggested }: { suggested: Category }) {
  return (
    <section aria-labelledby="today-heading">
      <SectionTitle>What are you training today?</SectionTitle>
      <div className="flex flex-col gap-3">
        {CATEGORIES.map((c) => (
          <CategoryCard key={c} category={c} suggested={c === suggested} onSelect={(cat) => setTodayPlan(cat)} />
        ))}
      </div>
    </section>
  );
}

function ActiveWorkoutCard({ workout }: { workout: Workout }) {
  const now = useNow();
  const detail = useWorkoutDetail(workout.id);
  const done = detail?.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0) ?? 0;
  return (
    <section aria-labelledby="today-heading">
      <SectionTitle>In progress</SectionTitle>
      <div style={catVar(workout.category)} className="surface relative overflow-hidden rounded-3xl p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-(--cat) opacity-15 blur-3xl"
        />
        <p className="relative font-display text-4xl leading-none font-extrabold tracking-wide uppercase">
          {CATEGORY_META[workout.category].dayLabel}
        </p>
        <p className="relative mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="size-4 text-primary" aria-hidden />
          <span className="font-display text-xl font-bold text-foreground tabular">
            {formatClock((now - workout.startedAt) / 1000)}
          </span>
          <span>· {pluralize(done, "set")} logged</span>
        </p>
        <Button asChild size="lg" className="relative mt-5 w-full">
          <Link href="/workout">
            <Play className="size-5 fill-current" aria-hidden />
            Resume Workout
          </Link>
        </Button>
      </div>
    </section>
  );
}

function DoneTodayCard({ workout }: { workout: Workout }) {
  const router = useRouter();
  return (
    <section aria-labelledby="today-heading">
      <SectionTitle>Today</SectionTitle>
      <div className="surface flex items-center gap-4 rounded-3xl p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{CATEGORY_META[workout.category].dayLabel} done</p>
          <p className="text-sm text-muted-foreground">Recover well. See you next session.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Start another workout"
          onClick={() => router.push("/workout")}
        >
          <RotateCcw className="size-5" />
        </Button>
      </div>
    </section>
  );
}
