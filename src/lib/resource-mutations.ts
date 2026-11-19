import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, banks, beneficiaries, campaigns, donations, ratings } from "@/db/schema";
import { RESOURCE_CONFIGS, type ResourceKey } from "@/lib/resources";

export type Payload = Record<string, string | number | boolean | Date | null>;

export function parsePayload(resource: ResourceKey, body: Record<string, unknown>, creating: boolean): Payload | { error: string } {
  const config = RESOURCE_CONFIGS[resource];
  const values: Payload = {};

  for (const field of config.fields) {
    if (!(field.key in body)) continue;
    let value = body[field.key];

    if (value === "" || value === null || value === undefined) {
      values[field.key] = field.type === "number" || field.type === "money" ? 0 : "";
      continue;
    }

    if (field.type === "number" || field.type === "money") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return { error: `${field.label} must be a number.` };
      values[field.key] = Math.round(numeric);
    } else if (field.type === "checkbox") {
      values[field.key] = value === true || value === "true" || value === "on";
    } else {
      values[field.key] = String(value).slice(0, 10000);
    }
  }

  if (fieldRateCheck(values)) return { error: "Rating must be between 1 and 5." };

  if (creating) {
    for (const field of config.fields) {
      if (!field.required) continue;
      const value = values[field.key];
      if (value === undefined || value === "" || value === null || (typeof value === "number" && value <= 0 && field.type === "money")) {
        return { error: `${field.label} is required.` };
      }
    }
  }

  return values;
}

function fieldRateCheck(values: Payload) {
  if ("rating" in values && typeof values.rating === "number" && (values.rating < 1 || values.rating > 5)) return true;
  return false;
}

export async function insertRow(resource: ResourceKey, values: Payload) {
  switch (resource) {
    case "donations":
      return (await db.insert(donations).values(values as unknown as typeof donations.$inferInsert).returning())[0];
    case "campaigns":
      return (await db.insert(campaigns).values(values as unknown as typeof campaigns.$inferInsert).returning())[0];
    case "beneficiaries":
      return (await db.insert(beneficiaries).values(values as unknown as typeof beneficiaries.$inferInsert).returning())[0];
    case "applications":
      return (await db.insert(applications).values(values as unknown as typeof applications.$inferInsert).returning())[0];
    case "banks":
      return (await db.insert(banks).values(values as unknown as typeof banks.$inferInsert).returning())[0];
    case "ratings":
      return (await db.insert(ratings).values(values as unknown as typeof ratings.$inferInsert).returning())[0];
  }
}

export async function updateRow(resource: ResourceKey, id: string, values: Payload) {
  switch (resource) {
    case "donations":
      return (await db.update(donations).set(values as unknown as typeof donations.$inferInsert).where(eq(donations.id, id)).returning())[0];
    case "campaigns":
      return (await db.update(campaigns).set(values as unknown as typeof campaigns.$inferInsert).where(eq(campaigns.id, id)).returning())[0];
    case "beneficiaries":
      return (await db.update(beneficiaries).set(values as unknown as typeof beneficiaries.$inferInsert).where(eq(beneficiaries.id, id)).returning())[0];
    case "applications": {
      if (values.status === "approved" || values.status === "rejected") values.reviewedAt = new Date();
      return (await db.update(applications).set(values as unknown as typeof applications.$inferInsert).where(eq(applications.id, id)).returning())[0];
    }
    case "banks":
      return (await db.update(banks).set(values as unknown as typeof banks.$inferInsert).where(eq(banks.id, id)).returning())[0];
    case "ratings":
      return (await db.update(ratings).set(values as unknown as typeof ratings.$inferInsert).where(eq(ratings.id, id)).returning())[0];
  }
}

export async function deleteRow(resource: ResourceKey, id: string) {
  switch (resource) {
    case "donations":
      await db.delete(donations).where(eq(donations.id, id));
      break;
    case "campaigns":
      await db.delete(campaigns).where(eq(campaigns.id, id));
      break;
    case "beneficiaries":
      await db.delete(beneficiaries).where(eq(beneficiaries.id, id));
      break;
    case "applications":
      await db.delete(applications).where(eq(applications.id, id));
      break;
    case "banks":
      await db.delete(banks).where(eq(banks.id, id));
      break;
    case "ratings":
      await db.delete(ratings).where(eq(ratings.id, id));
      break;
  }
}
