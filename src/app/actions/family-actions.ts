"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Gender, PovertyLevel } from "@prisma/client"
import { diffObjects, createAuditLog } from "@/lib/audit-utils"
import { createNotification } from "@/app/actions/notification-actions"
import { getCurrentUser } from "@/app/actions/auth-actions"

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const familySchema = z.object({
  headFullName: z.string().min(3, "الاسم الكامل لرب الأسرة مطلوب ويجب ألا يقل عن 3 أحرف"),
  headNationalId: z.string().min(5, "رقم الهوية الوطنية لرب الأسرة مطلوب ويجب ألا يقل عن 5 أحرف"),
  headGender: z.nativeEnum(Gender, { errorMap: () => ({ message: "يرجى اختيار جنس رب الأسرة" }) }),
  headPhoneNumber: z.string().optional().nullable().or(z.literal("")),
  headAltPhone: z.string().optional().nullable().or(z.literal("")),
  headBirthdate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable().transform((str) => (str ? new Date(str) : null))
  ),
  addressDetail: z.string().optional().nullable().or(z.literal("")),
  subDistrictId: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number({ required_error: "يرجى اختيار الحي/القرية السكنية" }).min(1, "يرجى اختيار الحي/القرية السكنية")
  ),
  vulnerabilityScore: z.preprocess(
    (val) => (val === "" || val === null ? 0 : Number(val)),
    z.number().min(0, "الدرجة لا تقل عن 0").max(100, "الدرجة لا تزيد عن 100").optional().default(0)
  ),
  notes: z.string().optional().nullable().or(z.literal("")),
  guardianName: z.string().optional().nullable().or(z.literal("")),
  guardianRelation: z.string().optional().nullable().or(z.literal("")),
  guardianPhone: z.string().optional().nullable().or(z.literal("")),
  familyMembersCount: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().min(1, "عدد أفراد الأسرة لا يقل عن 1").optional().nullable()
  ),
  monthlyIncome: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().min(0, "الدخل الشهري لا يقل عن 0").optional().nullable()
  ),
  housingType: z.string().optional().nullable().or(z.literal("")),
  housingCondition: z.string().optional().nullable().or(z.literal("")),
  povertyLevel: z.preprocess(
    (val) => (val === "" || val === null ? null : val),
    z.nativeEnum(PovertyLevel).optional().nullable()
  ),
  socialStatus: z.string().optional().nullable().or(z.literal("")),

  // New fields
  headLastName: z.string().optional().nullable().or(z.literal("")),
  headIdType: z.string().optional().nullable().or(z.literal("")),
  headIdIssueDate: z.string().optional().nullable().or(z.literal("")),
  headIdIssuePlace: z.string().optional().nullable().or(z.literal("")),
  headAge: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  headWhatsApp: z.string().optional().nullable().or(z.literal("")),
  headEducationLevel: z.string().optional().nullable().or(z.literal("")),
  headOccupation: z.string().optional().nullable().or(z.literal("")),

  spouseName: z.string().optional().nullable().or(z.literal("")),
  spouseIdNumber: z.string().optional().nullable().or(z.literal("")),
  spouseIdType: z.string().optional().nullable().or(z.literal("")),
  spouseBirthdate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable().transform((str) => (str ? new Date(str) : null))
  ),
  spouseAge: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  spouseEducationLevel: z.string().optional().nullable().or(z.literal("")),
  hasAnotherSpouse: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().nullable()
  ),

  manualMembersCount: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  manualMalesCount: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  manualFemalesCount: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  kidsUnder5Count: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  kids5To17Count: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  adults18To59Count: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  elderlyAbove60Count: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  specialNeedsCount: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  disabilityType: z.string().optional().nullable().or(z.literal("")),

  nearestLandmark: z.string().optional().nullable().or(z.literal("")),
  rentAmount: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().optional().nullable()
  ),
  waterSource: z.string().optional().nullable().or(z.literal("")),
  electricitySource: z.string().optional().nullable().or(z.literal("")),
  housingNotes: z.string().optional().nullable().or(z.literal("")),

  hasOrphans: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().nullable()
  ),
  orphansCount: z.preprocess(
    (val) => (val === "" || val === null ? 0 : Number(val)),
    z.number().optional().nullable()
  ),
  hasWidow: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().nullable()
  ),
  hasUnemployed: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().nullable()
  ),
  urgentNeeds: z.string().optional().nullable().or(z.literal("")),

  isDisplaced: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().nullable()
  ),
  displacementGov: z.string().optional().nullable().or(z.literal("")),
  displacementDist: z.string().optional().nullable().or(z.literal("")),
  displacementDate: z.string().optional().nullable().or(z.literal("")),
  displacementReason: z.string().optional().nullable().or(z.literal("")),

  receivedAidBefore: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().nullable()
  ),
  aidType: z.string().optional().nullable().or(z.literal("")),
  aidDonor: z.string().optional().nullable().or(z.literal("")),
  lastAidDate: z.string().optional().nullable().or(z.literal("")),

  deliveryMethod: z.string().optional().nullable().or(z.literal("")),
  kuraimiAccountYemeni: z.string().optional().nullable().or(z.literal("")),
  kuraimiAccountSaudi: z.string().optional().nullable().or(z.literal("")),

  referrerName: z.string().optional().nullable().or(z.literal("")),
  referrerRelation: z.string().optional().nullable().or(z.literal("")),
})

