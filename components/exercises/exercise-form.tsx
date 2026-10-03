"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category, Exercise } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { createExercise, updateExercise, ValidationError, type ExerciseInput } from "@/lib/storage/repositories/exercises";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

interface ExerciseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit mode when provided. */
  exercise?: Exercise;
  defaultCategory?: Category;
  onSaved?: (exercise: Exercise | undefined) => void;
}

export function ExerciseFormSheet({ open, onOpenChange, exercise, defaultCategory = "push", onSaved }: ExerciseFormSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{exercise ? "Edit exercise" : "Add exercise"}</DrawerTitle>
          <DrawerDescription>
            {exercise ? "Rename it, change the muscle, or move it to another day." : "Add it to your Push, Pull or Legs library."}
          </DrawerDescription>
        </DrawerHeader>
        {/* Remount per open so the form resets */}
        {open && (
          <ExerciseForm
            exercise={exercise}
            defaultCategory={defaultCategory}
            onDone={(saved) => {
              onOpenChange(false);
              onSaved?.(saved);
            }}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function ExerciseForm({
  exercise,
  defaultCategory,
  onDone,
}: {
  exercise?: Exercise;
  defaultCategory: Category;
  onDone: (saved: Exercise | undefined) => void;
}) {
  const [values, setValues] = useState<ExerciseInput>(() => ({
    name: exercise?.name ?? "",
    category: exercise?.category ?? defaultCategory,
    muscleGroup: exercise?.muscleGroup ?? CATEGORY_META[exercise?.category ?? defaultCategory].muscleGroups[0],
    isBodyweight: exercise?.isBodyweight ?? false,
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof ExerciseInput, string>>>({});
  const [saving, setSaving] = useState(false);

  const muscles = CATEGORY_META[values.category].muscleGroups;
  const muscleOptions = muscles.includes(values.muscleGroup) ? muscles : [values.muscleGroup, ...muscles];

  const set = <K extends keyof ExerciseInput>(key: K, value: ExerciseInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.name.trim().length < 2) {
      setErrors({ name: "Name must be at least 2 characters" });
      return;
    }
    setSaving(true);
    try {
      if (exercise) {
        await updateExercise(exercise.id, values);
        toast.success("Exercise updated");
        onDone(undefined);
      } else {
        const created = await createExercise(values);
        toast.success(`${created.name} added to ${CATEGORY_META[created.category].label}`);
        onDone(created);
      }
    } catch (err) {
      if (err instanceof ValidationError && err.field) setErrors({ [err.field]: err.message });
      else toast.error(err instanceof Error ? err.message : "Couldn't save exercise");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 overflow-y-auto px-5 pt-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ex-name">Exercise name</Label>
        <Input
          id="ex-name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Machine Chest Press"
          autoComplete="off"
          autoCapitalize="words"
          maxLength={60}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "ex-name-err" : undefined}
          required
        />
        {errors.name && (
          <p id="ex-name-err" className="text-sm text-destructive" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-muted-foreground">Category</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={values.category === c}
              onClick={() => {
                set("category", c);
                if (!CATEGORY_META[c].muscleGroups.includes(values.muscleGroup)) {
                  set("muscleGroup", CATEGORY_META[c].muscleGroups[0]);
                }
              }}
              className={cn(
                "press h-12 rounded-xl border text-sm font-bold tracking-wider uppercase",
                values.category === c
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-input bg-white/[0.03] text-muted-foreground",
              )}
            >
              {CATEGORY_META[c].label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ex-muscle">Target muscle</Label>
        <Select value={values.muscleGroup} onValueChange={(v) => set("muscleGroup", v)}>
          <SelectTrigger id="ex-muscle" aria-invalid={!!errors.muscleGroup}>
            <SelectValue placeholder="Choose a muscle" />
          </SelectTrigger>
          <SelectContent>
            {muscleOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.muscleGroup && <p className="text-sm text-destructive">{errors.muscleGroup}</p>}
      </div>

      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-input bg-white/[0.03] px-4 py-3">
        <span>
          <span className="block text-sm font-medium">Bodyweight exercise</span>
          <span className="block text-xs text-muted-foreground">Weight is optional (e.g. pull ups, dips)</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={values.isBodyweight}
          onChange={(e) => set("isBodyweight", e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative h-7 w-12 shrink-0 rounded-full bg-white/10 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
        />
      </label>

      <DrawerFooter className="px-0">
        <Button type="submit" size="lg" disabled={saving}>
          {exercise ? "Save changes" : "Add Exercise"}
        </Button>
      </DrawerFooter>
    </form>
  );
}
