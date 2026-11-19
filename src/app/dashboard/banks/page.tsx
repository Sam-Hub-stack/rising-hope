import { ResourceManager } from "@/components/dashboard/resource-manager";
import { getResourceRows } from "@/lib/data";
import { RESOURCE_CONFIGS } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function BanksPage() {
  const rows = await getResourceRows("banks");
  return <ResourceManager config={RESOURCE_CONFIGS.banks} initialRows={rows} options={{}} />;
}
