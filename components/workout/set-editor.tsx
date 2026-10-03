"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { WeightUnit, WorkoutSet } from "@/lib/types";
import { updateSet } from "@/lib/storage/repositories/workouts";
import { displayWeight, formatNumber, unitToKg, weightStep } from "@/lib/utils/units";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/workout/stepper";

interface SetEditorProps {
  set: WorkoutSet;
  unit: WeightUnit;
  isBodyweight: boolean;
  /** Called after logging with the weight before/after edits, so later sets can follow. */
  onLogged: (weightBefore: number | null, weightAfter: number | null) => void;
  onDelete: () => void;
}

function weightToText(kg: number | null, unit: WeightUnit) {
  return kg === null || kg === 0 ? "" : formatNumber(displayWeight(kg, unit));
}

/** Focused editor for one set: weight + reps steppers and a big "log" button. */
export function SetEditor({ set, unit, isBodyweight, onLogged, onDelete }: SetEditorProps) {
  const [weight, setWeight] = useState(() => weightToText(set.weight, unit));
  const [reps, setReps] = useState(() => String(set.reps));
  const step = weightStep(unit);
  const [initialWeight] = useState(set.weight);

  const parsedWeight = (): number | null => {
    const n = parseFloat(weight);
    if (!Number.isFinite(n) || n <= 0) return isBodyweight ? null : 0;
    return unitToKg(n, unit);
  };
  const parsedReps = () => {
    const n = parseInt(reps, 10);
    return Number.isFinite(n) && n >= 0 ? n : set.reps;
  };

  const commitWeight = () => updateSet(set.id, { weight: parsedWeight() });
  const commitReps = () => {
    const r = parsedReps();
    setReps(String(r));
    return updateSet(set.id, { reps: r });
  };

  const stepWeight = (dir: 1 | -1) => {
    const current = parseFloat(weight) || 0;
    const next = Math.max(0, Math.round((current + dir * step) * 100) / 100);
    setWeight(next === 0 ? "" : formatNumber(next));
    updateSet(set.id, { weight: next === 0 ? (isBodyweight ? null : 0) : unitToKg(next, unit) });
  };
  const stepReps = (dir: 1 | -1) => {
    const next = Math.max(0, parsedReps() + dir);
    setReps(String(next));
    updateSet(set.id, { reps: next });
  };

  const log = async () => {
    const w = parsedWeight();
    await updateSet(set.id, { weight: w, reps: parsedReps(), completed: !set.completed });
    if (!set.completed) {
      navigator.vibrate?.(12);
      onLogged(initialWeight, w);
    }
  };

  return (
    <div className="animate-rise rounded-2xl border border-primary/25 bg-primary/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-primary uppercase">Set {set.setNumber}</span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete set ${set.setNumber}`}
          className="press -m-1 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stepper
          id={`w-${set.id}`}
          label={isBodyweight ? `Added ${unit}` : `Weight (${unit})`}
          value={weight}
          placeholder={isBodyweight ? "BW" : "0"}
          inputMode="decimal"
          onChange={setWeight}
          onCommit={commitWeight}
          onStep={stepWeight}
        />
        <Stepper
          id={`r-${set.id}`}
          label="Reps"
          value={reps}
          inputMode="numeric"
          onChange={(v) => setReps(v.replace(/\D/g, ""))}
          onCommit={commitReps}
          onStep={stepReps}
        />
      </div>
      <Button
        size="lg"
        variant={set.completed ? "secondary" : "default"}
        className="mt-3 w-full"
        onClick={log}
      >
        <Check className="size-5" strokeWidth={3} aria-hidden />
        {set.completed ? "Mark as not done" : `Log set ${set.setNumber}`}
      </Button>
    </div>
  );
}
