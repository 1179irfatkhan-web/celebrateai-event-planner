import { PlannerWorkspace } from '@/components/planner-workspace'
import { getPlannerData } from '@/lib/planner-data'

export default async function BudgetPage() {
  return <PlannerWorkspace kind="Budget" data={await getPlannerData()} />
}
