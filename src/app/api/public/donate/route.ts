import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { banks, beneficiaries, campaigns, donations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureData } from "@/lib/data";

export async function POST(request: Request) {
  try {
    await ensureData();
    const body = await request.json();
    const amountCents = Math.round(Number(body.amountCents));
    const bankId = String(body.bankId ?? "");
    const campaignId = body.campaignId ? String(body.campaignId) : null;
    const donorName = String(body.donorName ?? "Anonymous").trim() || "Anonymous";
    const email = String(body.email ?? "").trim().toLowerCase();
    const message = String(body.message ?? "").trim();
    const rating = Math.min(5, Math.max(0, Math.round(Number(body.rating) || 0)));
    const isAnonymous = Boolean(body.isAnonymous);
    const frequency = body.frequency === "monthly" ? "monthly" : "once";

    if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 100000000) {
      return NextResponse.json({ error: "Choose an amount between $1 and $1,000,000." }, { status: 400 });
    }

    const user = await getCurrentUser();
    const bank = bankId ? (await db.select().from(banks).where(eq(banks.id, bankId)).limit(1))[0] : null;
    if (!bank || !bank.active) return NextResponse.json({ error: "Please select an active partner bank." }, { status: 400 });

    if (campaignId) {
      const campaign = (await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1))[0];
      if (!campaign) return NextResponse.json({ error: "That campaign is no longer available." }, { status: 400 });
    }

    const finalMessage = frequency === "monthly"
      ? (message ? `${message} · Monthly gift` : "Recurring monthly gift")
      : message;

    const [created] = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(donations)
        .values({
          donorName,
          email,
          amountCents,
          bankId,
          campaignId,
          userId: user?.id ?? null,
          message: finalMessage,
          rating,
          isAnonymous,
          status: "completed",
        })
        .returning();

      if (campaignId) {
        await tx
          .update(campaigns)
          .set({ raisedCents: sql`${campaigns.raisedCents} + ${amountCents}` })
          .where(eq(campaigns.id, campaignId));
      }

      const beneficiaryRows = campaignId
        ? await tx.select().from(beneficiaries).where(eq(beneficiaries.campaignId, campaignId)).limit(1)
        : [];
      if (beneficiaryRows[0]) {
        await tx
          .update(beneficiaries)
          .set({ raisedCents: sql`${beneficiaries.raisedCents} + ${amountCents}` })
          .where(eq(beneficiaries.id, beneficiaryRows[0].id));
      }

      return inserted;
    });

    return NextResponse.json({ id: created.id, amountCents: created.amountCents }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not record your gift. Please try again." }, { status: 500 });
  }
}
