"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { setTourCompleted } from "@/lib/storage/repositories/user";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

interface TourStep {
  /** `data-tour` value of the element to spotlight; `null` = centered card. */
  target: string | null;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: null,
    title: "Welcome to Gym Tracker",
    body: "Track your Push, Pull and Legs workouts, every set, and your gym streak. Take a 30-second tour?",
  },
  {
    target: "streak",
    title: "Your gym streak",
    body: "Every day you finish a workout adds a day to your streak. Miss a day and it starts over, so keep showing up.",
  },
  {
    target: "today",
    title: "Today's workout",
    body: "Pick Push, Pull or Legs. The app suggests what's up next, and you can skip a day when you need to.",
  },
  {
    target: "nav-exercises",
    title: "Build your exercise library",
    body: "Your library starts empty. Add the exercises you train on each day here, or while setting up a workout.",
  },
  {
    target: "nav-workout",
    title: "Log sets in seconds",
    body: "Start a workout and tap ✓ to log each set. Weight and reps fill in from last time, so most sets are one tap.",
  },
  {
    target: "nav-history",
    title: "See your progress",
    body: "Every workout is saved here, with charts for each exercise. Your data stays on this device and works offline.",
  },
];

const PAD = 8;
const GUTTER = 16;
const CARD_MAX_W = 340;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** First visible element with the given data-tour id (mobile nav and sidebar share ids). */
function findTarget(id: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function sameRect(a: Rect | null, b: Rect | null) {
  return !!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

export function AppTour({ hasExercises }: { hasExercises: boolean }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const finish = useCallback(
    async (goToExercises = false) => {
      await setTourCompleted(true);
      if (goToExercises) router.push("/exercises");
    },
    [router],
  );

  // Scroll the target near the top of the screen so the card fits underneath it.
  // Fixed elements (bottom nav, sidebar) don't move with scrolling, so skip them.
  useEffect(() => {
    if (!step.target) return;
    const el = findTarget(step.target);
    if (!el || el.closest("nav")) return;
    // Instant jump: the spotlight's own transition provides the motion.
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - GUTTER - PAD, behavior: "instant" });
  }, [step.target]);

  // Keep the spotlight on the target through scrolling, resizing and layout shifts.
  useEffect(() => {
    let last: Rect | null = null;
    const measure = () => {
      setViewport((v) =>
        v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight },
      );
      const el = step.target ? findTarget(step.target) : null;
      const r = el?.getBoundingClientRect();
      const next = r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      if (!sameRect(last, next)) {
        last = next;
        setRect(next);
      }
    };
    measure();
    // Re-measure while the smooth scroll to the target settles.
    const timers = [100, 250, 450, 700, 1000].map((ms) => setTimeout(measure, ms));
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [step.target]);

  // Move focus into the card on every step; Escape skips the tour.
  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void finish();
      if (e.key === "ArrowRight" && !isLast) setIndex((i) => i + 1);
      if (e.key === "ArrowLeft" && index > 0) setIndex((i) => i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, index, isLast]);

  if (viewport.w === 0) return null;

  const cardW = Math.min(CARD_MAX_W, viewport.w - GUTTER * 2);
  // Padded spotlight, clamped so it never spills off-screen (e.g. bottom-nav items).
  const spot =
    rect &&
    (() => {
      const top = Math.max(2, rect.top - PAD);
      const left = Math.max(2, rect.left - PAD);
      const bottom = Math.min(viewport.h - 2, rect.top + rect.height + PAD);
      const right = Math.min(viewport.w - 2, rect.left + rect.width + PAD);
      return { top, left, width: right - left, height: bottom - top };
    })();

  // Place the card below the target if there's room, otherwise above it.
  let cardStyle: React.CSSProperties;
  if (spot) {
    const NEEDED = 230;
    const left = Math.min(
      Math.max(spot.left + spot.width / 2 - cardW / 2, GUTTER),
      viewport.w - cardW - GUTTER,
    );
    if (viewport.h - (spot.top + spot.height) >= NEEDED) {
      cardStyle = { top: spot.top + spot.height + 12, left, width: cardW };
    } else if (spot.top >= NEEDED) {
      cardStyle = { bottom: viewport.h - spot.top + 12, left, width: cardW };
    } else {
      // Tall target: float the card at the bottom of the screen, over the dimmed area.
      cardStyle = { bottom: GUTTER, left, width: cardW };
    }
  } else {
    cardStyle = { top: Math.max(GUTTER, viewport.h / 2 - 170), left: (viewport.w - cardW) / 2, width: cardW };
  }

  const numbered = STEPS.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[90]" aria-live="polite">
      {/* Click shield + dimmer. With a target, the spotlight's shadow does the dimming. */}
      <div className={spot ? "absolute inset-0" : "absolute inset-0 bg-black/70 backdrop-blur-[2px]"} aria-hidden />
      {spot && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl ring-2 ring-primary/80 transition-all duration-300 ease-out"
          style={{ ...spot, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.72)" }}
        />
      )}

      <div
        ref={cardRef}
        key={index}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className="absolute animate-rise rounded-2xl border border-border bg-popover p-5 shadow-2xl outline-none"
        style={cardStyle}
      >
        {step.target === null ? (
          <div className="mb-4 flex items-center gap-3">
            <Logo className="size-11" />
            <Sparkles className="size-5 text-primary" aria-hidden />
          </div>
        ) : (
          <p className="mb-1 text-xs font-semibold tracking-wider text-primary uppercase">
            Step {index} of {numbered}
          </p>
        )}
        <h2 id={titleId} className="text-lg font-semibold">
          {step.title}
        </h2>
        <p id={bodyId} className="mt-1.5 text-sm text-muted-foreground">
          {step.body}
        </p>

        {step.target !== null && (
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {STEPS.slice(1).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i + 1 === index ? "w-5 bg-primary" : "w-1.5 bg-white/20"}`}
              />
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          {index === 0 ? (
            <>
              <Button variant="ghost" onClick={() => finish()} className="text-muted-foreground">
                Skip
              </Button>
              <Button className="flex-1" onClick={() => setIndex(1)}>
                Take the tour <ArrowRight className="size-4" aria-hidden />
              </Button>
            </>
          ) : isLast ? (
            <>
              <Button variant="secondary" size="icon" onClick={() => setIndex(index - 1)} aria-label="Previous step">
                <ArrowLeft className="size-4" />
              </Button>
              {hasExercises ? (
                <Button className="flex-1" onClick={() => finish()}>
                  Let&apos;s go
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => finish()}>
                    Done
                  </Button>
                  <Button className="flex-1" onClick={() => finish(true)}>
                    Add exercises
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button variant="secondary" size="icon" onClick={() => setIndex(index - 1)} aria-label="Previous step">
                <ArrowLeft className="size-4" />
              </Button>
              <Button className="flex-1" onClick={() => setIndex(index + 1)}>
                Next <ArrowRight className="size-4" aria-hidden />
              </Button>
            </>
          )}
        </div>

        {index > 0 && (
          <button
            type="button"
            onClick={() => finish()}
            aria-label="Skip tour"
            className="absolute top-2 right-2 grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
