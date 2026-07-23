"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function scanDataQualityIssues() {
  try {
    const families = await prisma.family.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        headFullName: true,
        headNationalId: true,
        headPhoneNumber: true,
        headAltPhone: true,
        familyMembersCount: true,
        manualMembersCount: true,
        subDistrictId: true,
        addressDetail: true,
        createdAt: true,
      },
    })

    // 1. Find Duplicate National IDs & Duplicate Phone Numbers & Duplicate Names
    const duplicatesById: Record<string, any[]> = {}
    const duplicatesByPhone: Record<string, any[]> = {}
    const duplicatesByName: Record<string, any[]> = {}
    const incompleteFamilies: any[] = []

    for (const fam of families) {
      // Duplicates by National ID
      if (fam.headNationalId) {
        const key = fam.headNationalId.trim()
        if (!duplicatesById[key]) duplicatesById[key] = []
        duplicatesById[key].push(fam)
      }

      // Duplicates by Phone
      if (fam.headPhoneNumber && fam.headPhoneNumber.length > 5) {
        const key = fam.headPhoneNumber.trim()
        if (!duplicatesByPhone[key]) duplicatesByPhone[key] = []
        duplicatesByPhone[key].push(fam)
      }

      // Duplicates by Full Name
      if (fam.headFullName) {
        const key = fam.headFullName.trim()
        if (!duplicatesByName[key]) duplicatesByName[key] = []
        duplicatesByName[key].push(fam)
      }

      // Incomplete data check
      const isMissingPhone = !fam.headPhoneNumber
      const isMissingAddress = !fam.addressDetail
      const isMissingMembers = !fam.manualMembersCount && !fam.familyMembersCount

      if (isMissingPhone || isMissingAddress || isMissingMembers) {
        incompleteFamilies.push({
          family: fam,
          missingPhone: isMissingPhone,
          missingAddress: isMissingAddress,
          missingMembers: isMissingMembers,
        })
      }
    }

    // Filter duplicates with count > 1
    const duplicateIdGroups = Object.entries(duplicatesById)
      .filter(([_, list]) => list.length > 1)
      .map(([idVal, list]) => ({ type: "NATIONAL_ID", value: idVal, items: list }))

    const duplicatePhoneGroups = Object.entries(duplicatesByPhone)
      .filter(([_, list]) => list.length > 1)
      .map(([phoneVal, list]) => ({ type: "PHONE", value: phoneVal, items: list }))

    const duplicateNameGroups = Object.entries(duplicatesByName)
      .filter(([_, list]) => list.length > 1)
      .map(([nameVal, list]) => ({ type: "NAME", value: nameVal, items: list }))

    return {
      success: true,
      duplicateIdGroups,
      duplicatePhoneGroups,
      duplicateNameGroups,
      incompleteFamilies,
      totalDuplicatesCount: duplicateIdGroups.length + duplicatePhoneGroups.length + duplicateNameGroups.length,
      totalIncompleteCount: incompleteFamilies.length,
    }
  } catch (error: any) {
    console.error("scanDataQualityIssues error:", error)
    return {
      success: false,
      error: "فشل فحص جودة البيانات",
      duplicateIdGroups: [],
      duplicatePhoneGroups: [],
      duplicateNameGroups: [],
      incompleteFamilies: [],
      totalDuplicatesCount: 0,
      totalIncompleteCount: 0,
    }
  }
}

// Smart One-Click Merge of duplicate families into a primary family
export async function mergeDuplicateFamilies(primaryFamilyId: string, duplicateFamilyId: string) {
  try {
    if (!primaryFamilyId || !duplicateFamilyId || primaryFamilyId === duplicateFamilyId) {
      return { success: false, error: "المعرفات غير صحيحة" }
    }

    // 1. Move all orphans from duplicate to primary
    await prisma.beneficiary.updateMany({
      where: { familyId: duplicateFamilyId },
      data: { familyId: primaryFamilyId },
    })

    // 2. Move all patient records from duplicate to primary
    await prisma.patient.updateMany({
      where: { familyId: duplicateFamilyId },
      data: { familyId: primaryFamilyId },
    })

    // 4. Move attachments
    await prisma.attachment.updateMany({
      where: { familyId: duplicateFamilyId },
      data: { familyId: primaryFamilyId },
    })

    // 5. Soft-delete the duplicate family record
    await prisma.family.update({
      where: { id: duplicateFamilyId },
      data: {
        deletedAt: new Date(),
        notes: `تم دمجه تلقائياً مع السجل الرئيسي ID: ${primaryFamilyId}`,
      },
    })

    revalidatePath("/dashboard/data-quality")
    revalidatePath("/dashboard/families")

    return { success: true }
  } catch (error: any) {
    console.error("mergeDuplicateFamilies error:", error)
    return { success: false, error: "فشل عملية دمج الأسرتين المكررتين" }
  }
}
