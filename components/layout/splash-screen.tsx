import { Logo } from "@/components/layout/logo";

export function SplashScreen({ error }: { error?: string | null }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 animate-rise">
        <Logo className="size-16" />
        <p className="font-display text-2xl font-bold tracking-wide uppercase">Gym Tracker</p>
        {error ? (
          <p className="max-w-xs px-6 text-center text-sm text-destructive">{error}</p>
        ) : (
          <span className="sr-only">Loading your workouts…</span>
        )}
      </div>
    </div>
  );
}
