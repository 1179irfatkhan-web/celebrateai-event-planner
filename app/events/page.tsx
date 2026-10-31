import { PlannerWorkspace } from '@/components/planner-workspace'
import { getPlannerData } from '@/lib/planner-data'

export default async function EventsPage() {
  return <PlannerWorkspace kind="Events" data={await getPlannerData()} />
}
