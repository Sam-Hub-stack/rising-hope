import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureData } from "@/lib/data";
import { isEmailConfigured, issueVerificationToken, requestOrigin } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    await ensureData();

    if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

    const verification = await issueVerificationToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      origin: requestOrigin(request),
    });

    return NextResponse.json({
      ok: true,
      emailDelivered: verification.delivered,
      verificationUrl: isEmailConfigured() ? undefined : verification.url,
    });
  } catch {
    return NextResponse.json({ error: "Could not resend the verification email." }, { status: 500 });
  }
}
