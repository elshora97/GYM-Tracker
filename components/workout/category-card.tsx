import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/workout/catalog";
import { CATEGORY_ICON, catVar } from "@/components/workout/category-style";

interface CategoryCardProps {
  category: Category;
  onSelect: (c: Category) => void;
  suggested?: boolean;
  compact?: boolean;
  className?: string;
}

/** Big tappable PUSH / PULL / LEGS card with a subtle per-category tint. */
export function CategoryCard({ category, onSelect, suggested, compact, className }: CategoryCardProps) {
  const meta = CATEGORY_META[category];
  const Icon = CATEGORY_ICON[category];
  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      style={catVar(category)}
      className={cn(
        "surface press group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl p-4 text-left outline-none hover:border-[color-mix(in_oklch,var(--cat)_40%,transparent)] focus-visible:ring-[3px] focus-visible:ring-ring",
        compact ? "min-h-20" : "min-h-28",
        className,
      )}
    >
      {/* tint wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -bottom-16 size-48 rounded-full bg-(--cat) opacity-[0.13] blur-2xl transition-opacity group-hover:opacity-25"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-display text-[88px] leading-none font-extrabold text-(--cat) opacity-[0.07] uppercase"
      >
        {meta.label[0]}
      </span>
      <span className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklch,var(--cat)_16%,transparent)] text-(--cat)">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-2xl leading-none font-bold tracking-wide uppercase">{meta.label}</span>
          {suggested && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
              Up next
            </span>
          )}
        </span>
        <span className="mt-1.5 block text-sm text-muted-foreground">{meta.muscles.join(" • ")}</span>
      </span>
    </button>
  );
}
