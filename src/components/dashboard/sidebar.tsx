"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight, Banknote, Bot, Building2, ChevronLeft, Crown, HandCoins,
  LayoutDashboard, LogOut, Menu, Sparkles, Star, Users, X,
} from "lucide-react";
import { HopeLogo } from "@/components/logo";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/assistant", label: "Jarvis AI", icon: Bot },
  { href: "/dashboard/donations", label: "Donations", icon: HandCoins },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Sparkles },
  { href: "/dashboard/beneficiaries", label: "Beneficiaries", icon: Users },
  { href: "/dashboard/applications", label: "Memberships", icon: Crown },
  { href: "/dashboard/banks", label: "Partner banks", icon: Building2 },
  { href: "/dashboard/ratings", label: "Season ratings", icon: Star },
];

export function Sidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed left-4 top-4 z-[60] grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-panel lg:hidden">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-white/8 bg-[#080f18] transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center border-b border-white/8 px-5"><HopeLogo /></div>
        <div className="px-4 py-4">
          <p className="font-mono-tech px-2 text-[9px] uppercase tracking-[0.24em] text-muted/60">Workspace</p>
          <nav className="mt-3 space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? "bg-mint/12 text-mint shadow-[inset_2px_0_0_#6ef2c8]" : "text-muted hover:bg-white/5 hover:text-ice"}`}>
                  <item.icon className="h-4 w-4" />{item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto space-y-3 p-4">
          <div className="rounded-2xl border border-mint/20 bg-gradient-to-br from-mint/10 to-transparent p-4">
            <Banknote className="h-5 w-5 text-mint" />
            <p className="mt-2 font-display text-sm font-bold">Season of Hope</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">Transparency is our superpower. Every record here is live.</p>
            <Link href="/#give" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-mint">View public site <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-mint/15 font-display text-xs font-bold text-mint">{name.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{name}</p><p className="font-mono-tech text-[9px] uppercase tracking-wider text-muted">{role}</p></div>
            <button onClick={logout} disabled={loggingOut} title="Sign out" className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-coral"><LogOut className="h-4 w-4" /></button>
          </div>
          <Link href="/" className="flex items-center justify-center gap-1 text-[10px] text-muted/60 hover:text-mint"><ChevronLeft className="h-3 w-3" /> Back to website</Link>
        </div>
      </aside>
    </>
  );
}
