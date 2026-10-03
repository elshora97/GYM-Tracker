"use client";

import { useState } from "react";
import { Download, EllipsisVertical, PlusSquare, Share } from "lucide-react";
import { useInstall } from "@/components/layout/app-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

interface InstallButtonProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary";
  label?: string;
}

/**
 * "Install app" — triggers the native install prompt where the browser offers one
 * (Android / Chrome / Edge), otherwise shows step-by-step instructions (iOS Safari,
 * Firefox, etc.). Hidden once the app is running installed.
 */
export function InstallButton({ className, size = "sm", variant = "default", label = "Install app" }: InstallButtonProps) {
  const { canPrompt, isIOS, isStandalone, promptInstall } = useInstall();
  const [helpOpen, setHelpOpen] = useState(false);

  if (isStandalone) return null;

  const onClick = async () => {
    if (canPrompt) {
      await promptInstall();
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={onClick}>
        <Download className="size-4" aria-hidden />
        {label}
      </Button>
      <InstallHelpDialog open={helpOpen} onOpenChange={setHelpOpen} isIOS={isIOS} />
    </>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {n}
      </span>
      <span className="pt-0.5 text-sm">{children}</span>
    </li>
  );
}

const Kbd = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span
    className={cn(
      "mx-0.5 inline-flex items-center gap-1 rounded-md border border-border bg-white/[0.06] px-1.5 py-0.5 align-middle text-xs font-semibold",
      className,
    )}
  >
    {children}
  </span>
);

function InstallHelpDialog({
  open,
  onOpenChange,
  isIOS,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isIOS: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2">
            <Logo className="size-12" />
          </div>
          <DialogTitle>Install Gym Tracker</DialogTitle>
          <DialogDescription>
            Get it on your home screen. It opens full-screen like a normal app and works without internet.
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Open this page in <strong>Safari</strong>.
            </Step>
            <Step n={2}>
              Tap the <Kbd><Share className="size-3.5" aria-hidden /> Share</Kbd> button in the toolbar.
            </Step>
            <Step n={3}>
              Scroll down and tap <Kbd><PlusSquare className="size-3.5" aria-hidden /> Add to Home Screen</Kbd>, then
              <strong> Add</strong>.
            </Step>
          </ol>
        ) : (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Open the browser menu <Kbd><EllipsisVertical className="size-3.5" aria-hidden /></Kbd> (top-right on Chrome
              / Edge / Samsung Internet).
            </Step>
            <Step n={2}>
              Tap <Kbd>Install app</Kbd> or <Kbd>Add to Home screen</Kbd>.
            </Step>
            <Step n={3}>
              On a computer, you can also click the install icon <Kbd><Download className="size-3.5" aria-hidden /></Kbd>{" "}
              at the right of the address bar.
            </Step>
          </ol>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
