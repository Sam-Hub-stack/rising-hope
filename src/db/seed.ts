import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { hashPassword } from "@/lib/auth";
import {
  applications,
  assistantMemories,
  banks,
  beneficiaries,
  campaigns,
  donations,
  ratings,
  users,
} from "@/db/schema";

const USER_IDS = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
  "10000000-0000-4000-8000-000000000004",
  "10000000-0000-4000-8000-000000000005",
  "10000000-0000-4000-8000-000000000006",
];

const CAMPAIGN_IDS = [
  "20000000-0000-4000-8000-000000000001",
  "20000000-0000-4000-8000-000000000002",
  "20000000-0000-4000-8000-000000000003",
  "20000000-0000-4000-8000-000000000004",
];

const BANK_IDS = [
  "30000000-0000-4000-8000-000000000001",
  "30000000-0000-4000-8000-000000000002",
  "30000000-0000-4000-8000-000000000003",
  "30000000-0000-4000-8000-000000000004",
  "30000000-0000-4000-8000-000000000005",
];

const BENEFICIARY_IDS = [
  "40000000-0000-4000-8000-000000000001",
  "40000000-0000-4000-8000-000000000002",
  "40000000-0000-4000-8000-000000000003",
  "40000000-0000-4000-8000-000000000004",
  "40000000-0000-4000-8000-000000000005",
  "40000000-0000-4000-8000-000000000006",
];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export async function ensureSeeded() {
  const check = await db.execute(sql`select count(*)::int as count from ${users}`);
  if (Number((check.rows[0] as { count: number })?.count ?? 0) > 0) return;

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(9182736450)`);
    const locked = await tx.execute(sql`select count(*)::int as count from ${users}`);
    if (Number((locked.rows[0] as { count: number })?.count ?? 0) > 0) return;

    const password = hashPassword("hope2026");

    await tx
      .insert(users)
      .values([
        { id: USER_IDS[0], name: "Amelia Grant", email: "admin@risinghope.org", passwordHash: password, role: "admin", country: "United Kingdom", emailVerifiedAt: daysAgo(80) },
        { id: USER_IDS[1], name: "Noah Williams", email: "noah@example.com", passwordHash: password, role: "donor", country: "United States", emailVerifiedAt: daysAgo(60) },
        { id: USER_IDS[2], name: "Sofia Martinez", email: "sofia@example.com", passwordHash: password, role: "donor", country: "Spain", emailVerifiedAt: daysAgo(52) },
        { id: USER_IDS[3], name: "Kwame Mensah", email: "kwame@example.com", passwordHash: password, role: "donor", country: "Ghana", emailVerifiedAt: daysAgo(45) },
        { id: USER_IDS[4], name: "Priya Sharma", email: "priya@example.com", passwordHash: password, role: "donor", country: "India", emailVerifiedAt: daysAgo(39) },
        { id: USER_IDS[5], name: "Lucas Chen", email: "lucas@example.com", passwordHash: password, role: "donor", country: "Canada", emailVerifiedAt: daysAgo(31) },
      ])
      .onConflictDoNothing();

    await tx
      .insert(banks)
      .values([
        { id: BANK_IDS[0], name: "Kampala Community Microbank", code: "RH-UG-001", country: "Uganda", description: "Community-owned microbank serving 42 villages around Kampala.", feeNote: "0% platform fee · 1.2% local processing", active: true },
        { id: BANK_IDS[1], name: "Nairobi Care Trust", code: "RH-KE-002", country: "Kenya", description: "Registered trust distributing medical and livelihood grants.", feeNote: "0% platform fee · verified monthly audits", active: true },
        { id: BANK_IDS[2], name: "Lagos Women's Cooperative Bank", code: "RH-NG-003", country: "Nigeria", description: "Women-led cooperative bank funding widows and orphan guardians.", feeNote: "0% platform fee · 0.8% cooperative levy", active: true },
        { id: BANK_IDS[3], name: "Dhaka Compassion Microbank", code: "RH-BD-004", country: "Bangladesh", description: "Village savings groups and emergency health lending.", feeNote: "0% platform fee · settled every 14 days", active: true },
        { id: BANK_IDS[4], name: "Global Hope Settlement", code: "RH-GL-000", country: "International", description: "USD settlement partner for international donors and currency conversion.", feeNote: "0% platform fee · FX at mid-market rate", active: true },
      ])
      .onConflictDoNothing();

    await tx
      .insert(campaigns)
      .values([
        { id: CAMPAIGN_IDS[0], title: "Season of Hope 2026", slug: "season-of-hope-2026", season: "Season of Hope 2026", summary: "A global season of giving that funds orphan care, widow livelihoods and hospital recovery.", story: "For nine months, Rising Hope unites donors across 19 countries to deliver consistent, transparent support to people at their most vulnerable. Every gift is routed through one of our registered microbank partners, and every family is visited by a local field officer.", goalCents: 50000000, raisedCents: 38427500, startDate: "2026-02-14", endDate: "2026-11-30", status: "active", accent: "mint", featured: true },
        { id: CAMPAIGN_IDS[1], title: "Surgery & Recovery Fund", slug: "surgery-recovery-fund", season: "Season of Hope 2026", summary: "Life-changing operations and aftercare for hospitalised patients who cannot afford treatment.", story: "Hospitalised patients often face the cruelest choice: treatment or feeding their family. This fund covers surgery, medication, transport and three months of follow-up care.", goalCents: 18000000, raisedCents: 12475000, startDate: "2026-03-01", endDate: "2026-10-31", status: "active", accent: "sky", featured: true },
        { id: CAMPAIGN_IDS[2], title: "Classrooms for Orphans", slug: "classrooms-for-orphans", season: "Season of Hope 2026", summary: "School fees, books and safe transport for children who have lost parental care.", story: "Education is the most reliable route out of vulnerability. We sponsor children through primary and secondary school, with guardians receiving weekly check-ins.", goalCents: 12000000, raisedCents: 8960000, startDate: "2026-01-15", endDate: "2026-12-15", status: "active", accent: "amber", featured: true },
        { id: CAMPAIGN_IDS[3], title: "Widow Livelihood Circles", slug: "widow-livelihood-circles", season: "Season of Hope 2026", summary: "Seed capital and training for widows rebuilding independent livelihoods.", story: "Small, patient capital transforms a widow's circumstances. Groups of eight women receive training, a shared savings account and a microbank loan guarantee.", goalCents: 9500000, raisedCents: 7312000, startDate: "2026-04-01", endDate: "2026-11-15", status: "active", accent: "violet", featured: false },
      ])
      .onConflictDoNothing();

    await tx
      .insert(assistantMemories)
      .values([
        { id: "90000000-0000-4000-8000-000000000001", ownerKey: "global", label: "Creator", value: "Sam is the creator of J.A.R.V.I.S. and the Rising Hope platform. Refer to Sam with respect as the creator whenever identity is discussed.", pinned: true },
        { id: "90000000-0000-4000-8000-000000000002", ownerKey: "global", label: "Primary directive", value: "Protect the mission: transparent, community-led giving for orphans, widows and hospitalised people.", pinned: true },
        { id: "90000000-0000-4000-8000-000000000003", ownerKey: "global", label: "Tone", value: "Calm, precise, warm and faintly witty — never smug. Address the operator professionally.", pinned: false },
      ])
      .onConflictDoNothing();

    await tx
      .insert(beneficiaries)
      .values([
        { id: BENEFICIARY_IDS[0], name: "Amara Okoye", category: "orphan", age: 11, location: "Lagos, Nigeria", story: "Amara cares for her younger brother after losing both parents. Sponsorship keeps them in school and together.", imageUrl: "https://images.pexels.com/photos/9823013/pexels-photo-9823013.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", goalCents: 480000, raisedCents: 326000, status: "active", campaignId: CAMPAIGN_IDS[2] },
        { id: BENEFICIARY_IDS[1], name: "Joseph Kizito", category: "orphan", age: 9, location: "Kampala, Uganda", story: "Joseph walks four kilometres to school each day. A sponsorship will cover fees, books and a safe bicycle.", imageUrl: "https://images.pexels.com/photos/35250405/pexels-photo-35250405.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", goalCents: 360000, raisedCents: 241500, status: "active", campaignId: CAMPAIGN_IDS[2] },
        { id: BENEFICIARY_IDS[2], name: "Mary Njeri", category: "widow", age: 46, location: "Nairobi, Kenya", story: "After losing her husband, Mary started selling vegetables to feed three children. A cooperative grant will double her stall.", imageUrl: "https://images.pexels.com/photos/11488978/pexels-photo-11488978.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", goalCents: 720000, raisedCents: 518000, status: "active", campaignId: CAMPAIGN_IDS[3] },
        { id: BENEFICIARY_IDS[3], name: "Amina Begum", category: "widow", age: 38, location: "Dhaka, Bangladesh", story: "Amina stitches garments at home. Training and a small loan will let her buy her own sewing machine.", imageUrl: "https://images.pexels.com/photos/38492743/pexels-photo-38492743.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", goalCents: 540000, raisedCents: 305000, status: "active", campaignId: CAMPAIGN_IDS[3] },
        { id: BENEFICIARY_IDS[4], name: "Daniel Ouma", category: "hospitalised", age: 27, location: "Nairobi, Kenya", story: "Daniel needs emergency surgery after a road accident. His recovery fund also covers physiotherapy and transport.", imageUrl: "https://images.pexels.com/photos/6129242/pexels-photo-6129242.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", goalCents: 1450000, raisedCents: 1120000, status: "active", campaignId: CAMPAIGN_IDS[1] },
        { id: BENEFICIARY_IDS[5], name: "Esther Wanjiku", category: "hospitalised", age: 34, location: "Nakuru, Kenya", story: "Esther is recovering from a long hospital stay and needs continuing medication while she rebuilds her income.", imageUrl: "https://images.pexels.com/photos/16167526/pexels-photo-16167526.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", goalCents: 630000, raisedCents: 479000, status: "active", campaignId: CAMPAIGN_IDS[1] },
      ])
      .onConflictDoNothing();

    const seedDonations = [
      ["Amelia Grant", "admin@risinghope.org", 2500000, 12, 4, 0, 1, 5, "A season of hope begins with all of us.", false],
      ["Noah Williams", "noah@example.com", 1200000, 7, 4, 0, 2, 5, "Keep the classrooms open!", false],
      ["Sofia Martinez", "sofia@example.com", 850000, 11, 0, 3, 0, 4, "For Mary's new stall. You are inspiring.", false],
      ["Kwame Mensah", "kwame@example.com", 450000, 4, 2, 4, 1, 5, "Thinking of Daniel and his recovery.", false],
      ["Priya Sharma", "priya@example.com", 300000, 2, 3, 0, 3, 4, "Small gift, big hope.", true],
      ["Lucas Chen", "lucas@example.com", 150000, 1, 4, 5, 1, 3, "", false],
      ["Grace Mwangi", "grace@example.com", 97500, 6, 1, 4, 1, 5, "Wishing Esther a speedy recovery.", false],
      ["Daniel Foster", "daniel@example.com", 50000, 3, 0, 2, 0, 4, "Every child deserves a school bag.", false],
      ["Aisha Bello", "aisha@example.com", 25000, 5, 2, 3, 3, 5, "From Lagos with love.", false],
      ["Elena Rossi", "elena@example.com", 12000, 8, 4, 0, 2, 4, "A little from Italy.", true],
      ["Marcus Lee", "marcus@example.com", 10000, 9, 4, 1, 2, 3, "", false],
      ["Fatima Noor", "fatima@example.com", 7500, 10, 3, 3, 3, 5, "For Amina's sewing machine.", false],
      ["Anonymous", "", 5000, 13, 0, 5, 1, 0, "", true],
      ["Thomas Weber", "thomas@example.com", 2500, 14, 4, 0, 0, 4, "Monthly micro-gift.", false],
    ] as const;

    const usersById = USER_IDS;
    await tx.insert(donations).values(
      seedDonations.map((d, index) => ({
        id: randomUUID(),
        donorName: d[0],
        email: d[1],
        amountCents: d[2],
        createdAt: daysAgo(d[3]),
        bankId: BANK_IDS[d[4]],
        beneficiaryId: d[5] === 0 ? null : BENEFICIARY_IDS[d[5] - 1],
        campaignId: CAMPAIGN_IDS[d[6]],
        userId: index < 6 ? usersById[index] : null,
        rating: d[7],
        message: d[8],
        isAnonymous: d[9],
        status: "completed",
        currency: "USD",
      })),
    );

    await tx
      .insert(applications)
      .values([
        { id: randomUUID(), userId: USER_IDS[1], fullName: "Noah Williams", email: "noah@example.com", tier: "Champion", country: "United States", motivation: "I have donated every month this season and want to help shape future campaigns.", pledgeCents: 25000, status: "approved", reviewNote: "Welcomed to the circle on 12 March.", reviewedAt: daysAgo(20), createdAt: daysAgo(38) },
        { id: randomUUID(), userId: USER_IDS[2], fullName: "Sofia Martinez", email: "sofia@example.com", tier: "Guardian", country: "Spain", motivation: "I want to follow the field reports more closely and support widow livelihoods.", pledgeCents: 12000, status: "pending", createdAt: daysAgo(9) },
        { id: randomUUID(), userId: USER_IDS[3], fullName: "Kwame Mensah", email: "kwame@example.com", tier: "Ambassador", country: "Ghana", motivation: "As a Ghanaian donor I would love to host a site visit and bring local voices into the programme.", pledgeCents: 50000, status: "pending", createdAt: daysAgo(5) },
        { id: randomUUID(), userId: USER_IDS[4], fullName: "Priya Sharma", email: "priya@example.com", tier: "Guardian", country: "India", motivation: "I believe in small, consistent giving and want to join a community of givers.", pledgeCents: 8000, status: "approved", reviewNote: "Approved — onboarding email sent.", reviewedAt: daysAgo(14), createdAt: daysAgo(24) },
        { id: randomUUID(), userId: USER_IDS[5], fullName: "Lucas Chen", email: "lucas@example.com", tier: "Champion", country: "Canada", motivation: "Interested in supporting surgical recovery programmes with monthly giving.", pledgeCents: 20000, status: "rejected", reviewNote: "Pledge below Champion minimum; invited to reapply for Guardian.", reviewedAt: daysAgo(11), createdAt: daysAgo(19) },
        { id: randomUUID(), userId: null, fullName: "Grace Mwangi", email: "grace@example.com", tier: "Guardian", country: "Kenya", motivation: "I have seen the impact in my community and want to be part of the donor circle.", pledgeCents: 10000, status: "pending", createdAt: daysAgo(2) },
      ])
      .onConflictDoNothing();

    await tx
      .insert(ratings)
      .values([
        { id: randomUUID(), campaignId: CAMPAIGN_IDS[0], userId: USER_IDS[1], donorName: "Noah Williams", rating: 5, comment: "Transparent updates and real field reports. I know exactly where my gift went.", createdAt: daysAgo(3) },
        { id: randomUUID(), campaignId: CAMPAIGN_IDS[0], userId: USER_IDS[2], donorName: "Sofia Martinez", rating: 5, comment: "The season progress tracker is beautifully clear.", createdAt: daysAgo(6) },
        { id: randomUUID(), campaignId: CAMPAIGN_IDS[1], userId: USER_IDS[3], donorName: "Kwame Mensah", rating: 5, comment: "Daniel's recovery updates arrived every week.", createdAt: daysAgo(8) },
        { id: randomUUID(), campaignId: CAMPAIGN_IDS[2], userId: null, donorName: "Grace Mwangi", rating: 4, comment: "Would love even more photos from the classrooms.", createdAt: daysAgo(12) },
        { id: randomUUID(), campaignId: CAMPAIGN_IDS[0], userId: USER_IDS[4], donorName: "Priya Sharma", rating: 5, comment: "Micro-donations finally feel meaningful. The bank routing is a great idea.", createdAt: daysAgo(15) },
        { id: randomUUID(), campaignId: CAMPAIGN_IDS[3], userId: null, donorName: "Aisha Bello", rating: 4, comment: "The widow livelihood circles are changing lives in Lagos.", createdAt: daysAgo(18) },
        { id: randomUUID(), campaignId: CAMPAIGN_IDS[1], userId: USER_IDS[5], donorName: "Lucas Chen", rating: 4, comment: "Good communication, though I'd like itemised hospital invoices.", createdAt: daysAgo(22) },
        { id: randomUUID(), campaignId: CAMPAIGN_IDS[2], userId: null, donorName: "Daniel Foster", rating: 5, comment: "School sponsorship made simple and personal.", createdAt: daysAgo(27) },
      ])
      .onConflictDoNothing();
  });
}
