"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/app/actions/auth-actions"

export async function createCaseActivity(data: {
  type: string
  title: string
  description: string
  familyId?: string | null
  beneficiaryId?: string | null
}) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    // Resolve mock recordedBy details for simulation
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const activity = await prisma.caseActivity.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        familyId: data.familyId || null,
        beneficiaryId: data.beneficiaryId || null,
        recordedById: adminUser?.id || null,
        recordedByName: adminUser?.name || "مسؤول الزيارات الميدانية",
      },
    })

    if (data.familyId) revalidatePath(`/dashboard/families`)
    if (data.beneficiaryId) revalidatePath(`/dashboard/orphans`)

    return { success: true, activity }
  } catch (error: any) {
    console.error("Failed to create case activity:", error)
    return { success: false, error: error.message }
  }
}

export async function getCaseActivitiesForEntity({
  familyId,
  beneficiaryId,
}: {
  familyId?: string | null
  beneficiaryId?: string | null
}) {
  try {
    const activities = await prisma.caseActivity.findMany({
      where: {
        OR: [
          ...(familyId ? [{ familyId }] : []),
          ...(beneficiaryId ? [{ beneficiaryId }] : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, activities }
  } catch (error: any) {
    console.error("Failed to fetch case activities:", error)
    return { success: false, error: error.message, activities: [] }
  }
}

export async function deleteCaseActivity(id: string, path?: string) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    await prisma.caseActivity.delete({
      where: { id },
    })

    if (path) revalidatePath(path)

    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete case activity:", error)
    return { success: false, error: error.message }
  }
}
