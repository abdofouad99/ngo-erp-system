"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Currency, PaymentCycle, SponsorshipStatus } from "@prisma/client"
import { diffObjects, createAuditLog } from "@/lib/audit-utils"
import { getCurrentUser } from "@/app/actions/auth-actions"

// =============================================================================
// SPONSOR VALIDATION SCHEMA
// =============================================================================

const sponsorSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل للكفيل مطلوب ويجب ألا يقل عن 3 أحرف"),
  organization: z.string().optional().nullable().or(z.literal("")),
  nationalId: z.string().optional().nullable().or(z.literal("")),
  email: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().email("البريد الإلكتروني غير صالح").optional().nullable()
  ),
  phone: z.string().optional().nullable().or(z.literal("")),
  country: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
})

// =============================================================================
// SPONSORSHIP VALIDATION SCHEMA
// =============================================================================

const sponsorshipSchema = z.object({
  sponsorId: z.string().min(1, "يرجى اختيار الكفيل المسؤول"),
  targetType: z.enum(["ORPHAN", "FAMILY"], { errorMap: () => ({ message: "يرجى تحديد نوع الكفالة" }) }),
  targetId: z.string().min(1, "يرجى تحديد المستفيد المستهدف"),
  amount: z.preprocess(
    (val) => (val === "" || val === null ? 0 : Number(val)),
    z.number().min(1, "قيمة الكفالة يجب أن تكون أكبر من 0")
  ),
  currency: z.nativeEnum(Currency, { errorMap: () => ({ message: "يرجى اختيار العملة" }) }),
  paymentCycle: z.nativeEnum(PaymentCycle, { errorMap: () => ({ message: "يرجى اختيار دورة الدفع" }) }),
  status: z.nativeEnum(SponsorshipStatus).default(SponsorshipStatus.ACTIVE),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable().transform((str) => (str ? new Date(str) : null))
  ),
  sponsorshipNotes: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
})

// =============================================================================
// SPONSOR ACTIONS
// =============================================================================

export async function createSponsor(rawInput: any) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const validatedData = sponsorSchema.parse(rawInput)

    // Check unique email if provided
    if (validatedData.email) {
      const existingEmail = await prisma.sponsor.findFirst({
        where: { email: validatedData.email, deletedAt: null },
      })
      if (existingEmail) {
        return { success: false, error: "البريد الإلكتروني هذا مسجل بالفعل لكفيل آخر" }
      }
    }

    // Check unique nationalId if provided
    if (validatedData.nationalId) {
      const existingNationalId = await prisma.sponsor.findFirst({
        where: { nationalId: validatedData.nationalId, deletedAt: null },
      })
      if (existingNationalId) {
        return { success: false, error: "رقم الهوية الوطنية هذا مسجل بالفعل لكفيل آخر" }
      }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const sponsor = await prisma.sponsor.create({
      data: {
        fullName: validatedData.fullName,
        organization: validatedData.organization || null,
        nationalId: validatedData.nationalId || null,
        email: validatedData.email,
        phone: validatedData.phone || null,
        country: validatedData.country || null,
        notes: validatedData.notes || null,
      },
    })

    // Log create event
    await createAuditLog({
      entityType: "SPONSOR",
      entityId: sponsor.id,
      action: "CREATE",
      changes: diffObjects({}, sponsor),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/sponsors")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating sponsor:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ بيانات الكفيل" }
  }
}

export async function updateSponsor(id: string, rawInput: any) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const validatedData = sponsorSchema.parse(rawInput)

    const sponsorToUpdate = await prisma.sponsor.findFirst({
      where: { id, deletedAt: null },
    })
    if (!sponsorToUpdate) {
      return { success: false, error: "الكفيل المطلوب غير موجود بالنظام" }
    }

    // Check unique email
    if (validatedData.email && validatedData.email !== sponsorToUpdate.email) {
      const existingEmail = await prisma.sponsor.findFirst({
        where: { email: validatedData.email, deletedAt: null },
      })
      if (existingEmail) {
        return { success: false, error: "البريد الإلكتروني الجديد مسجل بالفعل لكفيل آخر" }
      }
    }

    // Check unique nationalId
    if (validatedData.nationalId && validatedData.nationalId !== sponsorToUpdate.nationalId) {
      const existingNationalId = await prisma.sponsor.findFirst({
        where: { nationalId: validatedData.nationalId, deletedAt: null },
      })
      if (existingNationalId) {
        return { success: false, error: "رقم الهوية الوطنية الجديد مسجل بالفعل لكفيل آخر" }
      }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const updatedSponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        fullName: validatedData.fullName,
        organization: validatedData.organization || null,
        nationalId: validatedData.nationalId || null,
        email: validatedData.email,
        phone: validatedData.phone || null,
        country: validatedData.country || null,
        notes: validatedData.notes || null,
      },
    })

    // Log update event
    await createAuditLog({
      entityType: "SPONSOR",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(sponsorToUpdate, updatedSponsor),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/sponsors")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating sponsor:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء تحديث بيانات الكفيل" }
  }
}

