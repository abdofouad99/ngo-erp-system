export const dynamic = 'force-dynamic'

import { getGeoStructure, getSystemStats, getUsersList } from "@/app/actions/settings-actions"
import { getAllTagsAdmin } from "@/app/actions/tag-actions"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const [geoRes, statsRes, tagsRes, usersRes] = await Promise.all([
    getGeoStructure(),
    getSystemStats(),
    getAllTagsAdmin(),
    getUsersList(),
  ])

  const initialGeoStructure = geoRes.success ? (geoRes.governorates || []) : []
  const initialStats = statsRes.success ? (statsRes.stats || null) : null
  const initialTags = tagsRes.success ? (tagsRes.tags || []) : []
  const initialUsers = usersRes.success ? (usersRes.users || []) : []

  return (
    <SettingsClient
      initialGeoStructure={initialGeoStructure}
      initialStats={initialStats}
      initialTags={initialTags}
      initialUsers={initialUsers}
    />
  )
}
