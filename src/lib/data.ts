import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  banks,
  beneficiaries,
  campaigns,
  donations,
  ratings,
  users,
} from "@/db/schema";
import type { ResourceKey } from "@/lib/resources";

export type Row = Record<string, unknown>;

export async function ensureData() {
  const { ensureSeeded } = await import("@/db/seed");
  await ensureSeeded();
}

export async function getPublicData() {
  await ensureData();
  const [campaignRows, beneficiaryRows, bankRows, recentDonations, ratingRows, topDonors, donorCount] =
    await Promise.all([
      db.select().from(campaigns).orderBy(desc(campaigns.featured), desc(campaigns.createdAt)),
      db.select().from(beneficiaries).where(eq(beneficiaries.status, "active")).limit(6),
      db.select().from(banks).where(eq(banks.active, true)),
      db.select().from(donations).where(eq(donations.status, "completed")).orderBy(desc(donations.createdAt)).limit(6),
      db.select().from(ratings).orderBy(desc(ratings.createdAt)).limit(20),
      db
        .select({
          donorName: donations.donorName,
          total: sql<number>`sum(${donations.amountCents})::int`,
          gifts: sql<number>`count(*)::int`,
        })
        .from(donations)
        .where(and(eq(donations.status, "completed"), eq(donations.isAnonymous, false)))
        .groupBy(donations.donorName)
        .orderBy(desc(sql`sum(${donations.amountCents})`))
        .limit(5),
      db.select({ id: users.id }).from(users),
    ]);

  const totalRaised = campaignRows.reduce((sum, campaign) => sum + campaign.raisedCents, 0);
  const totalGoal = campaignRows.reduce((sum, campaign) => sum + campaign.goalCents, 0);
  const avgRating = ratingRows.length
    ? ratingRows.reduce((sum, rating) => sum + rating.rating, 0) / ratingRows.length
    : 0;

  return {
    campaigns: campaignRows,
    beneficiaries: beneficiaryRows,
    banks: bankRows.map((bank) => ({ id: bank.id, name: bank.name, country: bank.country, code: bank.code, feeNote: bank.feeNote })),
    recentDonations,
    ratings: ratingRows,
    topDonors,
    donors: donorCount.length,
    totalRaised,
    totalGoal,
    avgRating,
  };
}

export async function getDashboardData() {
  await ensureData();
  const [campaignRows, donationRows, applicationRows, ratingRows, beneficiaryRows, bankRows] = await Promise.all([
    db.select().from(campaigns).orderBy(desc(campaigns.createdAt)),
    db.select().from(donations).orderBy(desc(donations.createdAt)).limit(200),
    db.select().from(applications).orderBy(desc(applications.createdAt)),
    db.select().from(ratings).orderBy(desc(ratings.createdAt)),
    db.select().from(beneficiaries).orderBy(desc(beneficiaries.createdAt)),
    db.select().from(banks).orderBy(desc(banks.createdAt)),
  ]);

  const totalRaised = donationRows.reduce((sum, donation) => sum + donation.amountCents, 0);
  const seasonGoal = campaignRows.find((campaign) => campaign.featured)?.goalCents ?? 1;
  const avgRating = ratingRows.length
    ? ratingRows.reduce((sum, rating) => sum + rating.rating, 0) / ratingRows.length
    : 0;

  const months = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - (7 - index));
    return {
      key: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date),
      total: 0,
    };
  });
  for (const donation of donationRows) {
    const key = donation.createdAt.toISOString().slice(0, 7);
    const month = months.find((item) => item.key === key);
    if (month) month.total += donation.amountCents;
  }

  return {
    campaigns: campaignRows,
    donations: donationRows,
    applications: applicationRows,
    ratings: ratingRows,
    beneficiaries: beneficiaryRows,
    banks: bankRows,
    totalRaised,
    seasonGoal,
    avgRating,
    months,
    pendingApplications: applicationRows.filter((item) => item.status === "pending").length,
  };
}

export async function getResourceRows(resource: ResourceKey): Promise<Row[]> {
  switch (resource) {
    case "donations": {
      const rows = await db
        .select({
          donation: donations,
          bankName: banks.name,
          campaignTitle: campaigns.title,
          beneficiaryName: beneficiaries.name,
        })
        .from(donations)
        .leftJoin(banks, eq(banks.id, donations.bankId))
        .leftJoin(campaigns, eq(campaigns.id, donations.campaignId))
        .leftJoin(beneficiaries, eq(beneficiaries.id, donations.beneficiaryId))
        .orderBy(desc(donations.createdAt));
      return rows.map((row) => ({ ...row.donation, bankName: row.bankName ?? "—", campaignTitle: row.campaignTitle ?? "—", beneficiaryName: row.beneficiaryName ?? "—" }));
    }
    case "campaigns":
      return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
    case "beneficiaries": {
      const rows = await db
        .select({ beneficiary: beneficiaries, campaignTitle: campaigns.title })
        .from(beneficiaries)
        .leftJoin(campaigns, eq(campaigns.id, beneficiaries.campaignId))
        .orderBy(desc(beneficiaries.createdAt));
      return rows.map((row) => ({ ...row.beneficiary, campaignTitle: row.campaignTitle ?? "—" }));
    }
    case "applications":
      return db.select().from(applications).orderBy(desc(applications.createdAt));
    case "banks": {
      const rows = await db.select().from(banks).orderBy(desc(banks.createdAt));
      const totals = await db
        .select({ bankId: donations.bankId, total: sql<number>`sum(${donations.amountCents})::int` })
        .from(donations)
        .groupBy(donations.bankId);
      return rows.map((bank) => ({ ...bank, total: totals.find((item) => item.bankId === bank.id)?.total ?? 0 }));
    }
    case "ratings": {
      const rows = await db
        .select({ rating: ratings, campaignTitle: campaigns.title })
        .from(ratings)
        .leftJoin(campaigns, eq(campaigns.id, ratings.campaignId))
        .orderBy(desc(ratings.createdAt));
      return rows.map((row) => ({ ...row.rating, campaignTitle: row.campaignTitle ?? "—" }));
    }
  }
}

export async function getRecentActivity(limit = 8) {
  await ensureData();
  const [gifts, newApplications, newRatings] = await Promise.all([
    db.select().from(donations).orderBy(desc(donations.createdAt)).limit(limit),
    db.select().from(applications).orderBy(desc(applications.createdAt)).limit(limit),
    db.select().from(ratings).orderBy(desc(ratings.createdAt)).limit(limit),
  ]);
  return [
    ...gifts.map((item) => ({ id: item.id, type: "donation" as const, label: `${item.donorName} gave`, value: item.amountCents, at: item.createdAt })),
    ...newApplications.map((item) => ({ id: item.id, type: "application" as const, label: `${item.fullName} applied for ${item.tier}`, value: 0, at: item.createdAt })),
    ...newRatings.map((item) => ({ id: item.id, type: "rating" as const, label: `${item.donorName} rated ${item.rating}★`, value: 0, at: item.createdAt })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export async function getRecentDonationsSince(days: number) {
  return db
    .select()
    .from(donations)
    .where(gte(donations.createdAt, new Date(Date.now() - days * 86400000)))
    .orderBy(desc(donations.createdAt));
}
