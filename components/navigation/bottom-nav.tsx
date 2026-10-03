"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveWorkout } from "@/lib/hooks/use-data";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS } from "@/components/navigation/nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const active = useActiveWorkout();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl pb-safe lg:hidden"
    >
      <ul className="mx-auto grid h-(--nav-height) max-w-lg grid-cols-5 px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const on = isActive(pathname, href);
          const live = href === "/workout" && !!active;
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "press group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative grid h-8 w-14 place-items-center rounded-full transition-colors duration-200",
                    on && "bg-primary/15",
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={on ? 2.4 : 2} aria-hidden />
                  {live && (
                    <span className="absolute top-0.5 right-3 size-2 rounded-full bg-primary ring-2 ring-background">
                      <span className="absolute inset-0 animate-ping rounded-full bg-primary/70" />
                    </span>
                  )}
                </span>
                <span>{label}</span>
                {live && <span className="sr-only">(workout in progress)</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
