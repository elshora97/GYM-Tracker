"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { useExercises } from "@/lib/hooks/use-data";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory: Category;
  exclude: string[];
  onConfirm: (ids: string[]) => void;
  onCreateNew: () => void;
}

/** Bottom sheet for adding exercises to a running workout. */
export function ExercisePicker({
  open,
  onOpenChange,
  initialCategory,
  exclude,
  onConfirm,
  onCreateNew,
}: ExercisePickerProps) {
  const exercises = useExercises();
  const [category, setCategory] = useState<Category>(initialCategory);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (exercises ?? []).filter(
      (e) =>
        !exclude.includes(e.id) &&
        (q ? e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q) : e.category === category),
    );
  }, [exercises, exclude, query, category]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setPicked([]);
      setQuery("");
    }
  };

  return (
    <Drawer open={open} onOpenChange={close}>
      <DrawerContent className="h-[85dvh]">
        <DrawerHeader>
          <DrawerTitle>Add exercises</DrawerTitle>
          <DrawerDescription>Tap to select, then add them to your workout.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-5 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises"
              aria-label="Search exercises"
              className="pl-10"
            />
          </div>
          {!query && (
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-white/[0.03] p-1" role="tablist">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={category === c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "press h-9 rounded-lg text-sm font-semibold",
                    category === c ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
          )}
        </div>
        <ul className="flex-1 overflow-y-auto px-5 py-1" aria-label="Exercises">
          {list.map((e) => {
            const on = picked.includes(e.id);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => toggle(e.id)}
                  aria-pressed={on}
                  className="press flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-white/[0.03]"
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-white/20",
                    )}
                  >
                    {on && <Check className="size-4" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{e.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {e.muscleGroup}
                      {query && ` · ${CATEGORY_META[e.category].label}`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {list.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">{query ? "No exercises found." : "No exercises here yet — create one below."}</li>}
        </ul>
        <DrawerFooter className="border-t border-border pt-3">
          <Button
            variant="secondary"
            onClick={() => {
              close(false);
              onCreateNew();
            }}
          >
            <Plus className="size-4" aria-hidden /> Create new exercise
          </Button>
          <Button
            size="lg"
            disabled={picked.length === 0}
            onClick={() => {
              onConfirm(picked);
              close(false);
            }}
          >
            {picked.length ? `Add ${picked.length} ${picked.length === 1 ? "exercise" : "exercises"}` : "Select exercises"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
