"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { seedIfEmpty } from "@/lib/storage/seed";
import { SplashScreen } from "@/components/layout/splash-screen";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallState {
  /** Android/desktop Chromium: native prompt is available. */
  canPrompt: boolean;
  /** iOS Safari: needs manual "Add to Home Screen". */
  isIOS: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<boolean>;
}

const InstallContext = createContext<InstallState>({
  canPrompt: false,
  isIOS: false,
  isStandalone: false,
  promptInstall: async () => false,
});

export function useInstall() {
  return useContext(InstallContext);
}

function subscribeStandalone(cb: () => void) {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function getIsIOS() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

const noopSubscribe = () => () => {};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandalone, () => false);
  const isIOS = useSyncExternalStore(noopSubscribe, getIsIOS, () => false);

  useEffect(() => {
    let cancelled = false;
    seedIfEmpty()
      .then(() => !cancelled && setReady(true))
      .catch((e: unknown) => {
        console.error(e);
        if (!cancelled) setError("Your browser blocked local storage. Disable private mode and reload.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => {
          // Cache the chunks this page already loaded, and refresh the offline shell.
          const urls = performance.getEntriesByType("resource").map((e) => e.name);
          reg.active?.postMessage({ type: "CACHE_URLS", urls });
          if (navigator.onLine) reg.active?.postMessage({ type: "WARM" });
        })
        .catch(console.error);
    }
    if (navigator.storage?.persist) {
      // Ask the browser not to evict workout data under storage pressure.
      navigator.storage.persist().catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === "accepted";
  }, [deferred]);

  return (
    <InstallContext.Provider value={{ canPrompt: !!deferred, isIOS, isStandalone, promptInstall }}>
      {ready ? children : <SplashScreen error={error} />}
    </InstallContext.Provider>
  );
}
