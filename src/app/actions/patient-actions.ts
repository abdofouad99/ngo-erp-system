"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentUser } from "./auth-actions"

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const patientSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  nationalId: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE"]),
  birthdate: z.string().optional().nullable(),
  age: z.coerce.number().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  altPhone: z.string().optional().nullable(),
  familyMembersCount: z.coerce.number().optional().nullable(),
  subDistrictId: z.coerce.number({ required_error: "يجب اختيار المنطقة الجغرافية" }),
  addressDetail: z.string().optional().nullable(),
  village: z.string().optional().nullable(),
  familyId: z.string().optional().nullable(),

  // Medical
  diagnosis: z.string().min(2, "التشخيص مطلوب"),
  diseaseType: z.string().optional().nullable(),
  severity: z.enum(["CRITICAL", "SERIOUS", "MODERATE", "STABLE"]).default("STABLE"),
  hospital: z.string().optional().nullable(),
  doctor: z.string().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),

  // Support
  supportType: z.string().optional().nullable(),
  monthlyCost: z.coerce.number().optional().nullable(),
  totalSpent: z.coerce.number().optional().nullable(),
  fundingSource: z.string().optional().nullable(),

  // Status
  status: z.enum(["ACTIVE", "RECOVERED", "DECEASED", "SUSPENDED"]).default("ACTIVE"),
  notes: z.string().optional().nullable(),
})

// =============================================================================
// CREATE PATIENT
// =============================================================================

export async function createPatient(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, error: "غير مصرح لك بهذه العملية" }

    const raw = Object.fromEntries(formData.entries())

    const parsed = patientSchema.safeParse(raw)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => e.message).join("، ")
      return { success: false, error: errors }
    }

    const data = parsed.data

    await prisma.patient.create({
      data: {
        fullName: data.fullName,
        nationalId: data.nationalId || null,
        gender: data.gender,
        birthdate: data.birthdate ? new Date(data.birthdate) : null,
        age: data.age || null,
        phoneNumber: data.phoneNumber || null,
        altPhone: data.altPhone || null,
        familyMembersCount: data.familyMembersCount || null,
        subDistrictId: data.subDistrictId,
        addressDetail: data.addressDetail || null,
        village: data.village || null,
        familyId: data.familyId || null,
        diagnosis: data.diagnosis,
        diseaseType: data.diseaseType || null,
        severity: data.severity,
        hospital: data.hospital || null,
        doctor: data.doctor || null,
        medicalNotes: data.medicalNotes || null,
        supportType: data.supportType || null,
        monthlyCost: data.monthlyCost || null,
        totalSpent: data.totalSpent || null,
        fundingSource: data.fundingSource || null,
        status: data.status,
        notes: data.notes || null,
        createdById: currentUser.id,
      },
    })

    revalidatePath("/dashboard/patients")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating patient:", error)
    if (error?.code === "P2002") {
      return { success: false, error: "الرقم الوطني مسجل مسبقاً في النظام" }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ بيانات المريض" }
  }
}

// =============================================================================
// UPDATE PATIENT
// =============================================================================

export async function updatePatient(id: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return { success: false, error: "غير مصرح لك بهذه العملية" }

    const raw = Object.fromEntries(formData.entries())
    const parsed = patientSchema.safeParse(raw)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => e.message).join("، ")
      return { success: false, error: errors }
    }

    const data = parsed.data

    await prisma.patient.update({
      where: { id },
      data: {
        fullName: data.fullName,
        nationalId: data.nationalId || null,
        gender: data.gender,
        birthdate: data.birthdate ? new Date(data.birthdate) : null,
        age: data.age || null,
        phoneNumber: data.phoneNumber || null,
        altPhone: data.altPhone || null,
        familyMembersCount: data.familyMembersCount || null,
        subDistrictId: data.subDistrictId,
        addressDetail: data.addressDetail || null,
        village: data.village || null,
        familyId: data.familyId || null,
        diagnosis: data.diagnosis,
        diseaseType: data.diseaseType || null,
        severity: data.severity,
        hospital: data.hospital || null,
        doctor: data.doctor || null,
        medicalNotes: data.medicalNotes || null,
        supportType: data.supportType || null,
        monthlyCost: data.monthlyCost || null,
        totalSpent: data.totalSpent || null,
        fundingSource: data.fundingSource || null,
        status: data.status,
        notes: data.notes || null,
      },
    })

    revalidatePath("/dashboard/patients")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating patient:", error)
    if (error?.code === "P2002") {
      return { success: false, error: "الرقم الوطني مسجل لمريض آخر في النظام" }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء تحديث بيانات المريض" }
  }
}

// =============================================================================
// TOGGLE PATIENT ACTIVE STATUS
// =============================================================================

export async function togglePatientActive(id: string, isActive: boolean) {
  try {
    await prisma.patient.update({
      where: { id },
      data: { isActive: !isActive },
    })
    revalidatePath("/dashboard/patients")
    return { success: true }
  } catch (error) {
    console.error("Error toggling patient status:", error)
    return { success: false, error: "فشل في تغيير حالة المريض" }
  }
}

// =============================================================================
// DELETE PATIENT (SOFT DELETE)
// =============================================================================

export async function deletePatient(id: string) {
  try {
    await prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    revalidatePath("/dashboard/patients")
    return { success: true }
  } catch (error) {
    console.error("Error deleting patient:", error)
    return { success: false, error: "فشل في حذف ملف المريض" }
  }
}