// =============================================================================
// SERVER ACTIONS
// =============================================================================

export async function createFamily(rawInput: any) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    // Validate inputs
    const validatedData = familySchema.parse(rawInput)

    // Check unique nationalId
    const existingFamily = await prisma.family.findFirst({
      where: { headNationalId: validatedData.headNationalId, deletedAt: null },
    })
    if (existingFamily) {
      return { success: false, error: "رقم الهوية الوطنية هذا لرب الأسرة مسجل بالفعل في النظام" }
    }

    // Get Admin user for audit log
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })
    if (!adminUser) {
      return { success: false, error: "فشل النظام في تحديد هوية المستخدم المسؤول عن الإدخال" }
    }

    // Create the family record
    const family = await prisma.family.create({
      data: {
        headFullName: validatedData.headFullName,
        headNationalId: validatedData.headNationalId,
        headGender: validatedData.headGender,
        headPhoneNumber: validatedData.headPhoneNumber || null,
        headAltPhone: validatedData.headAltPhone || null,
        headBirthdate: validatedData.headBirthdate,
        socialStatus: validatedData.socialStatus || null,
        addressDetail: validatedData.addressDetail || null,
        subDistrictId: validatedData.subDistrictId,
        vulnerabilityScore: validatedData.vulnerabilityScore,
        notes: validatedData.notes || null,
        guardianName: validatedData.guardianName || null,
        guardianRelation: validatedData.guardianRelation || null,
        guardianPhone: validatedData.guardianPhone || null,
        familyMembersCount: validatedData.familyMembersCount,
        monthlyIncome: validatedData.monthlyIncome,
        housingType: validatedData.housingType || null,
        housingCondition: validatedData.housingCondition || null,
        povertyLevel: validatedData.povertyLevel,
        isActive: true,
        createdById: adminUser.id,

        // New fields
        headLastName: validatedData.headLastName || null,
        headIdType: validatedData.headIdType || null,
        headIdIssueDate: validatedData.headIdIssueDate || null,
        headIdIssuePlace: validatedData.headIdIssuePlace || null,
        headAge: validatedData.headAge,
        headWhatsApp: validatedData.headWhatsApp || null,
        headEducationLevel: validatedData.headEducationLevel || null,
        headOccupation: validatedData.headOccupation || null,

        spouseName: validatedData.spouseName || null,
        spouseIdNumber: validatedData.spouseIdNumber || null,
        spouseIdType: validatedData.spouseIdType || null,
        spouseBirthdate: validatedData.spouseBirthdate,
        spouseAge: validatedData.spouseAge,
        spouseEducationLevel: validatedData.spouseEducationLevel || null,
        hasAnotherSpouse: validatedData.hasAnotherSpouse,

        manualMembersCount: validatedData.manualMembersCount,
        manualMalesCount: validatedData.manualMalesCount,
        manualFemalesCount: validatedData.manualFemalesCount,
        kidsUnder5Count: validatedData.kidsUnder5Count,
        kids5To17Count: validatedData.kids5To17Count,
        adults18To59Count: validatedData.adults18To59Count,
        elderlyAbove60Count: validatedData.elderlyAbove60Count,
        specialNeedsCount: validatedData.specialNeedsCount,
        disabilityType: validatedData.disabilityType || null,

        nearestLandmark: validatedData.nearestLandmark || null,
        rentAmount: validatedData.rentAmount,
        waterSource: validatedData.waterSource || null,
        electricitySource: validatedData.electricitySource || null,
        housingNotes: validatedData.housingNotes || null,

        hasOrphans: validatedData.hasOrphans,
        orphansCount: validatedData.orphansCount,
        hasWidow: validatedData.hasWidow,
        hasUnemployed: validatedData.hasUnemployed,
        urgentNeeds: validatedData.urgentNeeds || null,

        isDisplaced: validatedData.isDisplaced,
        displacementGov: validatedData.displacementGov || null,
        displacementDist: validatedData.displacementDist || null,
        displacementDate: validatedData.displacementDate || null,
        displacementReason: validatedData.displacementReason || null,

        receivedAidBefore: validatedData.receivedAidBefore,
        aidType: validatedData.aidType || null,
        aidDonor: validatedData.aidDonor || null,
        lastAidDate: validatedData.lastAidDate || null,

        deliveryMethod: validatedData.deliveryMethod || null,
        kuraimiAccountYemeni: validatedData.kuraimiAccountYemeni || null,
        kuraimiAccountSaudi: validatedData.kuraimiAccountSaudi || null,

        referrerName: validatedData.referrerName || null,
        referrerRelation: validatedData.referrerRelation || null,
      },
    })

    const members = rawInput.members || []
    if (members && members.length > 0) {
      for (const m of members) {
        await prisma.beneficiary.create({
          data: {
            fullName: m.fullName,
            gender: m.gender,
            birthdate: new Date(m.birthdate),
            relationshipToHead: m.relationshipToHead,
            category: "GENERAL",
            familyId: family.id,
            isActive: true,
          }
        })
      }
    }

    // Log the create event
    await createAuditLog({
      entityType: "FAMILY",
      entityId: family.id,
      action: "CREATE",
      changes: diffObjects({}, family),
      userId: adminUser.id,
    })

    await createNotification({
      title: "تسجيل أسرة جديدة",
      message: `تم تسجيل أسرة جديدة برئاسة رب الأسرة: ${family.headFullName}`,
      type: "SUCCESS"
    })

    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard/orphans")
    return { success: true, family }
  } catch (error: any) {
    console.error("Error creating family:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ بيانات الأسرة" }
  }
}

