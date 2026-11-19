import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Bell, Globe2, Search } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { ensureData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerifiedAt) redirect("/verify-email?required=1");
  await ensureData();

  return (
    <div className="min-h-screen bg-ink">
      <Sidebar name={user.name} role={user.role} />
      <div className="min-w-0 lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-white/8 bg-ink/85 px-5 backdrop-blur-xl sm:px-8">
          <div className="pl-12 lg:pl-0">
            <p className="font-mono-tech text-[9px] uppercase tracking-[0.24em] text-muted/60">Rising Hope / Control center</p>
            <p className="font-display text-sm font-semibold">Good to see you, {user.name.split(" ")[0]}.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 md:flex">
              <Search className="h-3.5 w-3.5 text-muted" /><span className="text-[11px] text-muted/70">Search workspace</span>
              <span className="font-mono-tech rounded border border-white/10 px-1 text-[9px] text-muted">⌘K</span>
            </div>
            <button className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-muted hover:text-ice"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-coral" /></button>
            <a href="/" className="btn-outline hidden px-3 py-2 text-[11px] sm:inline-flex"><Globe2 className="h-3.5 w-3.5" /> View site</a>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
