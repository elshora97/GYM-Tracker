import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("surface flex flex-col items-center rounded-2xl px-6 py-10 text-center", className)}>
      <div className="relative mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" aria-hidden />
        <Icon className="relative size-8" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
