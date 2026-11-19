"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, CheckCircle2, LoaderCircle, MailCheck, RefreshCw,
  ShieldAlert, ShieldCheck,
} from "lucide-react";
import { HopeLogo } from "@/components/logo";

type State = "verifying" | "success" | "error" | "idle";

export function VerifyEmailCard({ initialToken, required }: { initialToken?: string; required?: boolean }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken ?? "");
  const [state, setState] = useState<State>(initialToken ? "verifying" : "idle");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const autoRan = useRef(false);

  async function verify(value: string) {
    if (!value.trim()) {
      setState("error");
      setError("Enter the verification token from your email.");
      return;
    }
    setState("verifying");
    setError("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: value.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Verification failed.");
      setEmail(data.email ?? "");
      setState("success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setState("error");
    }
  }

  useEffect(() => {
    if (initialToken && !autoRan.current) {
      autoRan.current = true;
      void verify(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  async function resend() {
    setBusy(true);
    setResendMessage("");
    setDemoUrl("");
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not resend the email.");
      if (data.verificationUrl) {
        setDemoUrl(data.verificationUrl);
        setResendMessage("Demo mode: no email provider is configured. Use the secure link below to verify.");
      } else {
        setResendMessage("A fresh verification link is on its way. Check your inbox.");
      }
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : "Could not resend the email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-mint/10 blur-[130px]" />
      <div className="relative w-full max-w-[480px] animate-rise">
        <div className="mb-8 flex justify-center"><HopeLogo /></div>
        <div className="panel-strong p-7 text-center sm:p-9">
          {state === "verifying" ? (
            <>
              <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-mint" />
              <h1 className="mt-5 font-display text-2xl font-bold">Verifying your email...</h1>
              <p className="mt-2 text-sm text-muted">Securing your Rising Hope account.</p>
            </>
          ) : state === "success" ? (
            <>
              <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint/12">
                <span className="absolute inset-0 animate-ring rounded-full border border-mint/50" />
                <CheckCircle2 className="h-8 w-8 text-mint" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-bold">Email verified</h1>
              <p className="mt-2 text-sm text-muted">Welcome to Rising Hope{email ? `, ${email}` : ""}. Your dashboard is unlocked.</p>
              <Link href="/dashboard" className="btn-primary mt-6 w-full">Enter dashboard <ArrowRight className="h-4 w-4" /></Link>
            </>
          ) : (
            <>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-coral/10 text-coral">{required ? <ShieldAlert className="h-7 w-7" /> : <MailCheck className="h-7 w-7" />}</div>
              <p className="section-kicker mt-5">One last step</p>
              <h1 className="mt-2 font-display text-2xl font-bold">Verify your email address</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {required ? "Your dashboard is locked until your email is confirmed. " : ""}Open the verification link we sent you, or paste the token below.
              </p>
              <div className="mt-6 space-y-3 text-left">
                <input className="input text-center font-mono-tech text-xs" placeholder="Paste verification token" value={token} onChange={(event) => setToken(event.target.value)} />
                {state === "error" && <p className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">{error}</p>}
                <button onClick={() => verify(token)} className="btn-primary w-full">Verify email <ShieldCheck className="h-4 w-4" /></button>
                <button onClick={resend} disabled={busy} className="btn-outline w-full">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Resend verification link</button>
              </div>
              {resendMessage && <p className="mt-4 text-xs text-mint">{resendMessage}</p>}
              {demoUrl && <a href={demoUrl} className="btn-primary mt-3 w-full break-all text-[11px]">Open secure verification link <ArrowRight className="h-4 w-4" /></a>}
              <div className="mt-6 flex justify-center gap-4 text-xs text-muted"><Link href="/login" className="hover:text-mint">Sign in</Link><span>·</span><Link href="/" className="hover:text-mint">Back to site</Link></div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
