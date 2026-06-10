"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAuditLog, diffObjects } from "@/lib/audit-utils"
import { createNotification } from "@/app/actions/notification-actions"
import { Gender, PovertyLevel, OrphanType, VerificationStatus, BeneficiaryCategory } from "@prisma/client"

export async function importFamiliesBulk(families: any[]) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })
    if (!adminUser) return { success: false, error: "فشل التعرف على مسؤول النظام" }

    // Fetch a fallback sub-district in case name is not found
    const firstSubDistrict = await prisma.subDistrict.findFirst()
    if (!firstSubDistrict) {
      return { success: false, error: "لا يوجد تقسيمات جغرافية مسجلة بالنظام. يرجى إعدادها في الإعدادات أولاً." }
    }

    let importedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const fam of families) {
      try {
        const name = fam.headFullName?.trim()
        const nationalId = fam.headNationalId?.trim()

        if (!name || !nationalId) {
          errors.push(`خطأ: الاسم والرقم الوطني مطلوبين لجميع السجلات.`)
          continue
        }

        // Check if nationalId already exists
        const existing = await prisma.family.findFirst({
          where: { headNationalId: nationalId, deletedAt: null }
        })
        if (existing) {
          skippedCount++
          continue
        }

        // Resolve Sub-district by name, or fall back
        let subDistrictId = firstSubDistrict.id
        if (fam.subDistrictName) {
          const sub = await prisma.subDistrict.findFirst({
            where: { nameAr: fam.subDistrictName.trim() }
          })
          if (sub) {
            subDistrictId = sub.id
          }
        }

        // Parse fields
        const gender = fam.headGender === "أنثى" || fam.headGender === "FEMALE" ? Gender.FEMALE : Gender.MALE
        let poverty: PovertyLevel | null = null
        if (fam.povertyLevel === "شديد" || fam.povertyLevel === "SEVERE") poverty = PovertyLevel.SEVERE
        else if (fam.povertyLevel === "متوسط" || fam.povertyLevel === "MEDIUM") poverty = PovertyLevel.MEDIUM
        else if (fam.povertyLevel === "منخفض" || fam.povertyLevel === "LOW") poverty = PovertyLevel.LOW

        const createdFamily = await prisma.family.create({
          data: {
            headFullName: name,
            headNationalId: nationalId,
            headGender: gender,
            headPhoneNumber: fam.headPhoneNumber || null,
            headAltPhone: fam.headAltPhone || null,
            headBirthdate: fam.headBirthdate ? new Date(fam.headBirthdate) : null,
            addressDetail: fam.addressDetail || null,
            subDistrictId: subDistrictId,
            vulnerabilityScore: fam.vulnerabilityScore ? Number(fam.vulnerabilityScore) : 0,
            notes: fam.notes || null,
            guardianName: fam.guardianName || null,
            guardianRelation: fam.guardianRelation || null,
            guardianPhone: fam.guardianPhone || null,
            familyMembersCount: fam.familyMembersCount ? Number(fam.familyMembersCount) : null,
            monthlyIncome: fam.monthlyIncome ? Number(fam.monthlyIncome) : null,
            housingType: fam.housingType || null,
            housingCondition: fam.housingCondition || null,
            povertyLevel: poverty,
            isActive: true,
            createdById: adminUser.id,
          }
        })

        // Log audit
        await createAuditLog({
          entityType: "FAMILY",
          entityId: createdFamily.id,
          action: "CREATE",
          changes: diffObjects({}, createdFamily),
          userId: adminUser.id
        })

        importedCount++
      } catch (err: any) {
        errors.push(`فشل استيراد الأسرة (${fam.headFullName}): ${err.message}`)
      }
    }

    if (importedCount > 0) {
      await createNotification({
        title: "استيراد أسر مجمع",
        message: `تم استيراد ${importedCount} أسرة جديدة بنجاح، وتم تخطي ${skippedCount} أسر مسجلة مسبقاً.`,
        type: "SUCCESS"
      })
    }

    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard")

    return { success: true, importedCount, skippedCount, errors }
  } catch (error: any) {
    console.error("Failed bulk import families:", error)
    return { success: false, error: error.message }
  }
}

