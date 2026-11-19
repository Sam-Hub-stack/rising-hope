import { ResourceManager } from "@/components/dashboard/resource-manager";
import { getResourceRows } from "@/lib/data";
import { RESOURCE_CONFIGS } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function DonationsPage() {
  const [rows, banks, campaigns, beneficiaries] = await Promise.all([
    getResourceRows("donations"), getResourceRows("banks"), getResourceRows("campaigns"), getResourceRows("beneficiaries"),
  ]);
  return (
    <ResourceManager
      config={RESOURCE_CONFIGS.donations}
      initialRows={rows}
      options={{
        banks: banks.map((row) => ({ id: String(row.id), label: String(row.name) })),
        campaigns: campaigns.map((row) => ({ id: String(row.id), label: String(row.title) })),
        beneficiaries: beneficiaries.map((row) => ({ id: String(row.id), label: String(row.name) })),
      }}
    />
  );
}
