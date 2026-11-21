import { NextResponse } from "next/server";
import { getAssistantContext, getAssistantOwner, CREATOR_NAME } from "@/lib/assistant";
import { ensureData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureData();
    const owner = await getAssistantOwner();
    const context = await getAssistantContext(owner.ownerKey);
    return NextResponse.json({
      owner,
      creator: CREATOR_NAME,
      mode: process.env.OPENAI_API_KEY ? "neural" : "local",
      stats: {
        totalRaised: context.totalRaised,
        totalGifts: context.totalGifts,
        beneficiaries: context.beneficiaries,
        pendingApplications: context.pendingApplications,
        avgRating: context.avgRating,
      },
      memories: context.memories,
      capabilities: [
        "Live mission status",
        "Donation guidance",
        "Campaign intelligence",
        "Partner bank routing",
        "Beneficiary context",
        "Membership workflow",
        "Season ratings",
        "Navigation control",
      ],
    });
  } catch {
    return NextResponse.json({ error: "Could not initialize the assistant." }, { status: 500 });
  }
}
