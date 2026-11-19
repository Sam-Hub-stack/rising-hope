import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureData, getResourceRows } from "@/lib/data";
import { RESOURCE_CONFIGS, type ResourceKey } from "@/lib/resources";
import { insertRow, parsePayload } from "@/lib/resource-mutations";

type Ctx = { params: Promise<{ resource: string }> };

function resolveKey(resource: string): ResourceKey | null {
  return resource in RESOURCE_CONFIGS ? (resource as ResourceKey) : null;
}

export async function GET(_request: Request, { params }: Ctx) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = resolveKey((await params).resource);
  if (!key) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  await ensureData();
  return NextResponse.json({ rows: await getResourceRows(key) });
}

export async function POST(request: Request, { params }: Ctx) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = resolveKey((await params).resource);
  if (!key) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  await ensureData();
  const body = await request.json();
  const values = parsePayload(key, body, true);
  if ("error" in values) return NextResponse.json({ error: values.error }, { status: 400 });
  const row = await insertRow(key, values);
  return NextResponse.json({ row }, { status: 201 });
}
