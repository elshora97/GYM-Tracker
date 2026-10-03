"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Download, FileUp, Smartphone, Trash2, Check, Share } from "lucide-react";
import { toast } from "sonner";
import type { UserSettings } from "@/lib/types";
import { useUser } from "@/lib/hooks/use-data";
import { setTourCompleted, updateSettings, updateUserName } from "@/lib/storage/repositories/user";
import { downloadJson, exportBackup, importBackup, parseBackup } from "@/lib/storage/backup";
import { resetDatabase } from "@/lib/storage/seed";
import { todayKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { useInstall } from "@/components/layout/app-provider";

type Confirm = { kind: "import"; file: File } | { kind: "reset" } | null;

export default function SettingsPage() {
  const user = useUser();
  const install = useInstall();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  if (!user) {
    return (
      <div className="flex flex-col gap-4 pt-6" aria-busy="true">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const onExport = async () => {
    const backup = await exportBackup();
    downloadJson(backup, `gym-tracker-backup-${todayKey()}.json`);
    toast.success("Backup downloaded");
  };

  const onImport = async (file: File) => {
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      await importBackup(parsed);
      toast.success(`Imported ${parsed.data.workouts.length} workouts`);
    } catch (e) {
      toast.error(e instanceof SyntaxError ? "That file isn't valid JSON" : e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <div>
      <PageHeader title="Profile" />

      <div className="flex flex-col gap-6">
        <Section title="Profile">
          <NameField initial={user.name} />
        </Section>

        <Section title="Preferences">
          <Segmented<UserSettings["unit"]>
            label="Weight unit"
            value={user.settings.unit}
            options={[
              { value: "kg", label: "Kilograms" },
              { value: "lbs", label: "Pounds" },
            ]}
            onChange={(unit) => updateSettings({ unit })}
          />
          <Segmented<UserSettings["streakRestDays"]>
            label="Streak rules"
            hint={
              user.settings.streakRestDays === 0
                ? "Every day counts — missing a day resets your streak."
                : `Up to ${user.settings.streakRestDays} rest ${user.settings.streakRestDays === 1 ? "day" : "days"} between sessions keeps the streak alive.`
            }
            value={user.settings.streakRestDays}
            options={[
              { value: 0, label: "Strict" },
              { value: 1, label: "1 rest day" },
              { value: 2, label: "2 rest days" },
            ]}
            onChange={(streakRestDays) => updateSettings({ streakRestDays })}
          />
        </Section>

        <Section title="App">
          <Row
            icon={install.isIOS ? Share : Smartphone}
            title={install.isStandalone ? "Installed" : "Install app"}
            description={
              install.isStandalone
                ? "You're using the installed app. Works fully offline."
                : install.isIOS
                  ? "In Safari tap Share, then “Add to Home Screen”."
                  : install.canPrompt
                    ? "Add Gym Tracker to your home screen. Works offline."
                    : "Use your browser menu → “Install app” / “Add to Home screen”."
            }
            action={
              install.isStandalone ? (
                <Check className="size-5 text-success" aria-hidden />
              ) : install.canPrompt ? (
                <Button size="sm" onClick={() => install.promptInstall()}>
                  Install
                </Button>
              ) : null
            }
          />
          <Row
            icon={Compass}
            title="App tour"
            description="Replay the quick guide to the main screens."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await setTourCompleted(false);
                  router.push("/");
                }}
              >
                Replay
              </Button>
            }
          />
        </Section>

        <Section title="Your data" description="Everything is stored on this device. Back it up regularly.">
          <Row
            icon={Download}
            title="Export backup"
            description="Download all workouts and exercises as JSON."
            action={
              <Button size="sm" variant="secondary" onClick={onExport}>
                Export
              </Button>
            }
          />
          <Row
            icon={FileUp}
            title="Import backup"
            description="Replace data on this device with a backup file."
            action={
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                Import
              </Button>
            }
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose backup file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setConfirm({ kind: "import", file });
              e.target.value = "";
            }}
          />
          <Row
            icon={Trash2}
            title="Start fresh"
            description="Delete all workouts and exercises."
            destructive
            action={
              <Button size="sm" variant="destructive" onClick={() => setConfirm({ kind: "reset" })}>
                Reset
              </Button>
            }
          />
        </Section>

        <p className="pb-4 text-center text-xs text-muted-foreground">Gym Tracker · v1.0 · Data stays on your device</p>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "import" ? "Import backup?" : "Delete all data?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "import"
                ? `This replaces all data on this device with “${confirm.file.name}”.`
                : "This deletes all workouts and exercises on this device. Export a backup first if you want to keep them."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!confirm) return;
                if (confirm.kind === "import") await onImport(confirm.file);
                else {
                  await resetDatabase();
                  toast.success("All data cleared");
                }
              }}
            >
              {confirm?.kind === "import" ? "Import" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{title}</h2>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      <div className="surface mt-3 flex flex-col divide-y divide-border rounded-2xl">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  description,
  action,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 p-4">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          destructive ? "bg-destructive/10 text-destructive" : "bg-white/[0.05] text-muted-foreground",
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function NameField({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(initial);
      return;
    }
    if (trimmed !== initial) {
      await updateUserName(trimmed);
      toast.success("Name saved");
    }
  };
  return (
    <div className="flex flex-col gap-2 p-4">
      <Label htmlFor="name">Your name</Label>
      <Input
        id="name"
        value={name}
        maxLength={30}
        autoComplete="given-name"
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
    </div>
  );
}

function Segmented<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2 p-4">
      <legend className="sr-only">{label}</legend>
      <span className="text-sm font-medium text-muted-foreground" aria-hidden>
        {label}
      </span>
      <div className="flex gap-1 rounded-xl border border-border bg-white/[0.03] p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "press h-10 flex-1 rounded-lg px-2 text-sm font-semibold",
              value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </fieldset>
  );
}
