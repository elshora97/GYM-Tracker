"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  placeholder?: string;
  inputMode: "decimal" | "numeric";
  onChange: (raw: string) => void;
  onCommit: () => void;
  onStep: (direction: 1 | -1) => void;
  className?: string;
}

/** Big −/+ stepper around a numeric input. Built for thumbs. */
export function Stepper({
  id,
  label,
  value,
  suffix,
  placeholder,
  inputMode,
  onChange,
  onCommit,
  onStep,
  className,
}: StepperProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </label>
      <div className="flex h-14 items-stretch overflow-hidden rounded-xl border border-input bg-white/[0.03] focus-within:border-primary/60 focus-within:ring-[3px] focus-within:ring-ring/30">
        <button
          type="button"
          onClick={() => onStep(-1)}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="press grid w-11 shrink-0 place-items-center text-muted-foreground hover:bg-white/5 hover:text-foreground active:bg-white/10"
        >
          <Minus className="size-5" />
        </button>
        <div className="relative flex min-w-0 flex-1 items-center justify-center">
          <input
            id={id}
            type="text"
            inputMode={inputMode}
            enterKeyHint="done"
            autoComplete="off"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value.replace(",", "."))}
            onBlur={onCommit}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "ArrowUp") {
                e.preventDefault();
                onStep(1);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                onStep(-1);
              }
            }}
            className="w-full min-w-0 bg-transparent text-center font-display text-[28px] font-bold tabular outline-none placeholder:text-muted-foreground/60"
          />
          {suffix && (
            <span className="pointer-events-none pr-1 text-xs font-medium text-muted-foreground" aria-hidden>
              {suffix}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="press grid w-11 shrink-0 place-items-center text-muted-foreground hover:bg-white/5 hover:text-foreground active:bg-white/10"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  );
}
