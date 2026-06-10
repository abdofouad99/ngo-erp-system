"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Gender, PovertyLevel } from "@prisma/client"
import { diffObjects, createAuditLog } from "@/lib/audit-utils"
import { createNotification } from "@/app/actions/notification-actions"

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
})

// =============================================================================
// SERVER ACTIONS
// =============================================================================

export async function createFamily(rawInput: any) {
  try {
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
      },
    })

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
    return { success: true }
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
      },
    })

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
    return { success: true }
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
