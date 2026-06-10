import { prisma } from "./prisma"

/**
 * Calculates the difference between two objects, ignoring metadata fields.
 * Returns a JSON object containing the modified fields with their old and new values.
 */
export function diffObjects(oldObj: any, newObj: any): Record<string, { old: any; new: any }> {
  const diff: Record<string, { old: any; new: any }> = {}
  
  if (!oldObj || !newObj) return diff

  const ignoreFields = [
    "createdAt",
    "updatedAt",
    "createdById",
    "updatedById",
    "recordedById",
    "verifiedBy",
  ]

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))

  for (const key of allKeys) {
    if (ignoreFields.includes(key)) continue

    const oldVal = oldObj[key]
    const newVal = newObj[key]

    // Handle date object comparisons
    if (oldVal instanceof Date && newVal instanceof Date) {
      if (oldVal.getTime() !== newVal.getTime()) {
        diff[key] = { old: oldVal.toISOString(), new: newVal.toISOString() }
      }
      continue
    }

    // Skip nested objects and arrays for simplicity
    if (
      (oldVal !== null && typeof oldVal === "object") ||
      (newVal !== null && typeof newVal === "object")
    ) {
      continue
    }

    if (oldVal !== newVal) {
      diff[key] = {
        old: oldVal === undefined ? null : oldVal,
        new: newVal === undefined ? null : newVal,
      }
    }
  }

  return diff
}

/**
 * Helper to record an audit log entry in the database.
 */
export async function createAuditLog({
  entityType,
  entityId,
  action,
  changes,
  userId,
}: {
  entityType: string
  entityId: string
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE"
  changes: Record<string, { old: any; new: any }>
  userId?: string
}) {
  try {
    // Resolve admin fallback user if no userId is passed
    let actorId = userId
    if (!actorId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      })
      actorId = fallbackUser?.id
    }

    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        changes: JSON.stringify(changes),
        userId: actorId || null,
        userEmail: "admin@ngo-erp.org", // Mock email for audit trail
        userName: "مسؤول النظام",       // Mock name for audit trail
      },
    })
  } catch (error) {
    console.error("Error creating audit log:", error)
  }
}
