import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assistantConversations, assistantMessages } from "@/db/schema";
import {
  generateAssistantReply,
  getAssistantContext,
  getAssistantOwner,
} from "@/lib/assistant";
import { ensureData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureData();
    const owner = await getAssistantOwner();
    const body = await request.json();
    const input = String(body.message ?? "").trim().slice(0, 4000);
    if (!input) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });

    let conversationId = String(body.conversationId ?? "");
    if (conversationId) {
      const [existing] = await db
        .select()
        .from(assistantConversations)
        .where(and(eq(assistantConversations.id, conversationId), eq(assistantConversations.ownerKey, owner.ownerKey)))
        .limit(1);
      if (!existing) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    } else {
      const [created] = await db
        .insert(assistantConversations)
        .values({ ownerKey: owner.ownerKey, userId: owner.userId, title: input.slice(0, 60) })
        .returning();
      conversationId = created.id;
    }

    const historyRows = await db
      .select()
      .from(assistantMessages)
      .where(eq(assistantMessages.conversationId, conversationId))
      .orderBy(asc(assistantMessages.createdAt));

    await db.insert(assistantMessages).values({
      conversationId,
      role: "user",
      content: input,
    });

    const context = await getAssistantContext(owner.ownerKey);
    const reply = await generateAssistantReply({
      input,
      history: historyRows.map((message) => ({ role: message.role as "user" | "assistant", content: message.content })),
      context,
      owner,
    });

    const [assistantMessage] = await db
      .insert(assistantMessages)
      .values({
        conversationId,
        role: "assistant",
        content: reply.content,
        actions: JSON.stringify(reply.actions),
      })
      .returning();

    await db
      .update(assistantConversations)
      .set({ updatedAt: new Date() })
      .where(eq(assistantConversations.id, conversationId));

    return NextResponse.json({
      conversationId,
      message: { ...assistantMessage, actions: reply.actions },
      mode: reply.mode,
    });
  } catch {
    return NextResponse.json({ error: "The assistant could not process that request." }, { status: 500 });
  }
}
