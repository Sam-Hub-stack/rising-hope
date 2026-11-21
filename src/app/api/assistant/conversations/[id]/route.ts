import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assistantConversations, assistantMessages } from "@/db/schema";
import { getAssistantOwner } from "@/lib/assistant";
import type { AssistantAction } from "@/lib/assistant";
import { ensureData } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

async function findConversation(id: string, ownerKey: string) {
  const [row] = await db
    .select()
    .from(assistantConversations)
    .where(and(eq(assistantConversations.id, id), eq(assistantConversations.ownerKey, ownerKey)))
    .limit(1);
  return row;
}

export async function GET(_request: Request, { params }: Ctx) {
  try {
    await ensureData();
    const owner = await getAssistantOwner();
    const { id } = await params;
    const conversation = await findConversation(id, owner.ownerKey);
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    const messages = await db
      .select()
      .from(assistantMessages)
      .where(eq(assistantMessages.conversationId, id))
      .orderBy(asc(assistantMessages.createdAt));
    return NextResponse.json({
      conversation,
      messages: messages.map((message) => ({
        ...message,
        actions: JSON.parse(message.actions || "[]") as AssistantAction[],
      })),
    });
  } catch {
    return NextResponse.json({ error: "Could not load this conversation." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const owner = await getAssistantOwner();
    const { id } = await params;
    const conversation = await findConversation(id, owner.ownerKey);
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    const body = await request.json();
    const title = String(body.title ?? "").trim().slice(0, 80);
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    const [updated] = await db
      .update(assistantConversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(assistantConversations.id, id))
      .returning();
    return NextResponse.json({ conversation: updated });
  } catch {
    return NextResponse.json({ error: "Could not rename this conversation." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const owner = await getAssistantOwner();
    const { id } = await params;
    const conversation = await findConversation(id, owner.ownerKey);
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    await db.delete(assistantConversations).where(eq(assistantConversations.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete this conversation." }, { status: 500 });
  }
}
