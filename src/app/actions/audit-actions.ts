"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getAuditLogsForEntity(entityType: string, entityId: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    
    return {
      success: true,
      logs: logs.map(log => ({
        ...log,
        changes: JSON.parse(log.changes || "{}")
      }))
    }
  } catch (error: any) {
    console.error("Failed to fetch audit logs:", error)
    return { success: false, error: error.message, logs: [] }
  }
}

export async function getGlobalAuditLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to last 100 entries for safety
    })

    return {
      success: true,
      logs: logs.map(log => ({
        ...log,
        changes: JSON.parse(log.changes || "{}")
      }))
    }
  } catch (error: any) {
    console.error("Failed to fetch global audit logs:", error)
    return { success: false, error: error.message, logs: [] }
  }
}
