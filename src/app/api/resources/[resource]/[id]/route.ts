import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureData } from "@/lib/data";
import { RESOURCE_CONFIGS, type ResourceKey } from "@/lib/resources";
import { deleteRow, parsePayload, updateRow } from "@/lib/resource-mutations";

type Ctx = { params: Promise<{ resource: string; id: string }> };

function resolveKey(resource: string): ResourceKey | null {
  return resource in RESOURCE_CONFIGS ? (resource as ResourceKey) : null;
}

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource, id } = await params;
  const key = resolveKey(resource);
  if (!key) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  await ensureData();
  const body = await request.json();
  const values = parsePayload(key, body, false);
  if ("error" in values) return NextResponse.json({ error: values.error }, { status: 400 });
  const row = await updateRow(key, id, values);
  if (!row) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json({ row });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource, id } = await params;
  const key = resolveKey(resource);
  if (!key) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  await ensureData();
  await deleteRow(key, id);
  return NextResponse.json({ ok: true });
}
