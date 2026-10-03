"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";
import { useInstall } from "@/components/layout/app-provider";
import { Button } from "@/components/ui/button";

const KEY = "gt-install-dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Gentle install nudge: native prompt on Android/desktop, instructions on iOS. */
export function InstallBanner() {
  const { canPrompt, isIOS, isStandalone, promptInstall } = useInstall();
  const stored = useSyncExternalStore(
    () => () => {},
    readDismissed,
    () => true,
  );
  const [dismissed, setDismissed] = useState(false);

  if (isStandalone || stored || dismissed || (!canPrompt && !isIOS)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <aside className="surface relative flex items-center gap-3 rounded-2xl p-3 pr-12" aria-label="Install app">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        {isIOS ? <Share className="size-5" aria-hidden /> : <Download className="size-5" aria-hidden />}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Install Gym Tracker</p>
        {isIOS ? (
          <p className="text-muted-foreground">
            Tap <span className="font-medium text-foreground">Share</span> then{" "}
            <span className="font-medium text-foreground">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="text-muted-foreground">One tap from your home screen. Works offline.</p>
        )}
      </div>
      {!isIOS && (
        <Button size="sm" onClick={() => promptInstall().then((ok) => ok && dismiss())}>
          Install
        </Button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
        className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </aside>
  );
}
