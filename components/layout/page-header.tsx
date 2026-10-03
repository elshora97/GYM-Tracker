"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Show a back button; falls back to `backHref` when there's no history. */
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, eyebrow, backHref, actions, className }: PageHeaderProps) {
  const router = useRouter();
  return (
    <header className={cn("flex items-center gap-2 pt-4 pb-5 lg:pt-8", className)}>
      {backHref && (
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push(backHref))}
          className="press -ml-2 grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Go back"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{eyebrow}</p>}
        <h1 className="truncate font-display text-[28px] leading-tight font-bold tracking-wide uppercase">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
