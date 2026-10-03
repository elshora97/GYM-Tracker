"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Flame, House } from "lucide-react";
import { useUser, useWorkoutDetail } from "@/lib/hooks/use-data";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { totalVolume } from "@/lib/workout/metrics";
import { formatDuration } from "@/lib/utils/date";
import { formatVolume } from "@/lib/utils/units";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompletePage() {
  return (
    <Suspense fallback={<Skeleton className="mt-10 h-96" />}>
      <Complete />
    </Suspense>
  );
}

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  left: 8 + ((i * 53) % 84),
  delay: (i * 0.37) % 2.2,
  dx: ((i * 29) % 60) - 30,
  size: 3 + (i % 3) * 2,
}));

function Complete() {
  const id = useSearchParams().get("id");
  const detail = useWorkoutDetail(id);
  const user = useUser();

  const stats = useMemo(() => {
    if (!detail) return null;
    const sets = detail.exercises.flatMap((e) => e.sets).filter((s) => s.completed);
    return { exercises: detail.exercises.length, sets: sets.length, volume: totalVolume(sets) };
  }, [detail]);

  const streak = useCountUp(user?.stats.currentStreak ?? 0, 1100);

  if (detail === undefined || !user) return <Skeleton className="mt-10 h-96" />;
  if (!detail || !stats) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted-foreground">Workout not found.</p>
        <Button asChild className="mt-4">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    );
  }

  const { workout } = detail;
  const unit = user.settings.unit;

  return (
    <div className="relative flex min-h-[calc(100dvh-var(--nav-height)-3rem)] flex-col items-center justify-center py-10 text-center">
      {/* rising embers */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/4 h-40 overflow-visible">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="absolute bottom-0 animate-ember rounded-full bg-primary"
            style={{
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              animationDelay: `${e.delay}s`,
              ["--dx" as string]: `${e.dx}px`,
            }}
          />
        ))}
      </div>

      <div className="relative animate-pop">
        <div aria-hidden className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/30 blur-3xl" />
        <Flame className="size-24 animate-flicker fill-primary/30 text-primary" strokeWidth={1.4} aria-hidden />
      </div>

      <h1 className="mt-6 font-display text-4xl font-extrabold tracking-[0.12em] uppercase animate-rise [animation-delay:150ms]">
        Workout complete
      </h1>
      <p className="mt-1 text-muted-foreground animate-rise [animation-delay:220ms]">
        Great job! {CATEGORY_META[workout.category].dayLabel} is in the books.
      </p>

      <dl className="mt-8 grid w-full max-w-sm grid-cols-2 gap-2 animate-rise [animation-delay:300ms]">
        {[
          ["Duration", formatDuration(workout.duration)],
          ["Exercises", stats.exercises],
          ["Sets", stats.sets],
          ["Volume", formatVolume(stats.volume, unit)],
        ].map(([label, value]) => (
          <div key={label} className="surface rounded-2xl p-4">
            <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</dt>
            <dd className="mt-1 font-display text-3xl leading-none font-bold tabular">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 w-full max-w-sm animate-rise rounded-2xl border border-primary/30 bg-primary/10 p-4 [animation-delay:420ms]">
        <p className="flex items-center justify-center gap-2 font-display text-3xl font-extrabold tracking-wider text-primary uppercase">
          <Flame className="size-7 fill-primary/40" aria-hidden />
          <span aria-hidden className="tabular">{streak}</span>
          <span aria-hidden>day streak</span>
          <span className="sr-only">{user.stats.currentStreak} day streak</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Keep showing up.</p>
      </div>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-2 animate-rise [animation-delay:500ms]">
        <Button asChild size="lg">
          <Link href="/">
            <House className="size-5" aria-hidden /> Back to Home
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/history/detail?id=${workout.id}`}>View workout details</Link>
        </Button>
      </div>
    </div>
  );
}
