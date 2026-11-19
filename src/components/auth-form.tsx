"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { HopeLogo } from "@/components/logo";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, country }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push(data.verificationRequired ? (data.verificationUrl ?? "/verify-email?required=1") : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue.");
      setBusy(false);
    }
  }

  async function demoLogin() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@risinghope.org", password: "hope2026" }),
    });
    if (response.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Demo account unavailable.");
      setBusy(false);
    }
  }

  return (
    <main className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-mint/10 blur-[130px]" />
      <div className="relative w-full max-w-[440px] animate-rise">
        <div className="mb-8 flex justify-center"><HopeLogo /></div>
        <div className="panel-strong p-7 sm:p-9">
          <p className="section-kicker">{mode === "login" ? "Welcome back" : "Create your account"}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            {mode === "login" ? "Sign in to your portal" : "Become part of the hope"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "login" ? "Manage gifts, applications and impact from one place." : "Track your giving and apply for donor membership."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "register" && (
              <div><label className="label">Full name</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
            )}
            <div><label className="label">Email address</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
            {mode === "register" && (
              <div><label className="label">Country</label><input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Optional" /></div>
            )}
            {error && <p className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">{error}</p>}
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Please wait...</> : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted/60">
            <span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" />
          </div>
          <button onClick={demoLogin} disabled={busy} className="btn-outline w-full">Explore with demo admin account</button>
          <p className="mt-5 text-center text-xs text-muted">
            {mode === "login" ? "New to Rising Hope?" : "Already have an account?"}{" "}
            <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-mint hover:underline">
              {mode === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
        <p className="mt-5 text-center font-mono-tech text-[10px] uppercase tracking-[0.2em] text-muted/60">Demo access · admin@risinghope.org / hope2026</p>
      </div>
    </main>
  );
}