export async function updateFamily(id: string, rawInput: any) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    // Validate inputs
    const validatedData = familySchema.parse(rawInput)

    // Verify family exists
    const familyToUpdate = await prisma.family.findFirst({
      where: { id, deletedAt: null },
    })
    if (!familyToUpdate) {
      return { success: false, error: "الأسرة المطلوبة غير موجودة في النظام" }
    }

    // Verify nationalId is not taken by another family
    if (validatedData.headNationalId !== familyToUpdate.headNationalId) {
      const existingId = await prisma.family.findFirst({
        where: { headNationalId: validatedData.headNationalId, deletedAt: null },
      })
      if (existingId) {
        return { success: false, error: "رقم الهوية الوطنية الجديد لرب الأسرة مسجل بالفعل لأسرة أخرى" }
      }
    }

    // Get Admin user for audit
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    // Update family record
    const updatedFamily = await prisma.family.update({
      where: { id },
      data: {
        headFullName: validatedData.headFullName,
        headNationalId: validatedData.headNationalId,
        headGender: validatedData.headGender,
        headPhoneNumber: validatedData.headPhoneNumber || null,
        headAltPhone: validatedData.headAltPhone || null,
        headBirthdate: validatedData.headBirthdate,
        socialStatus: validatedData.socialStatus || null,
        addressDetail: validatedData.addressDetail || null,
        subDistrictId: validatedData.subDistrictId,
        vulnerabilityScore: validatedData.vulnerabilityScore,
        notes: validatedData.notes || null,
        guardianName: validatedData.guardianName || null,
        guardianRelation: validatedData.guardianRelation || null,
        guardianPhone: validatedData.guardianPhone || null,
        familyMembersCount: validatedData.familyMembersCount,
        monthlyIncome: validatedData.monthlyIncome,
        housingType: validatedData.housingType || null,
        housingCondition: validatedData.housingCondition || null,
        povertyLevel: validatedData.povertyLevel,
        updatedById: adminUser?.id || null,

        // New fields
        headLastName: validatedData.headLastName || null,
        headIdType: validatedData.headIdType || null,
        headIdIssueDate: validatedData.headIdIssueDate || null,
        headIdIssuePlace: validatedData.headIdIssuePlace || null,
        headAge: validatedData.headAge,
        headWhatsApp: validatedData.headWhatsApp || null,
        headEducationLevel: validatedData.headEducationLevel || null,
        headOccupation: validatedData.headOccupation || null,

        spouseName: validatedData.spouseName || null,
        spouseIdNumber: validatedData.spouseIdNumber || null,
        spouseIdType: validatedData.spouseIdType || null,
        spouseBirthdate: validatedData.spouseBirthdate,
        spouseAge: validatedData.spouseAge,
        spouseEducationLevel: validatedData.spouseEducationLevel || null,
        hasAnotherSpouse: validatedData.hasAnotherSpouse,

        manualMembersCount: validatedData.manualMembersCount,
        manualMalesCount: validatedData.manualMalesCount,
        manualFemalesCount: validatedData.manualFemalesCount,
        kidsUnder5Count: validatedData.kidsUnder5Count,
        kids5To17Count: validatedData.kids5To17Count,
        adults18To59Count: validatedData.adults18To59Count,
        elderlyAbove60Count: validatedData.elderlyAbove60Count,
        specialNeedsCount: validatedData.specialNeedsCount,
        disabilityType: validatedData.disabilityType || null,

        nearestLandmark: validatedData.nearestLandmark || null,
        rentAmount: validatedData.rentAmount,
        waterSource: validatedData.waterSource || null,
        electricitySource: validatedData.electricitySource || null,
        housingNotes: validatedData.housingNotes || null,

        hasOrphans: validatedData.hasOrphans,
        orphansCount: validatedData.orphansCount,
        hasWidow: validatedData.hasWidow,
        hasUnemployed: validatedData.hasUnemployed,
        urgentNeeds: validatedData.urgentNeeds || null,

        isDisplaced: validatedData.isDisplaced,
        displacementGov: validatedData.displacementGov || null,
        displacementDist: validatedData.displacementDist || null,
        displacementDate: validatedData.displacementDate || null,
        displacementReason: validatedData.displacementReason || null,

        receivedAidBefore: validatedData.receivedAidBefore,
        aidType: validatedData.aidType || null,
        aidDonor: validatedData.aidDonor || null,
        lastAidDate: validatedData.lastAidDate || null,

        deliveryMethod: validatedData.deliveryMethod || null,
        kuraimiAccountYemeni: validatedData.kuraimiAccountYemeni || null,
        kuraimiAccountSaudi: validatedData.kuraimiAccountSaudi || null,

        referrerName: validatedData.referrerName || null,
        referrerRelation: validatedData.referrerRelation || null,
      },
    })

    const members = rawInput.members || []
    const existingMemberIds = members.filter((m: any) => m.id).map((m: any) => m.id)
    await prisma.beneficiary.deleteMany({
      where: {
        familyId: id,
        id: { notIn: existingMemberIds }
      }
    })

    for (const m of members) {
      if (m.id) {
        await prisma.beneficiary.update({
          where: { id: m.id },
          data: {
            fullName: m.fullName,
            gender: m.gender,
            birthdate: new Date(m.birthdate),
            relationshipToHead: m.relationshipToHead,
          }
        })
      } else {
        await prisma.beneficiary.create({
          data: {
            fullName: m.fullName,
            gender: m.gender,
            birthdate: new Date(m.birthdate),
            relationshipToHead: m.relationshipToHead,
            category: "GENERAL",
            familyId: id,
            isActive: true,
          }
        })
      }
    }

    // Log the update event
    await createAuditLog({
      entityType: "FAMILY",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(familyToUpdate, updatedFamily),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard/orphans")
    return { success: true, family: updatedFamily }
  } catch (error: any) {
    console.error("Error updating family:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء تحديث بيانات الأسرة" }
  }
}

