"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "@/lib/audit-utils"
import { createNotification } from "@/app/actions/notification-actions"

export async function getDeletedRecords() {
  try {
    const [families, beneficiaries, sponsors, sponsorships, projects] = await Promise.all([
      prisma.family.findMany({ where: { NOT: { deletedAt: null } } }),
      prisma.beneficiary.findMany({ where: { NOT: { deletedAt: null } } }),
      prisma.sponsor.findMany({ where: { NOT: { deletedAt: null } } }),
      prisma.sponsorship.findMany({ where: { NOT: { deletedAt: null } } }),
      prisma.project.findMany({ where: { NOT: { deletedAt: null } } }),
    ])

    return {
      success: true,
      families,
      beneficiaries,
      sponsors,
      sponsorships,
      projects,
    }
  } catch (error: any) {
    console.error("Failed to fetch deleted records:", error)
    return {
      success: false,
      error: error.message,
      families: [],
      beneficiaries: [],
      sponsors: [],
      sponsorships: [],
      projects: [],
    }
  }
}

export async function restoreRecord(entityType: string, entityId: string) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    let restoredName = ""

    switch (entityType) {
      case "FAMILY":
        const fam = await prisma.family.update({
          where: { id: entityId },
          data: { deletedAt: null, isActive: true },
        })
        restoredName = fam.headFullName
        break
      case "BENEFICIARY":
        const ben = await prisma.beneficiary.update({
          where: { id: entityId },
          data: { deletedAt: null, isActive: true },
        })
        restoredName = ben.fullName
        break
      case "SPONSOR":
        const sp = await prisma.sponsor.update({
          where: { id: entityId },
          data: { deletedAt: null },
        })
        restoredName = sp.fullName
        break
      case "SPONSORSHIP":
        const sps = await prisma.sponsorship.update({
          where: { id: entityId },
          data: { deletedAt: null, status: "ACTIVE" },
        })
        restoredName = `كفالة بمبلغ ${sps.amount} ${sps.currency}`
        break
      case "PROJECT":
        const prj = await prisma.project.update({
          where: { id: entityId },
          data: { deletedAt: null, status: "ACTIVE" },
        })
        restoredName = prj.name
        break
      default:
        throw new Error("نوع الكيان غير صالح")
    }

    // Log the restore action
    await createAuditLog({
      entityType,
      entityId,
      action: "RESTORE",
      changes: {
        restored: { old: false, new: true },
        name: { old: null, new: restoredName },
      },
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/trash")
    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/sponsors")
    revalidatePath("/dashboard/projects")

    await createNotification({
      title: "استعادة سجل محذوف",
      message: `تمت استعادة سجل (${entityType}): ${restoredName} بنجاح من سلة المهملات.`,
      type: "SUCCESS"
    })

    return { success: true }
  } catch (error: any) {
    console.error("Failed to restore record:", error)
    return { success: false, error: error.message }
  }
}

export async function purgeRecord(entityType: string, entityId: string) {
  try {
    switch (entityType) {
      case "FAMILY":
        // Delete related beneficiaries, sponsorships, attachments first
        await prisma.beneficiary.deleteMany({ where: { familyId: entityId } })
        await prisma.sponsorship.deleteMany({ where: { familyId: entityId } })
        await prisma.attachment.deleteMany({ where: { familyId: entityId } })
        await prisma.family.delete({ where: { id: entityId } })
        break
      case "BENEFICIARY":
        await prisma.sponsorship.deleteMany({ where: { beneficiaryId: entityId } })
        await prisma.projectBeneficiary.deleteMany({ where: { beneficiaryId: entityId } })
        await prisma.attachment.deleteMany({ where: { beneficiaryId: entityId } })
        await prisma.beneficiary.delete({ where: { id: entityId } })
        break
      case "SPONSOR":
        await prisma.sponsorship.deleteMany({ where: { sponsorId: entityId } })
        await prisma.sponsor.delete({ where: { id: entityId } })
        break
      case "SPONSORSHIP":
        await prisma.paymentReceipt.deleteMany({ where: { sponsorshipId: entityId } })
        await prisma.sponsorship.delete({ where: { id: entityId } })
        break
      case "PROJECT":
        await prisma.projectBeneficiary.deleteMany({ where: { projectId: entityId } })
        await prisma.project.delete({ where: { id: entityId } })
        break
      default:
        throw new Error("نوع الكيان غير صالح")
    }

    revalidatePath("/dashboard/trash")

    return { success: true }
  } catch (error: any) {
    console.error("Failed to purge record:", error)
    return { success: false, error: error.message }
  }
}
