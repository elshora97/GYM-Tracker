import type { WeightUnit } from "@/lib/types";

const LB_PER_KG = 2.2046226218;

export function kgToUnit(kg: number, unit: WeightUnit): number {
  return unit === "kg" ? kg : kg * LB_PER_KG;
}

export function unitToKg(value: number, unit: WeightUnit): number {
  return unit === "kg" ? value : value / LB_PER_KG;
}

/** Round to the nearest 0.25 for display so conversions don't produce 61.234. */
export function roundWeight(value: number): number {
  return Math.round(value * 4) / 4;
}

export function displayWeight(kg: number, unit: WeightUnit): number {
  return roundWeight(kgToUnit(kg, unit));
}

export function formatNumber(n: number, maxFractionDigits = 2): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

/** "65 kg", "Bodyweight", "BW +10 kg" */
export function formatWeight(kg: number | null, unit: WeightUnit, isBodyweight = false): string {
  if (kg === null || (isBodyweight && kg === 0)) return "BW";
  const value = formatNumber(displayWeight(kg, unit));
  return isBodyweight ? `BW +${value} ${unit}` : `${value} ${unit}`;
}

/** "65 kg × 8" */
export function formatSet(kg: number | null, reps: number, unit: WeightUnit, isBodyweight = false): string {
  return `${formatWeight(kg, unit, isBodyweight)} × ${reps}`;
}

/** Large volumes read better rounded: "3,240 kg". */
export function formatVolume(kg: number, unit: WeightUnit): string {
  return `${formatNumber(Math.round(kgToUnit(kg, unit)), 0)} ${unit}`;
}

/** Stepper increment in the user's unit. */
export function weightStep(unit: WeightUnit): number {
  return unit === "kg" ? 2.5 : 5;
}
