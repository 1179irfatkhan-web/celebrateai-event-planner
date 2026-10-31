import { PlannerWorkspace } from '@/components/planner-workspace'
import { getPlannerData } from '@/lib/planner-data'

export default async function TimelinePage() {
  return <PlannerWorkspace kind="Timeline" data={await getPlannerData()} />
}
