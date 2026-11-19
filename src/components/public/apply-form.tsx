"use client";

import { useState } from "react";
import { ArrowRight, Check, Crown, LoaderCircle } from "lucide-react";
import { TIER_BENEFITS } from "@/lib/format";

const TIERS = ["Guardian", "Champion", "Ambassador"] as const;

export function ApplyForm({ user }: { user: { name: string; email: string } | null }) {
  const [tier, setTier] = useState<string>("Guardian");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [country, setCountry] = useState("");
  const [pledge, setPledge] = useState("25");
  const [motivation, setMotivation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/public/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name, email, tier, country,
          pledgeCents: Math.round(Number(pledge || 0) * 100), motivation,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not submit application.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="panel p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-mint/12 text-mint"><Check className="h-7 w-7" /></div>
        <h3 className="font-display text-xl font-bold">Application received</h3>
        <p className="mt-2 text-sm text-muted">Our donor relations team reviews new members every Friday. Watch your inbox.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel space-y-5 p-6 sm:p-7">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-coral" />
        <p className="section-kicker">Membership application</p>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">Join the inner circle</h3>
        <p className="mt-1 text-xs text-muted">Open to donors who have given consistently during the Season of Hope.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {TIERS.map((item) => (
          <button key={item} type="button" onClick={() => setTier(item)} className={`rounded-xl border p-3 text-left transition ${tier === item ? "border-mint/70 bg-mint/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
            <span className={`block font-display text-sm font-bold ${tier === item ? "text-mint" : "text-ice"}`}>{item}</span>
            <span className="mt-1 block text-[10px] leading-relaxed text-muted">{TIER_BENEFITS[item][1]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Full name</label><input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
        <div><label className="label">Email</label><input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Country</label><input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Where you're giving from" /></div>
        <div><label className="label">Monthly pledge (USD)</label><input className="input" type="number" min="0" value={pledge} onChange={(e) => setPledge(e.target.value)} /></div>
      </div>
      <div>
        <label className="label">Why do you want to join?</label>
        <textarea required rows={3} className="input resize-none" value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Tell us what hope means to you..." />
      </div>
      {error && <p className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Submitting...</> : <>Apply for {tier} <ArrowRight className="h-4 w-4" /></>}
      </button>
      <p className="text-center text-[11px] text-muted">Review within 5 business days · No commitment until approved</p>
    </form>
  );
}
