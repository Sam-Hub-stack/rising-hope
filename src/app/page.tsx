import {
  ArrowRight, Baby, BadgeCheck, Building2, ChevronRight, CircleCheck, Clock3,
  Globe2, Heart, HeartHandshake, Landmark, MoveUpRight, PlayCircle, Quote,
  ShieldCheck, Sparkles, Star, Stethoscope, TrendingUp, Users,
} from "lucide-react";
import Link from "next/link";
import { HopeLogo } from "@/components/logo";
import { DonateForm } from "@/components/public/donate-form";
import { ApplyForm } from "@/components/public/apply-form";
import { getCurrentUser } from "@/lib/auth";
import { getPublicData } from "@/lib/data";
import { CATEGORY_LABELS, SEASON_NAME, formatCompact, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const CITIES = ["Kampala", "Nairobi", "Lagos", "Dhaka", "Ghana", "Kathmandu", "Manila", "Amman", "Lima", "Atlanta"];

const PILLARS = [
  { icon: Baby, title: "Orphaned children", color: "text-mint", line: "from-mint/60", text: "School fees, books, nutrition and safe guardianship so children can stay together and stay in class.", image: "https://images.pexels.com/photos/9823013/pexels-photo-9823013.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" },
  { icon: HeartHandshake, title: "Widows & their families", color: "text-coral", line: "from-coral/60", text: "Seed capital, cooperative membership and training that turn survival into independent income.", image: "https://images.pexels.com/photos/11488978/pexels-photo-11488978.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" },
  { icon: Stethoscope, title: "Hospitalised people", color: "text-sky", line: "from-sky/60", text: "Emergency surgery, medication and aftercare for patients who must choose between treatment and feeding their family.", image: "https://images.pexels.com/photos/6129242/pexels-photo-6129242.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" },
];

const accentStyles: Record<string, { bar: string; badge: string }> = {
  mint: { bar: "bg-mint", badge: "text-mint bg-mint/10 border-mint/25" },
  amber: { bar: "bg-coral", badge: "text-coral bg-coral/10 border-coral/25" },
  violet: { bar: "bg-violet", badge: "text-violet bg-violet/10 border-violet/25" },
  sky: { bar: "bg-sky", badge: "text-sky bg-sky/10 border-sky/25" },
};

export default async function HomePage() {
  const [user, data] = await Promise.all([getCurrentUser(), getPublicData()]);
  const featured = data.campaigns.filter((campaign) => campaign.featured).slice(0, 3);
  const progress = Math.min(100, Math.round((data.totalRaised / Math.max(1, data.totalGoal)) * 100));

  return (
    <main className="overflow-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <HopeLogo />
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted lg:flex">
            <a href="#mission" className="transition hover:text-mint">Our mission</a>
            <a href="#season" className="transition hover:text-mint">The season</a>
            <a href="#stories" className="transition hover:text-mint">Stories</a>
            <a href="#banks" className="transition hover:text-mint">Partner banks</a>
            <a href="#membership" className="transition hover:text-mint">Membership</a>
            <Link href="/assistant" className="transition hover:text-mint">Jarvis AI</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/assistant" className="btn-ghost hidden px-3 text-xs sm:inline-flex">AI Command</Link>
            <Link href={user ? "/dashboard" : "/login"} className="btn-ghost hidden px-3 text-xs sm:inline-flex">{user ? "Dashboard" : "Sign in"}</Link>
            <a href="#give" className="btn-primary px-4 py-2 text-xs sm:px-5">Donate now <ArrowRight className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="grid-bg relative border-b border-white/5">
        <div className="pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-mint/12 blur-[140px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-sky/10 blur-[130px]" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/[0.07] px-3 py-1.5">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ring rounded-full bg-mint" /><span className="relative h-2 w-2 rounded-full bg-mint" /></span>
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-mint">{SEASON_NAME} · Live now</span>
            </div>
            <h1 className="mt-7 font-display text-[clamp(3.1rem,7.2vw,6.4rem)] font-bold leading-[0.94] tracking-[-0.055em]">
              Small gifts.<br /><span className="text-gradient">Rising hope.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-muted sm:text-lg">
              A global charity network funding orphan care, widow livelihoods and hospital recovery — with every gift routed through a registered community micro-bank and every impact visible to you.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#give" className="btn-primary px-6 py-3.5">Give hope today <ArrowRight className="h-4 w-4" /></a>
              <a href="#season" className="btn-outline px-6 py-3.5"><PlayCircle className="h-4 w-4" /> See the season</a>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
              <div><p className="font-display text-2xl font-bold text-ice">{formatCompact(data.totalRaised)}</p><p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted">Raised this season</p></div>
              <div className="h-9 w-px bg-white/10" />
              <div><p className="font-display text-2xl font-bold text-ice">{data.donors}+</p><p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted">_global donors_</p></div>
              <div className="h-9 w-px bg-white/10" />
              <div><p className="font-display text-2xl font-bold text-ice">{data.avgRating.toFixed(1)}★</p><p className="font-mono-tech text-[10px] uppercase tracking-widest text-muted">Donor rating</p></div>
            </div>
          </div>

          <div className="relative animate-rise [animation-delay:150ms]">
            <div className="absolute -inset-6 rounded-full border border-mint/10" />
            <div className="absolute -inset-12 rounded-full border border-dashed border-mint/8" />
            <div className="panel-strong relative overflow-hidden rounded-[28px] p-3 shadow-[0_40px_120px_-30px_rgba(110,242,200,0.22)]">
              <div className="relative h-[400px] overflow-hidden rounded-[20px] sm:h-[490px]">
                <img src="https://images.pexels.com/photos/9823013/pexels-photo-9823013.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1200" alt="Children receiving support from a Rising Hope community partner" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-ink/70 px-3 py-1.5 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" /><span className="font-mono-tech text-[10px] uppercase tracking-widest">Field report · Lagos</span>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-mint">Impact in motion</p>
                  <p className="mt-2 font-display text-2xl font-bold leading-tight">Hope is a verb.<br />Today it looks like 412 school bags.</p>
                </div>
              </div>
            </div>
            <div className="animate-float absolute -left-5 top-14 hidden rounded-2xl border border-white/12 bg-[#0b1621]/95 p-4 shadow-2xl backdrop-blur-xl sm:block">
              <div className="flex items-center gap-2 text-mint"><TrendingUp className="h-4 w-4" /><span className="font-mono-tech text-[10px] uppercase tracking-widest">Live total</span></div>
              <p className="mt-1.5 font-display text-xl font-bold">{formatMoney(data.totalRaised)}</p>
              <div className="mt-2 h-1 w-28 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-mint" style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="animate-float absolute -bottom-6 -right-3 rounded-2xl border border-white/12 bg-[#0b1621]/95 p-4 shadow-2xl backdrop-blur-xl [animation-delay:1.5s]">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-sky" /><span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted">Verified route</span></div>
              <p className="mt-1 font-display text-sm font-semibold">5 registered banks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-b border-white/5 bg-[#08111a] py-3.5">
        <div className="flex w-max animate-marquee items-center gap-8">
          {[...CITIES, ...CITIES].map((city, index) => (
            <span key={`${city}-${index}`} className="flex items-center gap-8 font-mono-tech text-[11px] uppercase tracking-[0.28em] text-muted/70">
              {city}<span className="text-mint">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Mission */}
      <section id="mission" className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="section-kicker">// 01 — Our mission</p>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-tight tracking-tight">Three vulnerabilities.<br /><span className="text-muted">One relentless response.</span></h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted">We work through local partners and registered micro-banks so money reaches people quickly, with a traceable record at every step.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <article key={pillar.title} className="panel group overflow-hidden transition hover:-translate-y-1 hover:border-white/20">
              <div className="relative h-44 overflow-hidden">
                <img src={pillar.image} alt="" className="h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-80" />
                <div className={`absolute inset-0 bg-gradient-to-t from-panel via-transparent ${pillar.line}`} />
                <span className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-ink/70 backdrop-blur"><pillar.icon className={`h-5 w-5 ${pillar.color}`} /></span>
              </div>
              <div className="p-6">
                <p className="font-mono-tech text-[10px] tracking-widest text-muted">0{index + 1} / FOCUS AREA</p>
                <h3 className="mt-2 font-display text-xl font-bold">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{pillar.text}</p>
                <a href="#give" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-mint hover:gap-2">Fund this work <ChevronRight className="h-3.5 w-3.5" /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Seasonal campaigns */}
      <section id="season" className="border-y border-white/5 bg-[#08111a] py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="section-kicker">// 02 — {SEASON_NAME}</p>
              <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold tracking-tight">The season of giving, measured in impact.</h2>
            </div>
            <div className="chip"><Clock3 className="h-3.5 w-3.5 text-mint" /> Campaigns close 30 November 2026</div>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {featured.map((campaign) => {
              const pct = Math.min(100, Math.round((campaign.raisedCents / campaign.goalCents) * 100));
              const style = accentStyles[campaign.accent] ?? accentStyles.mint;
              const rating = data.ratings.filter((item) => item.campaignId === campaign.id);
              const avg = rating.length ? rating.reduce((sum, item) => sum + item.rating, 0) / rating.length : 0;
              return (
                <article key={campaign.id} className="panel flex flex-col p-6 transition hover:-translate-y-1 hover:border-white/20">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-wider ${style.badge}`}>{campaign.season}</span>
                    <span className="chip px-2 py-1 text-[10px]">{campaign.status}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold leading-tight">{campaign.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{campaign.summary}</p>
                  <div className="mt-6 flex items-center gap-1 text-xs text-muted"><Star className="h-3.5 w-3.5 fill-coral text-coral" /><span className="font-semibold text-ice">{avg.toFixed(1)}</span> donor rating · {rating.length} reviews</div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/8"><div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} /></div>
                  <div className="mt-3 flex items-end justify-between">
                    <div><span className="font-display text-xl font-bold">{formatCompact(campaign.raisedCents)}</span><span className="text-xs text-muted"> / {formatCompact(campaign.goalCents)}</span></div>
                    <span className="font-mono-tech text-xs text-mint">{pct}%</span>
                  </div>
                  <a href="#give" className="btn-outline mt-6 w-full py-2.5 text-xs">Fund this campaign <MoveUpRight className="h-3.5 w-3.5" /></a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Donation */}
      <section id="give" className="mx-auto grid max-w-[1280px] items-start gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="section-kicker">// 03 — Give with clarity</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-tight tracking-tight">Your $5 is not small.<br /><span className="text-gradient">It is somebody's first page.</span></h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">Choose any amount, pick the registered micro-bank you trust, direct it to the cause you care about and rate the experience. Every gift appears in our transparent season ledger.</p>
          <div className="mt-9 space-y-4">
            {[
              { icon: BadgeCheck, title: "Registered partner banks", text: "Settled directly to five audited micro-banks and community trusts." },
              { icon: Globe2, title: "International by design", text: "Give in USD from anywhere; local partners distribute in local currency." },
              { icon: ShieldCheck, title: "Radical transparency", text: "Track the season total, campaign progress and donor ratings in real time." },
            ].map((item) => (
              <div key={item.title} className="panel flex gap-4 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-mint/20 bg-mint/8"><item.icon className="h-5 w-5 text-mint" /></span>
                <div><h3 className="font-display text-sm font-bold">{item.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted">{item.text}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-coral/20 bg-coral/[0.06] p-4">
            <Sparkles className="h-5 w-5 shrink-0 text-coral" />
            <p className="text-xs leading-relaxed text-muted"><span className="font-semibold text-ice">Demo checkout:</span> this is a functional simulation — no real bank charges are made and no card details are collected.</p>
          </div>
        </div>
        <div id="banks" className="scroll-mt-24">
          <DonateForm banks={data.banks} campaigns={data.campaigns} user={user ? { name: user.name, email: user.email } : null} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {data.banks.slice(0, 4).map((bank) => (
              <div key={bank.id} className="panel flex items-center gap-3 px-4 py-3">
                <Landmark className="h-4 w-4 shrink-0 text-mint" />
                <div className="min-w-0"><p className="truncate text-xs font-semibold">{bank.name}</p><p className="font-mono-tech text-[10px] text-muted">{bank.code} · {bank.country}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stories */}
      <section id="stories" className="border-y border-white/5 bg-[#08111a] py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><p className="section-kicker">// 04 — The people</p><h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold tracking-tight">Not statistics. Neighbours.</h2></div>
            <p className="max-w-sm text-sm text-muted">Every profile is maintained by a field officer who visits the family and verifies their needs.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.beneficiaries.map((person) => {
              const pct = Math.min(100, Math.round((person.raisedCents / person.goalCents) * 100));
              return (
                <article key={person.id} className="panel group overflow-hidden transition hover:-translate-y-1 hover:border-white/20">
                  <div className="relative h-52 overflow-hidden">
                    <img src={person.imageUrl} alt={person.name} className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-ink/75 px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-wider backdrop-blur">{CATEGORY_LABELS[person.category] ?? person.category}</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold">{person.name}</h3><span className="text-xs text-muted">{person.age} yrs</span></div>
                    <p className="font-mono-tech text-[10px] uppercase tracking-wider text-mint">{person.location}</p>
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{person.story}</p>
                    <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-mint" style={{ width: `${pct}%` }} /></div>
                    <div className="mt-2 flex justify-between text-[11px] text-muted"><span>{formatCompact(person.raisedCents)} raised</span><span className="text-mint">{pct}%</span></div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leaderboard + membership */}
      <section id="membership" className="mx-auto grid max-w-[1280px] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="section-kicker">// 05 — Donor circle</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-tight tracking-tight">Top donors.<br /><span className="text-muted">Real influence.</span></h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted">Our most committed givers are invited to shape the next season. Here's who is leading {SEASON_NAME}.</p>
          <div className="panel-strong mt-8 divide-y divide-white/8 overflow-hidden">
            {data.topDonors.map((donor, index) => (
              <div key={donor.donorName} className="flex items-center gap-4 px-5 py-4">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono-tech text-xs font-bold ${index === 0 ? "bg-mint text-ink" : "bg-white/6 text-muted"}`}>{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{donor.donorName}</p><p className="text-[11px] text-muted">{donor.gifts} gifts this season</p></div>
                <span className="font-display text-sm font-bold text-mint">{formatCompact(donor.total)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <Quote className="h-5 w-5 shrink-0 text-coral" />
            <p className="text-xs leading-relaxed text-muted">"Rising Hope is the first charity where I can see exactly which bank received my $5 and what it bought." <span className="text-ice">— Priya, Guardian member</span></p>
          </div>
        </div>
        <ApplyForm user={user ? { name: user.name, email: user.email } : null} />
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 bg-[#08111a] py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <p className="section-kicker">// 06 — The transparent path</p>
          <h2 className="mt-4 max-w-2xl font-display text-[clamp(2rem,4vw,3.4rem)] font-bold tracking-tight">From your hand to theirs in four steps.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              { icon: Heart, n: "01", title: "You give", text: "Choose any amount — even $1 — and a partner bank you trust." },
              { icon: Landmark, n: "02", title: "Bank settles", text: "Funds land in an audited local micro-bank, never a vague central pot." },
              { icon: Users, n: "03", title: "Field team acts", text: "Verified families receive grants, equipment, school fees or surgery." },
              { icon: CircleCheck, n: "04", title: "You see it", text: "Season ledger, ratings and field reports update as impact lands." },
            ].map((step) => (
              <div key={step.n} className="relative panel p-6">
                <span className="font-mono-tech text-[11px] text-mint">{step.n} / 04</span>
                <step.icon className="mt-5 h-6 w-6 text-coral" />
                <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="panel-strong mt-12 flex flex-col items-center justify-between gap-6 p-8 text-center sm:flex-row sm:text-left">
            <div><h3 className="font-display text-2xl font-bold">The next chapter starts with one gift.</h3><p className="mt-2 text-sm text-muted">Join {data.donors}+ donors already moving this season forward.</p></div>
            <a href="#give" className="btn-primary px-7 py-3">Give hope now <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 bg-[#050b12] py-12">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div><HopeLogo /><p className="mt-5 max-w-xs text-xs leading-relaxed text-muted">A global, open charity network for orphans, widows and hospitalised people. Registered partner banks. Verifiable impact. Always.</p></div>
          <div><p className="label">Explore</p><div className="space-y-2.5 text-xs text-muted"><a href="#mission" className="block hover:text-mint">Our mission</a><a href="#season" className="block hover:text-mint">Season campaigns</a><a href="#stories" className="block hover:text-mint">Beneficiaries</a><a href="#membership" className="block hover:text-mint">Donor membership</a></div></div>
          <div><p className="label">Platform</p><div className="space-y-2.5 text-xs text-muted"><Link href="/login" className="block hover:text-mint">Donor sign in</Link><Link href="/register" className="block hover:text-mint">Create account</Link><Link href="/dashboard" className="block hover:text-mint">Impact dashboard</Link><Link href="/assistant" className="block hover:text-mint">Jarvis AI command center</Link><a href="#banks" className="block hover:text-mint">Partner banks</a></div></div>
          <div><p className="label">Stay close</p><p className="text-xs leading-relaxed text-muted">Field notes, season updates and new campaigns — twice a month, never spam.</p><Link href="/register" className="btn-outline mt-4 w-full py-2 text-xs">Join the network</Link></div>
        </div>
        <div className="mx-auto mt-10 flex max-w-[1280px] flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 pt-6 text-[11px] text-muted sm:px-8">
          <p>© 2026 Rising Hope. Built for transparency. Demo project — no real financial transactions.</p>
          <p className="flex items-center gap-2 font-mono-tech uppercase tracking-widest"><Building2 className="h-3.5 w-3.5 text-mint" /> 5 registered banks · 19 countries</p>
        </div>
      </footer>
    </main>
  );
}