export async function toggleFamilyActive(id: string, isActive: boolean) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    const familyToUpdate = await prisma.family.findUnique({
      where: { id },
    })

    const updatedFamily = await prisma.family.update({
      where: { id },
      data: {
        isActive,
        updatedById: adminUser?.id || null,
      },
    })

    // Log update event
    await createAuditLog({
      entityType: "FAMILY",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(familyToUpdate, updatedFamily),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard/orphans")
    return { success: true }
  } catch (error: any) {
    console.error("Error toggling family active status:", error)
    return { success: false, error: "حدث خطأ أثناء تغيير حالة نشاط الأسرة" }
  }
}

export async function deleteFamily(id: string) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const familyToDelete = await prisma.family.findUnique({
      where: { id },
    })
    if (!familyToDelete) {
      return { success: false, error: "الأسرة المطلوبة غير موجودة في النظام" }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    const deletedFamily = await prisma.family.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedById: adminUser?.id || null,
      },
    })

    // Log delete event
    await createAuditLog({
      entityType: "FAMILY",
      entityId: id,
      action: "DELETE",
      changes: diffObjects(familyToDelete, deletedFamily),
      userId: adminUser?.id,
    })

    await createNotification({
      title: "حذف مؤقت لأسرة",
      message: `تم نقل الأسرة ${familyToDelete.headFullName} إلى سلة المهملات`,
      type: "WARNING"
    })

    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard/orphans")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting family:", error)
    return { success: false, error: "حدث خطأ أثناء حذف الأسرة" }
  }
}