export async function deleteSponsor(id: string) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const sponsorToDelete = await prisma.sponsor.findFirst({
      where: { id, deletedAt: null },
    })
    if (!sponsorToDelete) {
      return { success: false, error: "الكفيل المطلوب غير موجود بالنظام" }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const deletedSponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    // Log delete event
    await createAuditLog({
      entityType: "SPONSOR",
      entityId: id,
      action: "DELETE",
      changes: diffObjects(sponsorToDelete, deletedSponsor),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/sponsors")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting sponsor:", error)
    return { success: false, error: "حدث خطأ أثناء حذف الكفيل" }
  }
}

// =============================================================================
// SPONSORSHIP ACTIONS
// =============================================================================

export async function createSponsorship(rawInput: any) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const validatedData = sponsorshipSchema.parse(rawInput)

    // Check sponsor exists
    const sponsorExists = await prisma.sponsor.findFirst({
      where: { id: validatedData.sponsorId, deletedAt: null },
    })
    if (!sponsorExists) {
      return { success: false, error: "الكفيل المحدد غير موجود بالنظام" }
    }

    // Prepare polymorphic targets
    let beneficiaryId: string | null = null
    let familyId: string | null = null

    if (validatedData.targetType === "ORPHAN") {
      beneficiaryId = validatedData.targetId
      // Verify beneficiary exists
      const beneficiaryExists = await prisma.beneficiary.findFirst({
        where: { id: beneficiaryId, deletedAt: null },
      })
      if (!beneficiaryExists) {
        return { success: false, error: "اليتيم المحدد غير موجود بالنظام" }
      }
    } else {
      familyId = validatedData.targetId
      // Verify family exists
      const familyExists = await prisma.family.findFirst({
        where: { id: familyId, deletedAt: null },
      })
      if (!familyExists) {
        return { success: false, error: "الأسرة المحددة غير موجودة بالنظام" }
      }
    }

    // Get Admin user for audit (required relation in schema)
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })
    if (!adminUser) {
      return { success: false, error: "فشل النظام في تحديد هوية المستخدم المسؤول عن الإدخال" }
    }

    // Create the sponsorship
    const sponsorship = await prisma.sponsorship.create({
      data: {
        sponsorId: validatedData.sponsorId,
        beneficiaryId,
        familyId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        paymentCycle: validatedData.paymentCycle,
        status: validatedData.status,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        sponsorshipNotes: validatedData.sponsorshipNotes || null,
        notes: validatedData.notes || null,
        createdById: adminUser.id,
      },
    })

    // Log create event
    await createAuditLog({
      entityType: "SPONSORSHIP",
      entityId: sponsorship.id,
      action: "CREATE",
      changes: diffObjects({}, sponsorship),
      userId: adminUser.id,
    })

    revalidatePath("/dashboard/sponsors")
    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating sponsorship:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ بيانات الكفالة" }
  }
}

export async function updateSponsorshipStatus(id: string, status: SponsorshipStatus) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const sponsorshipToUpdate = await prisma.sponsorship.findUnique({
      where: { id },
    })

    const updatedSponsorship = await prisma.sponsorship.update({
      where: { id },
      data: { status },
    })

    // Log update event
    await createAuditLog({
      entityType: "SPONSORSHIP",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(sponsorshipToUpdate, updatedSponsorship),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/sponsors")
    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating sponsorship status:", error)
    return { success: false, error: "حدث خطأ أثناء تعديل حالة الكفالة" }
  }
}

export async function deleteSponsorship(id: string) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const sponsorshipToDelete = await prisma.sponsorship.findUnique({
      where: { id },
    })
    if (!sponsorshipToDelete) {
      return { success: false, error: "الكفالة المطلوبة غير موجودة في النظام" }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const deletedSponsorship = await prisma.sponsorship.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "STOPPED",
      },
    })

    // Log delete event
    await createAuditLog({
      entityType: "SPONSORSHIP",
      entityId: id,
      action: "DELETE",
      changes: diffObjects(sponsorshipToDelete, deletedSponsorship),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/sponsors")
    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting sponsorship:", error)
    return { success: false, error: "حدث خطأ أثناء حذف الكفالة من النظام" }
  }
}
