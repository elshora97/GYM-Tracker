import { ChevronsDown, ChevronsUp, Footprints, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/workout/catalog";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  push: ChevronsUp,
  pull: ChevronsDown,
  legs: Footprints,
};

/** Inline style that exposes the category tint as `--cat`. */
export function catVar(category: Category): React.CSSProperties {
  return { ["--cat" as string]: `var(--${category})` };
}

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      style={catVar(category)}
      className={cn(
        "inline-flex items-center rounded-full bg-[color-mix(in_oklch,var(--cat)_16%,transparent)] px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-(--cat) uppercase",
        className,
      )}
    >
      {CATEGORY_META[category].label}
    </span>
  );
}
