"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions/auth-actions"

/**
 * جلب سجل نشاط المستخدم الحالي
 */
export async function getMyActivityLog(limit = 100) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "غير مصرح", logs: [] }
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { userEmail: currentUser.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return {
      success: true,
      currentUser,
      logs: logs.map((log) => ({
        ...log,
        changes: (() => {
          try {
            return JSON.parse(log.changes || "{}")
          } catch {
            return {}
          }
        })(),
      })),
    }
  } catch (error: any) {
    console.error("getMyActivityLog error:", error)
    return { success: false, error: error.message, logs: [] }
  }
}
