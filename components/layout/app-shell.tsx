import { BottomNav } from "@/components/navigation/bottom-nav";
import { Sidebar } from "@/components/navigation/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="app-backdrop" aria-hidden />
      <Sidebar />
      <div className="lg:pl-64">
        <main
          id="main"
          className="mx-auto w-full max-w-2xl px-4 pt-safe pb-[calc(var(--nav-height)+env(safe-area-inset-bottom)+1.5rem)] sm:px-6 lg:pb-12"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
