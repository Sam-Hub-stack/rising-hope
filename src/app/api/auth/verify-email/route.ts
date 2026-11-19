import { NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { ensureData } from "@/lib/data";
import { consumeVerificationToken } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    await ensureData();
    const body = await request.json();
    const token = String(body.token ?? "").trim();
    const result = await consumeVerificationToken(token);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    const sessionId = await createSession(result.userId);
    await setSessionCookie(sessionId);
    return NextResponse.json({ ok: true, email: result.email });
  } catch {
    return NextResponse.json({ error: "Could not verify your email. Please try again." }, { status: 500 });
  }
}
