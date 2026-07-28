export const dynamic = 'force-dynamic'

import { getKanbanData } from "@/app/actions/kanban-actions"
import { KanbanClient } from "./kanban-client"

export default async function KanbanPage() {
  const result = await getKanbanData()
  const initialOrphans = result.success ? (result.orphans || []) : []

  return <KanbanClient initialOrphans={initialOrphans} />
}
