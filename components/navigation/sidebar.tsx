"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { useActiveWorkout, useUser } from "@/lib/hooks/use-data";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { InstallButton } from "@/components/layout/install-button";
import { isActive, NAV_ITEMS } from "@/components/navigation/nav-items";
import { CATEGORY_META } from "@/lib/workout/catalog";

export function Sidebar() {
  const pathname = usePathname();
  const active = useActiveWorkout();
  const user = useUser();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background/60 px-4 py-6 backdrop-blur-xl lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2" aria-label="Gym Tracker home">
        <Logo />
        <span className="font-display text-xl font-bold tracking-wide uppercase">Gym Tracker</span>
      </Link>

      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const on = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  data-tour={`nav-${label.toLowerCase()}`}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "press flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                    on ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={on ? 2.4 : 2} aria-hidden />
                  {label}
                  {href === "/workout" && active && (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                      Live
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <InstallButton variant="secondary" className="w-full" />
        {active && (
          <Link
            href="/workout"
            className="surface press rounded-xl p-3 text-sm"
          >
            <p className="text-xs text-muted-foreground">In progress</p>
            <p className="font-semibold">{CATEGORY_META[active.category].dayLabel}</p>
          </Link>
        )}
        {user && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground">
            <Flame className="size-4 text-primary" aria-hidden />
            <span>
              <span className="font-semibold text-foreground tabular">{user.stats.currentStreak}</span> day streak
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
