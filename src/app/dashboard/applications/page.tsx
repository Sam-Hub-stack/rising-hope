import { ResourceManager } from "@/components/dashboard/resource-manager";
import { getResourceRows } from "@/lib/data";
import { RESOURCE_CONFIGS } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const rows = await getResourceRows("applications");
  return <ResourceManager config={RESOURCE_CONFIGS.applications} initialRows={rows} options={{}} />;
}
