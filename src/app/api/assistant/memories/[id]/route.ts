import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assistantMemories } from "@/db/schema";
import { getAssistantOwner } from "@/lib/assistant";

type Ctx = { params: Promise<{ id: string }> };

async function findMemory(id: string, ownerKey: string) {
  const [row] = await db
    .select()
    .from(assistantMemories)
    .where(and(eq(assistantMemories.id, id), eq(assistantMemories.ownerKey, ownerKey)))
    .limit(1);
  return row;
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const owner = await getAssistantOwner();
    const { id } = await params;
    const memory = await findMemory(id, owner.ownerKey);
    if (!memory) return NextResponse.json({ error: "Memory not found or locked." }, { status: 404 });
    const body = await request.json();
    const [updated] = await db
      .update(assistantMemories)
      .set({
        label: String(body.label ?? memory.label).trim().slice(0, 80) || memory.label,
        value: String(body.value ?? memory.value).trim().slice(0, 1000) || memory.value,
        pinned: body.pinned === undefined ? memory.pinned : Boolean(body.pinned),
        updatedAt: new Date(),
      })
      .where(eq(assistantMemories.id, id))
      .returning();
    return NextResponse.json({ memory: updated });
  } catch {
    return NextResponse.json({ error: "Could not update this memory." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const owner = await getAssistantOwner();
    const { id } = await params;
    const memory = await findMemory(id, owner.ownerKey);
    if (!memory) return NextResponse.json({ error: "Memory not found or locked." }, { status: 404 });
    await db.delete(assistantMemories).where(eq(assistantMemories.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete this memory." }, { status: 500 });
  }
}
