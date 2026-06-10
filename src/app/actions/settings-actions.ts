"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/app/actions/notification-actions"

export async function getGeoStructure() {
  try {
    const governorates = await prisma.governorate.findMany({
      include: {
        districts: {
          include: {
            subDistricts: true
          },
          orderBy: {
            nameAr: "asc"
          }
        }
      },
      orderBy: {
        nameAr: "asc"
      }
    })
    return { success: true, governorates }
  } catch (error: any) {
    console.error("Failed to fetch geo structure:", error)
    return { success: false, error: error.message, governorates: [] }
  }
}

export async function createGovernorate(data: { nameAr: string; nameEn?: string }) {
  try {
    const existing = await prisma.governorate.findFirst({
      where: { nameAr: data.nameAr }
    })
    if (existing) return { success: false, error: "المحافظة مسجلة بالفعل" }

    const gov = await prisma.governorate.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn || null
      }
    })

    await createNotification({
      title: "إضافة نطاق جغرافي",
      message: `تمت إضافة محافظة جديدة بالنظام: ${gov.nameAr}`,
      type: "INFO"
    })

    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard/families")

    return { success: true, governorate: gov }
  } catch (error: any) {
    console.error("Failed to create governorate:", error)
    return { success: false, error: error.message }
  }
}

export async function createDistrict(data: { nameAr: string; nameEn?: string; governorateId: number }) {
  try {
    const existing = await prisma.district.findFirst({
      where: { nameAr: data.nameAr, governorateId: data.governorateId }
    })
    if (existing) return { success: false, error: "المديرية مسجلة بالفعل في هذه المحافظة" }

    const dist = await prisma.district.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn || null,
        governorateId: data.governorateId
      }
    })

    await createNotification({
      title: "إضافة نطاق جغرافي",
      message: `تمت إضافة مديرية جديدة: ${dist.nameAr}`,
      type: "INFO"
    })

    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard/families")

    return { success: true, district: dist }
  } catch (error: any) {
    console.error("Failed to create district:", error)
    return { success: false, error: error.message }
  }
}

export async function createSubDistrict(data: { nameAr: string; nameEn?: string; districtId: number }) {
  try {
    const existing = await prisma.subDistrict.findFirst({
      where: { nameAr: data.nameAr, districtId: data.districtId }
    })
    if (existing) return { success: false, error: "العزلة/الحي مسجلة بالفعل في هذه المديرية" }

    const sub = await prisma.subDistrict.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn || null,
        districtId: data.districtId
      }
    })

    await createNotification({
      title: "إضافة نطاق جغرافي",
      message: `تمت إضافة عزلة/حي جديدة: ${sub.nameAr}`,
      type: "INFO"
    })

    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard/families")

    return { success: true, subDistrict: sub }
  } catch (error: any) {
    console.error("Failed to create sub-district:", error)
    return { success: false, error: error.message }
  }
}

export async function getSystemStats() {
  try {
    const [
      users,
      govs,
      dists,
      subs,
      families,
      orphans,
      projects,
      sponsors,
      sponsorships,
      receipts,
      auditLogs,
      caseActivities
    ] = await Promise.all([
      prisma.user.count(),
      prisma.governorate.count(),
      prisma.district.count(),
      prisma.subDistrict.count(),
      prisma.family.count({ where: { deletedAt: null } }),
      prisma.beneficiary.count({ where: { category: "ORPHAN", deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.sponsor.count({ where: { deletedAt: null } }),
      prisma.sponsorship.count({ where: { deletedAt: null } }),
      prisma.paymentReceipt.count(),
      prisma.auditLog.count(),
      prisma.caseActivity.count()
    ])

    return {
      success: true,
      stats: {
        users,
        govs,
        dists,
        subs,
        families,
        orphans,
        projects,
        sponsors,
        sponsorships,
        receipts,
        auditLogs,
        caseActivities
      }
    }
  } catch (error: any) {
    console.error("Failed to compile system stats:", error)
    return { success: false, error: error.message }
  }
}
