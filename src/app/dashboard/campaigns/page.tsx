import { ResourceManager } from "@/components/dashboard/resource-manager";
import { getResourceRows } from "@/lib/data";
import { RESOURCE_CONFIGS } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const rows = await getResourceRows("campaigns");
  return <ResourceManager config={RESOURCE_CONFIGS.campaigns} initialRows={rows} options={{}} />;
}
