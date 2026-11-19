import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureData } from "@/lib/data";

const TIERS = new Set(["Guardian", "Champion", "Ambassador"]);

export async function POST(request: Request) {
  try {
    await ensureData();
    const body = await request.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const tier = String(body.tier ?? "Guardian");
    const motivation = String(body.motivation ?? "").trim();
    const pledgeCents = Math.max(0, Math.round(Number(body.pledgeCents) || 0));

    if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || motivation.length < 10 || !TIERS.has(tier)) {
      return NextResponse.json({ error: "Please complete all fields with a valid email and a short motivation." }, { status: 400 });
    }

    const user = await getCurrentUser();
    const [created] = await db
      .insert(applications)
      .values({
        userId: user?.id ?? null,
        fullName,
        email,
        tier,
        country: String(body.country ?? "").trim(),
        motivation,
        pledgeCents,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not submit your application." }, { status: 500 });
  }
}
