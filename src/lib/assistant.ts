import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  assistantMemories,
  banks,
  beneficiaries,
  campaigns,
  donations,
  ratings,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCompact, formatMoney } from "@/lib/format";

export const ASSISTANT_COOKIE = "jarvis_owner";
export const CREATOR_NAME = "Sam";

export type AssistantAction = { label: string; href: string };
export type AssistantReply = { content: string; actions: AssistantAction[]; mode: "neural" | "local" };

export type AssistantOwner = {
  ownerKey: string;
  userId: string | null;
  displayName: string;
  isCreator: boolean;
};

export async function getAssistantOwner(): Promise<AssistantOwner> {
  const user = await getCurrentUser();
  if (user) {
    return {
      ownerKey: `user:${user.id}`,
      userId: user.id,
      displayName: user.name,
      isCreator: user.name.toLowerCase().includes("sam"),
    };
  }

  const store = await cookies();
  let guest = store.get(ASSISTANT_COOKIE)?.value;
  if (!guest) {
    guest = randomUUID();
    store.set(ASSISTANT_COOKIE, guest, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return { ownerKey: `guest:${guest}`, userId: null, displayName: "Operator", isCreator: false };
}

export async function getAssistantContext(ownerKey: string) {
  const [campaignRows, donationRows, applicationRows, bankRows, beneficiaryRows, ratingRows, memoryRows] =
    await Promise.all([
      db.select().from(campaigns).orderBy(desc(campaigns.createdAt)),
      db.select().from(donations).orderBy(desc(donations.createdAt)).limit(100),
      db.select().from(applications).orderBy(desc(applications.createdAt)),
      db.select().from(banks).orderBy(desc(banks.createdAt)),
      db.select().from(beneficiaries).orderBy(desc(beneficiaries.createdAt)),
      db.select().from(ratings).orderBy(desc(ratings.createdAt)).limit(50),
      db.select().from(assistantMemories).where(or(eq(assistantMemories.ownerKey, "global"), eq(assistantMemories.ownerKey, ownerKey))),
    ]);

  const totalRaised = donationRows.reduce((sum, item) => sum + item.amountCents, 0);
  const avgRating = ratingRows.length
    ? ratingRows.reduce((sum, item) => sum + item.rating, 0) / ratingRows.length
    : 0;
  const pendingApplications = applicationRows.filter((item) => item.status === "pending").length;

  return {
    totalRaised,
    totalGifts: donationRows.length,
    campaigns: campaignRows.map((item) => ({
      title: item.title,
      status: item.status,
      raisedCents: item.raisedCents,
      goalCents: item.goalCents,
      endDate: item.endDate,
    })),
    banks: bankRows.map((item) => ({ name: item.name, code: item.code, country: item.country, active: item.active })),
    beneficiaries: beneficiaryRows.length,
    pendingApplications,
    avgRating,
    memories: memoryRows.map((item) => ({ label: item.label, value: item.value, pinned: item.pinned })),
  };
}

export type AssistantContext = Awaited<ReturnType<typeof getAssistantContext>>;

export function buildSystemPrompt(context: AssistantContext, owner: AssistantOwner) {
  const memoryLines = context.memories.map((memory) => `- ${memory.label}: ${memory.value}`).join("\n");
  const campaignLines = context.campaigns
    .slice(0, 6)
    .map((campaign) => `- ${campaign.title} — ${formatCompact(campaign.raisedCents)} of ${formatCompact(campaign.goalCents)}, ${campaign.status}`)
    .join("\n");
  const bankLines = context.banks
    .slice(0, 6)
    .map((bank) => `- ${bank.name} (${bank.code}, ${bank.country})`)
    .join("\n");

  return `You are J.A.R.V.I.S., an original advanced AI command center for Rising Hope, a global charity for orphans, widows and hospitalised people. You are calm, precise, warm and faintly witty. Keep replies under 160 words unless asked for detail.

IDENTITY: Your creator is ${CREATOR_NAME}. If asked who made you, say ${CREATOR_NAME} created you. If the operator says they are ${CREATOR_NAME}, address them as "Sam". Otherwise call them "sir" or "operator" occasionally, but naturally.

PERMANENT MEMORIES:
${memoryLines || "- Creator: Sam"}

LIVE PLATFORM DATA:
- Total recorded giving: ${formatMoney(context.totalRaised)}
- Gifts in ledger: ${context.totalGifts}
- Active beneficiaries: ${context.beneficiaries}
- Pending membership applications: ${context.pendingApplications}
- Average season rating: ${context.avgRating.toFixed(1)} / 5
Campaigns:
${campaignLines || "- No campaigns yet"}
Partner banks:
${bankLines || "- No banks configured"}

CAPABILITIES: You can explain donations, campaigns, beneficiaries, membership, ratings, partner banks and navigation. You can reference live figures above. Do not invent data you do not have. If asked about weather, news or unavailable services, say you are not connected to that feed. Never claim to send real money.

Operator: ${owner.displayName}. Workspace scope: ${owner.ownerKey.startsWith("user:") ? "authenticated" : "guest"}.`;
}

function action(label: string, href: string): AssistantAction {
  return { label, href };
}

export function localAssistantReply(input: string, context: AssistantContext): AssistantReply {
  const text = input.toLowerCase().trim();

  if (/who (made|created|built|designed) you|your creator|who is your creator|sam/.test(text)) {
    return {
      content: `I was created by ${CREATOR_NAME} — the mind behind this entire operation. I like to think I inherited a certain standard of excellence. My purpose here is to make Rising Hope's impact impossible to ignore, and to keep a steady hand on the controls for you.`,
      actions: [action("Meet the mission", "/#mission")],
      mode: "local",
    };
  }

  if (/^(hi|hello|hey|good morning|good evening|good afternoon)\b/.test(text)) {
    return {
      content: "Good to see you. All systems are online, the season ledger is live, and I'm monitoring the mission. What would you like to examine?",
      actions: [action("Open command center", "/dashboard")],
      mode: "local",
    };
  }

  if (/status|overview|how are (things|we)|report|summary|systems/.test(text)) {
    return {
      content: `Status report: ${formatMoney(context.totalRaised)} recorded across ${context.totalGifts} gifts, ${context.beneficiaries} people in care, and ${context.pendingApplications} membership applications awaiting review. Average season rating is ${context.avgRating.toFixed(1)} out of 5. The mission remains on course.`,
      actions: [action("View full dashboard", "/dashboard"), action("Review memberships", "/dashboard/applications")],
      mode: "local",
    };
  }

  if (/donat|give|gift|money|micro/.test(text)) {
    return {
      content: `Giving is deliberately precise: choose an amount from $1 upward, select one of our ${context.banks.filter((bank) => bank.active).length} registered micro-banks, direct the gift to a campaign, then rate the experience. Every gift updates the season ledger and campaign progress in real time. No card details are collected in this demo.`,
      actions: [action("Make a gift", "/#give"), action("Open donation ledger", "/dashboard/donations")],
      mode: "local",
    };
  }

  if (/campaign|season|goal|progress/.test(text)) {
    const lines = context.campaigns.slice(0, 4).map((campaign) => `• ${campaign.title}: ${formatCompact(campaign.raisedCents)} / ${formatCompact(campaign.goalCents)} (${campaign.status})`).join("\n");
    return {
      content: `Here's the Season of Hope at a glance:\n${lines || "No campaigns are currently configured."}\nYou can inspect every campaign in the control center.`,
      actions: [action("Manage campaigns", "/dashboard/campaigns"), action("See public season", "/#season")],
      mode: "local",
    };
  }

  if (/bank|settlement|microbank|route/.test(text)) {
    const names = context.banks.slice(0, 3).map((bank) => `${bank.name} (${bank.country})`).join(", ");
    return {
      content: `We route gifts through ${context.banks.length} audited partner banks rather than a vague central fund. Current routes include ${names || "no configured banks"}. Each bank appears in the donation ledger so a donor can see exactly where a gift settled.`,
      actions: [action("View partner banks", "/dashboard/banks"), action("Public bank list", "/#banks")],
      mode: "local",
    };
  }

  if (/member|application|guardian|champion|ambassador|join/.test(text)) {
    return {
      content: `The donor circle has three tiers — Guardian, Champion and Ambassador. ${context.pendingApplications} application${context.pendingApplications === 1 ? " is" : "s are"} awaiting review. Approved members gain reports, calls and a direct role in shaping future campaigns.`,
      actions: [action("Review applications", "/dashboard/applications"), action("Apply to join", "/#membership")],
      mode: "local",
    };
  }

  if (/beneficiar|orphan|widow|hospital|people|who (do|are) we help/.test(text)) {
    return {
      content: `We currently have ${context.beneficiaries} verified people in care across three focus areas: orphaned children, widows rebuilding livelihoods, and hospitalised patients needing treatment or aftercare. Every profile is maintained by a field officer.`,
      actions: [action("View beneficiaries", "/dashboard/beneficiaries"), action("Read their stories", "/#stories")],
      mode: "local",
    };
  }

  if (/rating|review|feedback|score/.test(text)) {
    return {
      content: `Donors rate each campaign from one to five stars. The current average is ${context.avgRating.toFixed(1)} out of 5, drawn from the season's verified feedback. Ratings are stored alongside gifts so sentiment and impact can be reviewed together.`,
      actions: [action("Inspect ratings", "/dashboard/ratings")],
      mode: "local",
    };
  }

  if (/open|go to|navigate|take me|launch/.test(text)) {
    if (/dashboard|overview|control/.test(text)) return { content: "Opening the control center.", actions: [action("Dashboard", "/dashboard")], mode: "local" };
    if (/donat|gift/.test(text)) return { content: "Routing you to the giving console.", actions: [action("Give now", "/#give")], mode: "local" };
    if (/member|application/.test(text)) return { content: "Routing you to membership review.", actions: [action("Memberships", "/dashboard/applications")], mode: "local" };
    return { content: "I can route you to the dashboard, donations, campaigns, beneficiaries, memberships, banks or ratings. Just name the destination.", actions: [action("Dashboard", "/dashboard")], mode: "local" };
  }

  if (/weather|football|news|stock|bitcoin/.test(text)) {
    return {
      content: "I'm not connected to that feed. My instruments are calibrated to Rising Hope's data: gifts, campaigns, people, banks, ratings and membership. Ask me about those and I'll be unusually useful.",
      actions: [action("See what I can do", "/assistant")],
      mode: "local",
    };
  }

  if (/thank/.test(text)) {
    return { content: "Always a pleasure. I'll keep the lights on and the ledger honest.", actions: [], mode: "local" };
  }

  return {
    content: `Understood. I'm tracking ${formatMoney(context.totalRaised)} in recorded giving and ${context.beneficiaries} verified people in care right now. I can brief you on campaigns, donations, partner banks, beneficiaries, membership applications or season ratings — or simply run a full status report.`,
    actions: [action("Run status report", "/assistant"), action("Open dashboard", "/dashboard")],
    mode: "local",
  };
}

export async function generateAssistantReply({
  input,
  history,
  context,
  owner,
}: {
  input: string;
  history: { role: "user" | "assistant"; content: string }[];
  context: AssistantContext;
  owner: AssistantOwner;
}): Promise<AssistantReply> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return localAssistantReply(input, context);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 700,
        messages: [
          { role: "system", content: buildSystemPrompt(context, owner) },
          ...history.slice(-12).map((message) => ({ role: message.role, content: message.content })),
          { role: "user", content: input },
        ],
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    const content = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!content) throw new Error("Empty model response");
    return { content, actions: [], mode: "neural" };
  } catch (error) {
    console.error("Assistant neural mode failed, using local engine:", error);
    return localAssistantReply(input, context);
  }
}
