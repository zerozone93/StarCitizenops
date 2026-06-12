import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="min-h-screen text-zinc-100">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-3 py-3 lg:px-6 lg:py-5">
        <Sidebar />
        <div className="flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-orange-300/25 bg-slate-950/48 shadow-[0_25px_80px_-35px_rgba(0,0,0,0.85)] backdrop-blur-sm lg:ml-[19rem]">
          <TopNav title={title} subtitle={subtitle} />
          <main className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
