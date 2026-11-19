import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Banknote, CheckCircle2, Crown, HandCoins,
  Heart, Sparkles, Star, TrendingUp, Users,
} from "lucide-react";
import { getDashboardData, getRecentActivity } from "@/lib/data";
import { SEASON_NAME, formatCompact, formatMoney, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const statCards = [
  { key: "raised", label: "Season raised", icon: Banknote, tone: "text-mint", bg: "bg-mint/10" },
  { key: "gifts", label: "Total gifts", icon: HandCoins, tone: "text-sky", bg: "bg-sky/10" },
  { key: "members", label: "Pending members", icon: Crown, tone: "text-coral", bg: "bg-coral/10" },
  { key: "rating", label: "Avg. season rating", icon: Star, tone: "text-violet", bg: "bg-violet/10" },
];

export default async function DashboardPage() {
  const [data, activity] = await Promise.all([getDashboardData(), getRecentActivity()]);
  const seasonProgress = Math.min(100, Math.round((data.totalRaised / Math.max(1, data.seasonGoal)) * 100));
  const maxMonth = Math.max(...data.months.map((m) => m.total), 1);
  const stats: Record<string, string> = {
    raised: formatMoney(data.totalRaised),
    gifts: String(data.donations.length),
    members: String(data.pendingApplications),
    rating: `${data.avgRating.toFixed(1)} / 5`,
  };
  const deltas: Record<string, string> = { raised: "+18.4% this month", gifts: "+32 gifts this season", members: "needs review", rating: "from 46 ratings" };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Control center · {SEASON_NAME}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Impact overview</h1>
          <p className="mt-2 text-sm text-muted">A live view of gifts, people and programmes across the network.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/donations" className="btn-outline text-xs"><HandCoins className="h-3.5 w-3.5" /> Record a gift</Link>
          <Link href="/dashboard/applications" className="btn-primary text-xs"><Crown className="h-3.5 w-3.5" /> Review members</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className="panel p-5">
            <div className="flex items-center justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.bg}`}><card.icon className={`h-5 w-5 ${card.tone}`} /></span>
              <TrendingUp className="h-4 w-4 text-muted/50" />
            </div>
            <p className="mt-5 font-display text-2xl font-bold tracking-tight">{stats[card.key]}</p>
            <p className="mt-1 text-xs text-muted">{card.label}</p>
            <p className="mt-3 font-mono-tech text-[10px] uppercase tracking-wider text-mint/80">{deltas[card.key]}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-display text-lg font-bold">Giving velocity</h2><p className="text-xs text-muted">Recorded gifts over the last eight months</p></div>
            <span className="chip"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> Live ledger</span>
          </div>
          <div className="mt-8 flex h-[210px] items-end gap-3 sm:gap-5">
            {data.months.map((month) => (
              <div key={month.key} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-mint/15 to-mint/80 transition-all duration-500 group-hover:from-mint/30 group-hover:to-mint" style={{ height: `${Math.max(4, (month.total / maxMonth) * 100)}%` }}>
                    <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-panel px-2 py-1 font-mono-tech text-[10px] text-ice group-hover:block">{formatCompact(month.total)}</span>
                  </div>
                </div>
                <span className="font-mono-tech text-[10px] uppercase text-muted">{month.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel flex flex-col p-6">
          <div className="flex items-start justify-between"><div><h2 className="font-display text-lg font-bold">Season progress</h2><p className="text-xs text-muted">Across all active campaigns</p></div><Sparkles className="h-5 w-5 text-coral" /></div>
          <div className="my-auto py-8 text-center">
            <p className="font-display text-5xl font-bold text-gradient">{seasonProgress}%</p>
            <p className="mt-2 text-sm text-muted">of {formatCompact(data.seasonGoal)} goal reached</p>
            <div className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-mint to-sky" style={{ width: `${seasonProgress}%` }} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3"><p className="text-[11px] text-muted">Campaigns</p><p className="font-display text-lg font-bold">{data.campaigns.length}</p></div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3"><p className="text-[11px] text-muted">People supported</p><p className="font-display text-lg font-bold">{data.beneficiaries.length}</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4"><div><h2 className="font-display text-lg font-bold">Recent activity</h2><p className="text-xs text-muted">Latest movements across the platform</p></div><Link href="/dashboard/donations" className="text-xs font-semibold text-mint hover:underline">View all</Link></div>
          <div className="divide-y divide-white/6">
            {activity.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 px-6 py-3.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.type === "donation" ? "bg-mint/10 text-mint" : item.type === "application" ? "bg-coral/10 text-coral" : "bg-violet/10 text-violet"}`}>
                  {item.type === "donation" ? <Heart className="h-4 w-4" /> : item.type === "application" ? <Crown className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.label}</p><p className="font-mono-tech text-[10px] text-muted">{timeAgo(item.at)}</p></div>
                {item.type === "donation" && <span className="text-xs font-bold text-mint">+{formatMoney(item.value)}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4"><div><h2 className="font-display text-lg font-bold">Active campaigns</h2><p className="text-xs text-muted">Where the season is focused</p></div><Link href="/dashboard/campaigns" className="text-xs font-semibold text-mint hover:underline">Manage</Link></div>
          <div className="divide-y divide-white/6">
            {data.campaigns.filter((campaign) => campaign.status === "active").map((campaign) => {
              const pct = Math.min(100, Math.round((campaign.raisedCents / campaign.goalCents) * 100));
              return (
                <div key={campaign.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-semibold">{campaign.title}</p><span className="font-mono-tech text-[10px] text-mint">{pct}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-mint to-sky" style={{ width: `${pct}%` }} /></div>
                  <p className="mt-2 text-[11px] text-muted">{formatCompact(campaign.raisedCents)} of {formatCompact(campaign.goalCents)} · ends {campaign.endDate}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/dashboard/applications", title: "Review membership requests", text: `${data.pendingApplications} applications waiting`, icon: Crown },
          { href: "/dashboard/beneficiaries", title: "Update beneficiary stories", text: `${data.beneficiaries.length} people in care`, icon: Users },
          { href: "/dashboard/banks", title: "Audit partner banks", text: `${data.banks.length} settlement routes`, icon: CheckCircle2 },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="panel group flex items-center gap-4 p-5 transition hover:border-mint/30 hover:bg-mint/[0.04]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-mint"><item.icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="truncate font-display text-sm font-bold">{item.title}</p><p className="mt-0.5 text-[11px] text-muted">{item.text}</p></div>
            <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-mint" />
          </Link>
        ))}
      </div>
    </div>
  );
}
