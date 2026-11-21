import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assistantConversations } from "@/db/schema";
import { getAssistantOwner } from "@/lib/assistant";
import { ensureData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureData();
    const owner = await getAssistantOwner();
    const rows = await db
      .select()
      .from(assistantConversations)
      .where(eq(assistantConversations.ownerKey, owner.ownerKey))
      .orderBy(desc(assistantConversations.updatedAt));
    return NextResponse.json({ conversations: rows });
  } catch {
    return NextResponse.json({ error: "Could not load conversations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureData();
    const owner = await getAssistantOwner();
    const body = await request.json().catch(() => ({}));
    const [created] = await db
      .insert(assistantConversations)
      .values({
        ownerKey: owner.ownerKey,
        userId: owner.userId,
        title: String(body.title ?? "New conversation").slice(0, 80),
      })
      .returning();
    return NextResponse.json({ conversation: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create a conversation." }, { status: 500 });
  }
}
