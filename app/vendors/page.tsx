import { PlannerWorkspace } from '@/components/planner-workspace'
import { getPlannerData } from '@/lib/planner-data'

export default async function VendorsPage() {
  return <PlannerWorkspace kind="Vendors" data={await getPlannerData()} />
}
