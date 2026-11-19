import { ResourceManager } from "@/components/dashboard/resource-manager";
import { getResourceRows } from "@/lib/data";
import { RESOURCE_CONFIGS } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function BeneficiariesPage() {
  const [rows, campaigns] = await Promise.all([getResourceRows("beneficiaries"), getResourceRows("campaigns")]);
  return (
    <ResourceManager
      config={RESOURCE_CONFIGS.beneficiaries}
      initialRows={rows}
      options={{ campaigns: campaigns.map((row) => ({ id: String(row.id), label: String(row.title) })) }}
    />
  );
}
