"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Dumbbell, Plus, Search, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { useExercises, useLastPerformanceMap, useSettings } from "@/lib/hooks/use-data";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { formatSet } from "@/lib/utils/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { ExerciseFormSheet } from "@/components/exercises/exercise-form";
import { CategoryBadge } from "@/components/workout/category-style";

export default function ExercisesPage() {
  const exercises = useExercises();
  const last = useLastPerformanceMap();
  const { unit } = useSettings();
  const [tab, setTab] = useState<Category>("push");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      (exercises ?? []).filter((e) =>
        q ? e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q) : e.category === tab,
      ),
    [exercises, q, tab],
  );

  return (
    <div>
      <PageHeader
        title="Exercises"
        actions={
          <Button size="sm" onClick={() => setAdding(true)} className="h-10">
            <Plus className="size-4" aria-hidden /> Add
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          aria-label="Search exercises"
          className="pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {!q && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as Category)} className="mb-4">
          <TabsList>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="tracking-wider uppercase">
                {CATEGORY_META[c].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {!exercises || !last ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[68px]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={q ? "No matches" : "Build your workout routine."}
          description={q ? `Nothing matches “${query}”.` : `No ${CATEGORY_META[tab].label} exercises yet.`}
          action={
            <Button size="lg" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="size-5" aria-hidden /> Add Exercise
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Exercise library">
          {list.map((e) => {
            const lp = last.get(e.id);
            return (
              <li key={e.id}>
                <Link
                  href={`/exercises/detail?id=${e.id}`}
                  className="surface press flex min-h-[68px] items-center gap-3 rounded-2xl px-4 py-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">{e.name}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {q && <CategoryBadge category={e.category} className="px-1.5 text-[9px]" />}
                      {e.muscleGroup}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {lp ? (
                      <>
                        <span className="block text-[11px] text-muted-foreground">Last</span>
                        <span className="block font-display text-lg leading-tight font-bold tabular">
                          {formatSet(lp.weight, lp.reps, unit, e.isBodyweight)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">No sets yet</span>
                    )}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ExerciseFormSheet
        open={adding}
        onOpenChange={setAdding}
        defaultCategory={tab}
        onSaved={(ex) => {
          if (ex) {
            setQuery("");
            setTab(ex.category);
          }
        }}
      />
    </div>
  );
}
