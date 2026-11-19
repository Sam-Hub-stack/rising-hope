import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { emailOutbox, users, verificationTokens } from "@/db/schema";

const TOKEN_HOURS = 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function verificationUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
}

export function requestOrigin(request: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return new URL(request.url).origin;
  const protocol = request.headers.get("x-forwarded-proto") ?? (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function issueVerificationToken({
  userId,
  email,
  name,
  origin,
}: {
  userId: string;
  email: string;
  name: string;
  origin: string;
}) {
  await db
    .update(verificationTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(verificationTokens.userId, userId), isNull(verificationTokens.consumedAt)));

  const token = randomBytes(32).toString("hex");
  const url = verificationUrl(origin, token);
  await db.insert(verificationTokens).values({
    userId,
    email,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_HOURS * 60 * 60 * 1000),
  });

  const delivered = await deliverVerificationEmail({ toEmail: email, name, url });
  return { token, url, delivered };
}

export async function deliverVerificationEmail({
  toEmail,
  name,
  url,
}: {
  toEmail: string;
  name: string;
  url: string;
}): Promise<boolean> {
  const subject = "Verify your Rising Hope email";
  const body = `Hi ${name},\n\nWelcome to Rising Hope. Verify your email to unlock your donor dashboard:\n\n${url}\n\nThis link expires in ${TOKEN_HOURS} hours. If you did not create an account, you can ignore this message.\n\n— The Rising Hope team`;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Rising Hope <verify@risinghope.org>",
          to: [toEmail],
          subject,
          text: body,
        }),
      });
      if (response.ok) return true;
      console.error("Resend verification delivery failed:", await response.text());
    } catch (error) {
      console.error("Resend verification delivery error:", error);
    }
  }

  // Demo fallback: keep a copy in the database so the flow remains testable
  // even without an email provider configured.
  await db.insert(emailOutbox).values({ toEmail, subject, body, kind: "verification" });
  return false;
}

export async function consumeVerificationToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: false as const, error: "This verification link is invalid." };

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.tokenHash, hashToken(token)), isNull(verificationTokens.consumedAt)))
    .limit(1);

  if (!record) return { ok: false as const, error: "This verification link is invalid or has already been used." };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false as const, error: "This verification link has expired. Request a new one." };

  await db.transaction(async (tx) => {
    await tx.update(verificationTokens).set({ consumedAt: new Date() }).where(eq(verificationTokens.id, record.id));
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, record.userId));
  });

  return { ok: true as const, userId: record.userId, email: record.email };
}

export async function demoVerificationUrl(email: string) {
  const [message] = await db
    .select({ body: emailOutbox.body })
    .from(emailOutbox)
    .where(and(eq(emailOutbox.toEmail, email), eq(emailOutbox.kind, "verification")))
    .orderBy(desc(emailOutbox.createdAt))
    .limit(1);
  const match = message?.body.match(/https?:\/\/[^\s]+verify-email\?token=[a-f0-9]+/);
  return match?.[0] ?? null;
}
