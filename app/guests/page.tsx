import { PlannerWorkspace } from '@/components/planner-workspace'
import { getPlannerData } from '@/lib/planner-data'

export default async function GuestsPage() {
  return <PlannerWorkspace kind="Guests" data={await getPlannerData()} />
}
