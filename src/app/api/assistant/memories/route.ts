import { NextResponse } from "next/server";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { assistantMemories } from "@/db/schema";
import { getAssistantOwner } from "@/lib/assistant";
import { ensureData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureData();
    const owner = await getAssistantOwner();
    const rows = await db
      .select()
      .from(assistantMemories)
      .where(or(eq(assistantMemories.ownerKey, "global"), eq(assistantMemories.ownerKey, owner.ownerKey)))
      .orderBy(desc(assistantMemories.pinned), desc(assistantMemories.createdAt));
    return NextResponse.json({ memories: rows });
  } catch {
    return NextResponse.json({ error: "Could not load memories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await getAssistantOwner();
    const body = await request.json();
    const label = String(body.label ?? "").trim().slice(0, 80);
    const value = String(body.value ?? "").trim().slice(0, 1000);
    if (!label || !value) return NextResponse.json({ error: "Label and value are required." }, { status: 400 });
    const [created] = await db
      .insert(assistantMemories)
      .values({ ownerKey: owner.ownerKey, label, value, pinned: Boolean(body.pinned) })
      .returning();
    return NextResponse.json({ memory: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save this memory." }, { status: 500 });
  }
}
