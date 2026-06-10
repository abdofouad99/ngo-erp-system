"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAuditLog, diffObjects } from "@/lib/audit-utils"
import { createNotification } from "@/app/actions/notification-actions"

export async function getKanbanData() {
  try {
    const orphans = await prisma.beneficiary.findMany({
      where: {
        category: "ORPHAN",
        deletedAt: null
      },
      include: {
        sponsorships: {
          where: {
            deletedAt: null,
            status: "ACTIVE"
          },
          include: {
            sponsor: true
          }
        },
        family: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
    return { success: true, orphans }
  } catch (error: any) {
    console.error("Failed to fetch Kanban data:", error)
    return { success: false, error: error.message, orphans: [] }
  }
}

export async function updateOrphanVerificationStatus(id: string, status: "PENDING" | "APPROVED" | "REJECTED") {
  try {
    const oldOrphan = await prisma.beneficiary.findUnique({
      where: { id }
    })
    if (!oldOrphan) return { success: false, error: "اليتيم غير موجود" }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })

    const updatedOrphan = await prisma.beneficiary.update({
      where: { id },
      data: {
        verificationStatus: status
      }
    })

    await createAuditLog({
      entityType: "BENEFICIARY",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(oldOrphan, updatedOrphan),
      userId: adminUser?.id
    })

    const statusNames = {
      PENDING: "قيد التحقق والمراجعة",
      APPROVED: "معتمد وبانتظار الكفالة",
      REJECTED: "مرفوض / معلق"
    }

    await createNotification({
      title: "تحديث حالة يتيم",
      message: `تم تغيير حالة اليتيم ${updatedOrphan.fullName} إلى: ${statusNames[status]}`,
      type: status === "APPROVED" ? "SUCCESS" : status === "REJECTED" ? "ALERT" : "INFO"
    })

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard/kanban")

    return { success: true }
  } catch (error: any) {
    console.error("Failed to update orphan status:", error)
    return { success: false, error: error.message }
  }
}