export async function bulkImportFamilies(families: any[]) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })
    if (!adminUser) {
      return { success: false, error: "فشل النظام في تحديد هوية المستخدم المسؤول عن الإدخال" }
    }

    // Load geography in memory for fast lookup
    const allSubs = await prisma.subDistrict.findMany({
      include: {
        district: {
          include: {
            governorate: true
          }
        }
      }
    })

    const defaultSub = allSubs[0]
    if (!defaultSub) {
      return { success: false, error: "قاعدة البيانات فارغة من التقسيم الجغرافي. يرجى تهيئة التقسيم الجغرافي أولاً." }
    }

    let importedCount = 0
    let skippedCount = 0
    let skippedNationalIds: string[] = []

    for (const f of families) {
      if (!f.headFullName || !f.headNationalId) {
        skippedCount++
        continue
      }

      // Check unique nationalId
      const existing = await prisma.family.findFirst({
        where: { headNationalId: String(f.headNationalId).trim(), deletedAt: null },
      })
      if (existing) {
        skippedCount++
        skippedNationalIds.push(String(f.headNationalId).trim())
        continue
      }

      // Resolve subDistrict
      let subDistrictId = defaultSub.id
      if (f.subDistrictName) {
        const match = allSubs.find(
          sub => 
            sub.nameAr.trim() === String(f.subDistrictName).trim() ||
            sub.nameEn?.trim() === String(f.subDistrictName).trim()
        )
        if (match) {
          subDistrictId = match.id
        }
      }

      // Parse birthdates helper
      const parseDate = (dStr: any) => {
        if (!dStr) return null
        const d = new Date(dStr)
        return isNaN(d.getTime()) ? null : d
      }

      // Parse number helper
      const parseNum = (val: any) => {
        if (val === "" || val === null || val === undefined) return null
        const num = Number(val)
        return isNaN(num) ? null : num
      }

      // Parse boolean helper
      const parseBool = (val: any) => {
        if (val === true || val === "true" || val === "نعم" || val === 1 || val === "1") return true
        return false
      }

      await prisma.family.create({
        data: {
          headFullName: String(f.headFullName).trim(),
          headLastName: f.headLastName ? String(f.headLastName).trim() : null,
          headNationalId: String(f.headNationalId).trim(),
          headIdType: f.headIdType ? String(f.headIdType).trim() : null,
          headIdIssueDate: f.headIdIssueDate ? String(f.headIdIssueDate).trim() : null,
          headIdIssuePlace: f.headIdIssuePlace ? String(f.headIdIssuePlace).trim() : null,
          headBirthdate: parseDate(f.headBirthdate),
          headAge: parseNum(f.headAge),
          headGender: f.headGender === "FEMALE" || f.headGender === "أنثى" ? "FEMALE" : "MALE",
          socialStatus: f.socialStatus ? String(f.socialStatus).trim() : null,
          headPhoneNumber: f.headPhoneNumber ? String(f.headPhoneNumber).trim() : null,
          headAltPhone: f.headAltPhone ? String(f.headAltPhone).trim() : null,
          headWhatsApp: f.headWhatsApp ? String(f.headWhatsApp).trim() : null,
          headEducationLevel: f.headEducationLevel ? String(f.headEducationLevel).trim() : null,
          headOccupation: f.headOccupation ? String(f.headOccupation).trim() : null,
          
          spouseName: f.spouseName ? String(f.spouseName).trim() : null,
          spouseIdNumber: f.spouseIdNumber ? String(f.spouseIdNumber).trim() : null,
          spouseIdType: f.spouseIdType ? String(f.spouseIdType).trim() : null,
          spouseBirthdate: parseDate(f.spouseBirthdate),
          spouseAge: parseNum(f.spouseAge),
          spouseEducationLevel: f.spouseEducationLevel ? String(f.spouseEducationLevel).trim() : null,
          hasAnotherSpouse: parseBool(f.hasAnotherSpouse),
          
          manualMembersCount: parseNum(f.manualMembersCount),
          manualMalesCount: parseNum(f.manualMalesCount),
          manualFemalesCount: parseNum(f.manualFemalesCount),
          kidsUnder5Count: parseNum(f.kidsUnder5Count),
          kids5To17Count: parseNum(f.kids5To17Count),
          adults18To59Count: parseNum(f.adults18To59Count),
          elderlyAbove60Count: parseNum(f.elderlyAbove60Count),
          specialNeedsCount: parseNum(f.specialNeedsCount),
          disabilityType: f.disabilityType ? String(f.disabilityType).trim() : null,
          
          addressDetail: f.addressDetail ? String(f.addressDetail).trim() : null,
          subDistrictId,
          nearestLandmark: f.nearestLandmark ? String(f.nearestLandmark).trim() : null,
          
          housingType: f.housingType ? String(f.housingType).trim() : null,
          housingCondition: f.housingCondition ? String(f.housingCondition).trim() : null,
          rentAmount: parseNum(f.rentAmount),
          waterSource: f.waterSource ? String(f.waterSource).trim() : null,
          electricitySource: f.electricitySource ? String(f.electricitySource).trim() : null,
          housingNotes: f.housingNotes ? String(f.housingNotes).trim() : null,
          
          notes: f.notes ? String(f.notes).trim() : null,
          monthlyIncome: parseNum(f.monthlyIncome),
          hasOrphans: parseBool(f.hasOrphans),
          orphansCount: parseNum(f.orphansCount) || 0,
          hasWidow: parseBool(f.hasWidow),
          hasUnemployed: parseBool(f.hasUnemployed),
          urgentNeeds: f.urgentNeeds ? String(f.urgentNeeds).trim() : null,
          
          isDisplaced: parseBool(f.isDisplaced),
          displacementGov: f.displacementGov ? String(f.displacementGov).trim() : null,
          displacementDist: f.displacementDist ? String(f.displacementDist).trim() : null,
          displacementDate: f.displacementDate ? String(f.displacementDate).trim() : null,
          displacementReason: f.displacementReason ? String(f.displacementReason).trim() : null,
          
          receivedAidBefore: parseBool(f.receivedAidBefore),
          aidType: f.aidType ? String(f.aidType).trim() : null,
          aidDonor: f.aidDonor ? String(f.aidDonor).trim() : null,
          lastAidDate: f.lastAidDate ? String(f.lastAidDate).trim() : null,
          
          deliveryMethod: f.deliveryMethod ? String(f.deliveryMethod).trim() : null,
          kuraimiAccountYemeni: f.kuraimiAccountYemeni ? String(f.kuraimiAccountYemeni).trim() : null,
          kuraimiAccountSaudi: f.kuraimiAccountSaudi ? String(f.kuraimiAccountSaudi).trim() : null,
          
          referrerName: f.referrerName ? String(f.referrerName).trim() : null,
          referrerRelation: f.referrerRelation ? String(f.referrerRelation).trim() : null,
          
          createdById: adminUser.id,
          isActive: true,
        }
      })

      importedCount++
    }

    revalidatePath("/dashboard/families")
    return { 
      success: true, 
      importedCount, 
      skippedCount, 
      skippedNationalIds 
    }
  } catch (error: any) {
    console.error("Error bulk importing families:", error)
    return { success: false, error: "حدث خطأ غير متوقع أثناء استيراد بيانات الأسر" }
  }
}

export async function getFamilyAidHistory(familyId: string) {
  try {
    const aidHistory = await prisma.projectBeneficiary.findMany({
      where: {
        beneficiary: {
          familyId,
        },
        deletedAt: null,
      },
      include: {
        project: true,
        beneficiary: {
          select: {
            fullName: true,
            relationshipToHead: true,
          }
        }
      },
      orderBy: {
        deliveryDate: "desc",
      }
    })

    return { success: true, aidHistory }
  } catch (error) {
    console.error("Error getting family aid history:", error)
    return { success: false, error: "فشل في جلب سجل المساعدات المستلمة للأسرة" }
  }
}
