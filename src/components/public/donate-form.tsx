"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Landmark, LoaderCircle, ShieldCheck, Sparkles, Star } from "lucide-react";

type BankOption = { id: string; name: string; country: string; code: string; feeNote: string };
type CampaignOption = { id: string; title: string };

export function DonateForm({
  banks,
  campaigns,
  defaultCampaignId,
  user,
}: {
  banks: BankOption[];
  campaigns: CampaignOption[];
  defaultCampaignId?: string;
  user: { name: string; email: string } | null;
}) {
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [campaignId, setCampaignId] = useState(defaultCampaignId ?? campaigns[0]?.id ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [anonymous, setAnonymous] = useState(false);
  const [monthly, setMonthly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; amount: number } | null>(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;
  const selectedBank = banks.find((bank) => bank.id === bankId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!effectiveAmount || effectiveAmount < 1) {
      setError("Please enter an amount of at least $1.");
      return;
    }
    if (!bankId) {
      setError("Please choose a partner bank.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/public/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: Math.round(effectiveAmount * 100),
          bankId,
          campaignId: campaignId || null,
          donorName: anonymous ? "Anonymous" : name || "Anonymous",
          email,
          message,
          rating,
          isAnonymous: anonymous,
          frequency: monthly ? "monthly" : "once",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      setReceipt({ id: data.id, amount: data.amountCents });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process your gift.");
    } finally {
      setBusy(false);
    }
  }

  if (receipt) {
    return (
      <div className="panel-strong p-8 text-center animate-rise">
        <div className="relative mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-mint/12">
          <span className="absolute inset-0 animate-ring rounded-full border border-mint/50" />
          <CheckCircle2 className="h-8 w-8 text-mint" />
        </div>
        <h3 className="font-display text-2xl font-bold">Your hope is on its way</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          ${(receipt.amount / 100).toFixed(2)} has been recorded for {selectedBank?.name}. Your receipt reference is
        </p>
        <p className="mt-3 font-mono-tech text-xs tracking-wider text-mint">RH-{receipt.id.slice(0, 8).toUpperCase()}</p>
        <button className="btn-outline mt-6" onClick={() => setReceipt(null)}>Make another gift</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel-strong space-y-5 p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Secure giving</p>
          <h3 className="mt-1.5 font-display text-xl font-bold">Make a gift</h3>
        </div>
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-[11px] font-semibold">
          <button type="button" onClick={() => setMonthly(false)} className={`rounded-full px-3 py-1.5 transition ${!monthly ? "bg-mint text-ink" : "text-muted"}`}>Once</button>
          <button type="button" onClick={() => setMonthly(true)} className={`rounded-full px-3 py-1.5 transition ${monthly ? "bg-mint text-ink" : "text-muted"}`}>Monthly</button>
        </div>
      </div>

      <div>
        <label className="label">Choose an amount (USD)</label>
        <div className="grid grid-cols-4 gap-2">
          {[10, 25, 50, 100].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => { setAmount(value); setCustomAmount(""); }}
              className={`rounded-xl border py-2.5 font-display text-sm font-bold transition ${!customAmount && amount === value ? "border-mint bg-mint/12 text-mint shadow-[0_0_20px_-10px_#6ef2c8]" : "border-white/10 bg-white/[0.03] text-muted hover:border-white/25"}`}
            >
              ${value}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
          <input
            className="input pl-7"
            type="number"
            min="1"
            step="0.01"
            placeholder="Or enter a custom amount"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
          <Sparkles className="h-3 w-3 text-coral" /> $5 can supply school notebooks for one child for a week.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="donor-name">Your name</label>
          <input id="donor-name" className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="donor-email">Email for receipt</label>
          <input id="donor-email" className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="bank">Partner micro-bank</label>
        <select id="bank" className="input" value={bankId} onChange={(e) => setBankId(e.target.value)}>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id} className="bg-panel">{bank.name} · {bank.country}</option>
          ))}
        </select>
        {selectedBank && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
            <Landmark className="mt-0.5 h-3 w-3 shrink-0 text-mint" /> {selectedBank.feeNote}
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="campaign">Direct my gift to</label>
        <select id="campaign" className="input" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id} className="bg-panel">{campaign.title}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Rate this season <span className="normal-case tracking-normal">(1 = fair, 5 = excellent)</span></label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" aria-label={`${star} stars`} onClick={() => setRating(star)} className="transition hover:scale-110">
              <Star className={`h-6 w-6 ${star <= rating ? "fill-coral text-coral" : "text-white/20"}`} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="message">Leave a message <span className="normal-case tracking-normal">(optional)</span></label>
        <textarea id="message" rows={2} className="input resize-none" placeholder="A note of hope..." value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-[#6ef2c8]" />
        Make my gift anonymous
      </label>

      {error && <p className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">{error}</p>}

      <button className="btn-primary w-full py-3" disabled={busy}>
        {busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Securing your gift...</> : <>Give ${effectiveAmount || 0}{monthly ? " monthly" : " now"} <ArrowRight className="h-4 w-4" /></>}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-mint" /> Demo environment · no real money is charged
      </p>
    </form>
  );
}
