import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { ensureData } from "@/lib/data";
import { isEmailConfigured, issueVerificationToken, requestOrigin } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    await ensureData();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const country = String(body.country ?? "").trim();

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return NextResponse.json({ error: "Enter a name, valid email and a password of at least 6 characters." }, { status: 400 });
    }
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const [created] = await db
      .insert(users)
      .values({ name, email, passwordHash: hashPassword(password), country: country || "Not specified", emailVerifiedAt: null })
      .returning();

    const verification = await issueVerificationToken({
      userId: created.id,
      email: created.email,
      name: created.name,
      origin: requestOrigin(request),
    });

    const sessionId = await createSession(created.id);
    await setSessionCookie(sessionId);
    return NextResponse.json({
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      verificationRequired: true,
      emailDelivered: verification.delivered,
      verificationUrl: isEmailConfigured() ? undefined : verification.url,
    });
  } catch {
    return NextResponse.json({ error: "Could not create your account. Please try again." }, { status: 500 });
  }
}
