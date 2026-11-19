import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { ensureData } from "@/lib/data";
import { isEmailConfigured, issueVerificationToken, requestOrigin } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    await ensureData();
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const [account] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!account || !verifyPassword(password, account.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    let verificationUrl: string | undefined;
    let emailDelivered: boolean | undefined;
    if (!account.emailVerifiedAt) {
      const verification = await issueVerificationToken({
        userId: account.id,
        email: account.email,
        name: account.name,
        origin: requestOrigin(request),
      });
      emailDelivered = verification.delivered;
      verificationUrl = isEmailConfigured() ? undefined : verification.url;
    }

    const sessionId = await createSession(account.id);
    await setSessionCookie(sessionId);
    return NextResponse.json({
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      verificationRequired: !account.emailVerifiedAt,
      emailDelivered,
      verificationUrl,
    });
  } catch {
    return NextResponse.json({ error: "Sign in failed. Please try again." }, { status: 500 });
  }
}