export async function importOrphansBulk(orphans: any[]) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })
    if (!adminUser) return { success: false, error: "فشل التعرف على مسؤول النظام" }

    let importedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const orphan of orphans) {
      try {
        const name = orphan.fullName?.trim()
        const birthdate = orphan.birthdate
        const familyNationalId = orphan.familyNationalId?.trim()

        if (!name || !birthdate || !familyNationalId) {
          errors.push(`خطأ: الاسم وتاريخ الميلاد والرقم الوطني لرب الأسرة مطلوبين للطفل: ${name || "مجهول"}`)
          continue
        }

        // Find parent family by national id
        const family = await prisma.family.findFirst({
          where: { headNationalId: familyNationalId, deletedAt: null }
        })
        if (!family) {
          errors.push(`خطأ: لم يتم العثور على الأسرة المطابقة للرقم الوطني (${familyNationalId}) في النظام لليتيم: ${name}`)
          continue
        }

        // Check if orphan already exists by nationalId or orphanCode
        if (orphan.nationalId) {
          const dupId = await prisma.beneficiary.findFirst({
            where: { nationalId: orphan.nationalId, familyId: family.id, deletedAt: null }
          })
          if (dupId) {
            skippedCount++
            continue
          }
        }

        if (orphan.orphanCode) {
          const dupCode = await prisma.beneficiary.findFirst({
            where: { orphanCode: orphan.orphanCode, deletedAt: null }
          })
          if (dupCode) {
            skippedCount++
            continue
          }
        }

        // Parse fields
        const gender = orphan.gender === "أنثى" || orphan.gender === "FEMALE" ? Gender.FEMALE : Gender.MALE
        let orphanType: OrphanType | null = null
        if (orphan.orphanType === "أب" || orphan.orphanType === "FATHER") orphanType = OrphanType.FATHER
        else if (orphan.orphanType === "أم" || orphan.orphanType === "MOTHER") orphanType = OrphanType.MOTHER
        else if (orphan.orphanType === "كلاهما" || orphan.orphanType === "BOTH") orphanType = OrphanType.BOTH

        const createdOrphan = await prisma.beneficiary.create({
          data: {
            fullName: name,
            gender,
            birthdate: new Date(birthdate),
            nationalId: orphan.nationalId || null,
            category: BeneficiaryCategory.ORPHAN,
            orphanCode: orphan.orphanCode || null,
            kuraimiAccount: orphan.kuraimiAccount || null,
            educationLevel: orphan.educationLevel || null,
            schoolName: orphan.schoolName || null,
            educationalStage: orphan.educationalStage || null,
            averageGrade: orphan.averageGrade ? Number(orphan.averageGrade) : null,
            educationalNeeds: orphan.educationalNeeds || null,
            healthStatus: orphan.healthStatus || null,
            disabilityType: orphan.disabilityType || null,
            disability: orphan.disability === "نعم" || orphan.disability === "true" || orphan.disability === true,
            disabilityDetails: orphan.disabilityDetails || null,
            orphanType,
            fatherDeathDate: orphan.fatherDeathDate ? new Date(orphan.fatherDeathDate) : null,
            fatherDeathCause: orphan.fatherDeathCause || null,
            motherDeathDate: orphan.motherDeathDate ? new Date(orphan.motherDeathDate) : null,
            motherName: orphan.motherName || null,
            verificationStatus: VerificationStatus.PENDING,
            isActive: true,
            notes: orphan.notes || null,
            familyId: family.id,
          }
        })

        // Log audit
        await createAuditLog({
          entityType: "BENEFICIARY",
          entityId: createdOrphan.id,
          action: "CREATE",
          changes: diffObjects({}, createdOrphan),
          userId: adminUser.id
        })

        importedCount++
      } catch (err: any) {
        errors.push(`فشل استيراد اليتيم (${orphan.fullName}): ${err.message}`)
      }
    }

    if (importedCount > 0) {
      await createNotification({
        title: "استيراد أيتام مجمع",
        message: `تم استيراد ${importedCount} يتيم جديد بنجاح، وتخطي ${skippedCount} مسجلين مسبقاً.`,
        type: "SUCCESS"
      })
    }

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard")

    return { success: true, importedCount, skippedCount, errors }
  } catch (error: any) {
    console.error("Failed bulk import orphans:", error)
    return { success: false, error: error.message }
  }
}
