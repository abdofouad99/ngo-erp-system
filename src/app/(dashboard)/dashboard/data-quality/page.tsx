export const dynamic = 'force-dynamic'

import { scanDataQualityIssues } from "@/app/actions/data-quality-actions"
import { DataQualityClient } from "./data-quality-client"

export default async function DataQualityPage() {
  const initialData = await scanDataQualityIssues()
  return <DataQualityClient initialData={initialData} />
}
