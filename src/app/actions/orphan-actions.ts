"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Gender, OrphanType, VerificationStatus, BeneficiaryCategory } from "@prisma/client"
import { diffObjects, createAuditLog } from "@/lib/audit-utils"
import { createNotification } from "@/app/actions/notification-actions"
import { sendWhatsAppNotification } from "@/lib/whatsapp-notify"


// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const orphanSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب ويجب ألا يقل عن 3 أحرف"),
  gender: z.nativeEnum(Gender, { errorMap: () => ({ message: "الجنس مطلوب" }) }),
  birthdate: z.string().transform((str) => new Date(str)),
  nationalId: z.string().optional().nullable().or(z.literal("")),
  familyId: z.string().min(1, "يرجى اختيار الأسرة التابع لها اليتيم"),
  orphanCode: z.string().optional().nullable().or(z.literal("")),
  kuraimiAccount: z.string().optional().nullable().or(z.literal("")),
  educationLevel: z.string().optional().nullable().or(z.literal("")),
  schoolName: z.string().optional().nullable().or(z.literal("")),
  educationalStage: z.string().optional().nullable().or(z.literal("")),
  averageGrade: z
    .preprocess((val) => (val === "" ? null : val), z.coerce.number().min(0, "المعدل لا يقل عن 0").max(100, "المعدل لا يزيد عن 100").optional().nullable()),
  educationalNeeds: z.string().optional().nullable().or(z.literal("")),
  healthStatus: z.string().optional().nullable().or(z.literal("")),
  disabilityType: z.string().optional().nullable().or(z.literal("")),
  disability: z.boolean().default(false),
  disabilityDetails: z.string().optional().nullable().or(z.literal("")),
  orphanType: z.nativeEnum(OrphanType).optional().nullable(),
  fatherDeathDate: z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable().transform((str) => str ? new Date(str) : null)),
  fatherDeathCause: z.string().optional().nullable().or(z.literal("")),
  motherDeathDate: z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable().transform((str) => str ? new Date(str) : null)),
  motherName: z.string().optional().nullable().or(z.literal("")),
  verificationStatus: z.nativeEnum(VerificationStatus).default(VerificationStatus.PENDING),
  verifiedBy: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
})

// =============================================================================
// SERVER ACTIONS
// =============================================================================

export async function createOrphan(rawInput: any) {
  try {
    // Validate inputs
    const validatedData = orphanSchema.parse(rawInput)

    // Check if family exists
    const familyExists = await prisma.family.findFirst({
      where: { id: validatedData.familyId, deletedAt: null },
    })
    if (!familyExists) {
      return { success: false, error: "الأسرة المحددة غير موجودة في النظام" }
    }

    // Check unique nationalId if provided
    if (validatedData.nationalId) {
      const existingId = await prisma.beneficiary.findFirst({
        where: {
          nationalId: validatedData.nationalId,
          familyId: validatedData.familyId,
          deletedAt: null,
        },
      })
      if (existingId) {
        return { success: false, error: "رقم الهوية الوطنية هذا مسجل مسبقاً لهذه الأسرة" }
      }
    }

    // Check unique orphanCode if provided
    if (validatedData.orphanCode) {
      const existingCode = await prisma.beneficiary.findFirst({
        where: { orphanCode: validatedData.orphanCode, deletedAt: null },
      })
      if (existingCode) {
        return { success: false, error: "كود ملف اليتيم مسجل مسبقاً ليتيم آخر" }
      }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    // Create the orphan record
    const beneficiary = await prisma.beneficiary.create({
      data: {
        fullName: validatedData.fullName,
        gender: validatedData.gender,
        birthdate: validatedData.birthdate,
        nationalId: validatedData.nationalId || null,
        category: BeneficiaryCategory.ORPHAN,
        orphanCode: validatedData.orphanCode || null,
        kuraimiAccount: validatedData.kuraimiAccount || null,
        educationLevel: validatedData.educationLevel || null,
        schoolName: validatedData.schoolName || null,
        educationalStage: validatedData.educationalStage || null,
        averageGrade: validatedData.averageGrade,
        educationalNeeds: validatedData.educationalNeeds || null,
        healthStatus: validatedData.healthStatus || null,
        disabilityType: validatedData.disabilityType || null,
        disability: validatedData.disability,
        disabilityDetails: validatedData.disabilityDetails || null,
        orphanType: validatedData.orphanType,
        fatherDeathDate: validatedData.fatherDeathDate,
        fatherDeathCause: validatedData.fatherDeathCause || null,
        motherDeathDate: validatedData.motherDeathDate,
        motherName: validatedData.motherName || null,
        verificationStatus: validatedData.verificationStatus,
        verifiedBy: validatedData.verifiedBy || null,
        notes: validatedData.notes || null,
        isActive: true,
        familyId: validatedData.familyId,
      },
    })

    // Log the create event
    await createAuditLog({
      entityType: "BENEFICIARY",
      entityId: beneficiary.id,
      action: "CREATE",
      changes: diffObjects({}, beneficiary),
      userId: adminUser?.id,
    })

    await createNotification({
      title: "تسجيل يتيم جديد",
      message: `تم تسجيل اليتيم: ${beneficiary.fullName} في النظام وهو بانتظار التحقق`,
      type: "SUCCESS"
    })

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating orphan:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ البيانات" }
  }
}

export async function updateOrphan(id: string, rawInput: any) {
  try {
    const validatedData = orphanSchema.parse(rawInput)

    const orphanToUpdate = await prisma.beneficiary.findFirst({
      where: { id, deletedAt: null },
    })
    if (!orphanToUpdate) {
      return { success: false, error: "المستفيد المطلوب غير موجود في النظام" }
    }

    if (validatedData.orphanCode && validatedData.orphanCode !== orphanToUpdate.orphanCode) {
      const existingCode = await prisma.beneficiary.findFirst({
        where: { orphanCode: validatedData.orphanCode, deletedAt: null },
      })
      if (existingCode) {
        return { success: false, error: "كود ملف اليتيم مسجل مسبقاً ليتيم آخر" }
      }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    const updatedOrphan = await prisma.beneficiary.update({
      where: { id },
      data: {
        fullName: validatedData.fullName,
        gender: validatedData.gender,
        birthdate: validatedData.birthdate,
        nationalId: validatedData.nationalId || null,
        orphanCode: validatedData.orphanCode || null,
        kuraimiAccount: validatedData.kuraimiAccount || null,
        educationLevel: validatedData.educationLevel || null,
        schoolName: validatedData.schoolName || null,
        educationalStage: validatedData.educationalStage || null,
        averageGrade: validatedData.averageGrade,
        educationalNeeds: validatedData.educationalNeeds || null,
        healthStatus: validatedData.healthStatus || null,
        disabilityType: validatedData.disabilityType || null,
        disability: validatedData.disability,
        disabilityDetails: validatedData.disabilityDetails || null,
        orphanType: validatedData.orphanType,
        fatherDeathDate: validatedData.fatherDeathDate,
        fatherDeathCause: validatedData.fatherDeathCause || null,
        motherDeathDate: validatedData.motherDeathDate,
        motherName: validatedData.motherName || null,
        verificationStatus: validatedData.verificationStatus,
        verifiedBy: validatedData.verifiedBy || null,
        notes: validatedData.notes || null,
        familyId: validatedData.familyId,
      },
    })

    // Log update event
    await createAuditLog({
      entityType: "BENEFICIARY",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(orphanToUpdate, updatedOrphan),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating orphan:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ أثناء تحديث بيانات المستفيد" }
  }
}

export async function deleteOrphan(id: string) {
  try {
    const orphanToDelete = await prisma.beneficiary.findUnique({
      where: { id },
    })
    if (!orphanToDelete) {
      return { success: false, error: "المستفيد المطلوب غير موجود في النظام" }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    const deletedOrphan = await prisma.beneficiary.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    // Log delete event
    await createAuditLog({
      entityType: "BENEFICIARY",
      entityId: id,
      action: "DELETE",
      changes: diffObjects(orphanToDelete, deletedOrphan),
      userId: adminUser?.id,
    })

    await createNotification({
      title: "حذف مؤقت ليتيم",
      message: `تم نقل ملف اليتيم ${orphanToDelete.fullName} إلى سلة المهملات`,
      type: "WARNING"
    })

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting orphan:", error)
    return { success: false, error: "حدث خطأ أثناء حذف المستفيد" }
  }
}

export async function approveOrphan(id: string, adminUserId?: string) {
  try {
    const updated = await prisma.beneficiary.update({
      where: { id },
      data: {
        verificationStatus: "APPROVED",
        rejectionReason: null,
        verifiedBy: adminUserId || "مشرف النظام"
      },
      include: {
        createdBy: true
      }
    })

    await createNotification({
      title: "اعتماد طلب يتيم",
      message: `تم اعتماد وقبول اليتيم: ${updated.fullName} في النظام بنجاح.`,
      type: "SUCCESS"
    })

    // Send WhatsApp notification if marketer created the orphan and has phone number (server-side try)
    let sentOnServer = false
    if (updated.createdBy && updated.createdBy.role === "MARKETER" && updated.createdBy.phone) {
      const msg = `🎉 بشرى سارة! تم اعتماد وقبول ملف اليتيم: *${updated.fullName}* بنجاح في النظام من قبل الإدارة. شكراً لجهودك! 🌹`
      sentOnServer = await sendWhatsAppNotification(updated.createdBy.phone, msg)
    }

    revalidatePath("/dashboard/orphans")
    return { 
      success: true, 
      sentOnServer,
      notifyMarketer: updated.createdBy && updated.createdBy.role === "MARKETER" && updated.createdBy.phone && !sentOnServer ? {
        phone: updated.createdBy.phone,
        name: updated.createdBy.name,
        orphanName: updated.fullName,
        type: "APPROVED"
      } : null
    }
  } catch (error: any) {
    return { success: false, error: error.message || "فشلت عملية اعتماد اليتيم" }
  }
}

export async function rejectOrphan(id: string, reason: string, adminUserId?: string) {
  try {
    const updated = await prisma.beneficiary.update({
      where: { id },
      data: {
        verificationStatus: "REJECTED",
        rejectionReason: reason,
        verifiedBy: adminUserId || "مشرف النظام"
      },
      include: {
        createdBy: true
      }
    })

    await createNotification({
      title: "إرجاع طلب يتيم",
      message: `تم إرجاع/رفض طلب اليتيم: ${updated.fullName} بسبب: ${reason}`,
      type: "WARNING"
    })

    // Send WhatsApp notification if marketer created the orphan and has phone number (server-side try)
    let sentOnServer = false
    if (updated.createdBy && updated.createdBy.role === "MARKETER" && updated.createdBy.phone) {
      const msg = `⚠️ تنبيه: تم إرجاع/رفض ملف اليتيم: *${updated.fullName}* من قبل الإدارة لإجراء تعديلات.\n\n📝 *سبب الرفض/الإرجاع:*\n${reason}\n\n🔗 يرجى الدخول لحسابك وتحديث البيانات المطلوبة وإعادة الإرسال:\nhttps://ngo-erp-system.vercel.app/login`
      sentOnServer = await sendWhatsAppNotification(updated.createdBy.phone, msg)
    }

    revalidatePath("/dashboard/orphans")
    return { 
      success: true, 
      sentOnServer,
      notifyMarketer: updated.createdBy && updated.createdBy.role === "MARKETER" && updated.createdBy.phone && !sentOnServer ? {
        phone: updated.createdBy.phone,
        name: updated.createdBy.name,
        orphanName: updated.fullName,
        type: "REJECTED",
        reason: reason
      } : null
    }
  } catch (error: any) {
    return { success: false, error: error.message || "فشلت عملية رفض اليتيم" }
  }
}

export async function sendBulkOrphanWhatsApp(orphanIds: string[], messageTemplate: string, skipSend = false) {
  try {
    if (!orphanIds || orphanIds.length === 0) {
      return { success: false, error: "لم يتم تحديد أي يتيم" }
    }
    if (!messageTemplate) {
      return { success: false, error: "نص الرسالة فارغ" }
    }

    const orphans = await prisma.beneficiary.findMany({
      where: {
        id: { in: orphanIds },
        category: BeneficiaryCategory.ORPHAN,
        deletedAt: null
      },
      include: {
        guardians: true,
        family: true
      }
    })

    const results = []

    for (const orphan of orphans) {
      let phone: string | null = null
      let contactName: string | null = null
      let source = ""

      // Priority lookup:
      // 1. Primary guardian WhatsApp (phone1 where isPrimary = true)
      // 2. Head of family phone (headPhoneNumber)
      // 3. Head of family alt phone (headAltPhone)
      // 4. Primary guardian phone2
      // 5. Any guardian phone1
      const primaryGuardian = orphan.guardians.find(g => g.isPrimary)
      if (primaryGuardian?.phone1) {
        phone = primaryGuardian.phone1
        contactName = primaryGuardian.fullName
        source = "المعيل الأساسي (رقم 1)"
      } else if (orphan.family.headPhoneNumber) {
        phone = orphan.family.headPhoneNumber
        contactName = orphan.family.headFullName
        source = "رب الأسرة (الأساسي)"
      } else if (orphan.family.headAltPhone) {
        phone = orphan.family.headAltPhone
        contactName = orphan.family.headFullName
        source = "رب الأسرة (البديل)"
      } else if (primaryGuardian?.phone2) {
        phone = primaryGuardian.phone2
        contactName = primaryGuardian.fullName
        source = "المعيل الأساسي (رقم 2)"
      } else {
        const anyGuardian = orphan.guardians.find(g => g.phone1)
        if (anyGuardian?.phone1) {
          phone = anyGuardian.phone1
          contactName = anyGuardian.fullName
          source = `المعيل (${anyGuardian.fullName})`
        }
      }

      if (!phone) {
        results.push({
          id: orphan.id,
          name: orphan.fullName,
          code: orphan.orphanCode,
          phone: null,
          contactName: null,
          message: null,
          status: "FAILED" as const,
          reason: "لا يوجد رقم هاتف مسجل للمعيل أو رب الأسرة",
          source: ""
        })
        continue
      }

      // Variable interpolation
      const message = messageTemplate
        .replace(/{name}/g, orphan.fullName)
        .replace(/{code}/g, orphan.orphanCode || "غير محدد")
        .replace(/{guardian}/g, contactName || "غير محدد")

      let sent = false
      let reason = ""
      if (skipSend) {
        reason = "جاهز للإرسال التلقائي عبر المتصفح"
      } else {
        sent = await sendWhatsAppNotification(phone, message)
        reason = sent ? "تم الإرسال بنجاح" : "فشل الإرسال عبر خادم الواتساب (يرجى التأكد من تشغيل البوت محلياً)"
      }

      results.push({
        id: orphan.id,
        name: orphan.fullName,
        code: orphan.orphanCode,
        phone,
        contactName,
        message,
        status: (sent ? "SUCCESS" : "FAILED") as "SUCCESS" | "FAILED",
        reason,
        source
      })
    }

    return { success: true, results }
  } catch (error: any) {
    console.error("Error in sendBulkOrphanWhatsApp:", error)
    return { success: false, error: error.message || "حدث خطأ غير متوقع أثناء إرسال الرسائل الجماعية" }
  }
}

export async function approveOrphansBulk(ids: string[], adminUserId?: string) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })
    
    await prisma.beneficiary.updateMany({
      where: { id: { in: ids } },
      data: {
        verificationStatus: "APPROVED",
        rejectionReason: null,
        verifiedBy: adminUserId || "مشرف النظام"
      }
    })

    await createNotification({
      title: "اعتماد جماعي للأيتام",
      message: `تم اعتماد وقبول عدد ${ids.length} أيتام في النظام بنجاح.`,
      type: "SUCCESS"
    })

    revalidatePath("/dashboard/orphans")
    return { success: true }
  } catch (error: any) {
    console.error("Error bulk approving orphans:", error)
    return { success: false, error: "حدث خطأ أثناء الاعتماد الجماعي" }
  }
}

export async function deleteOrphansBulk(ids: string[]) {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    await prisma.beneficiary.updateMany({
      where: { id: { in: ids } },
      data: {
        deletedAt: new Date(),
        isActive: false,
      }
    })

    await createNotification({
      title: "حذف جماعي للأيتام",
      message: `تم نقل عدد ${ids.length} أيتام إلى سلة المهملات بنجاح.`,
      type: "WARNING"
    })

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error bulk deleting orphans:", error)
    return { success: false, error: "حدث خطأ أثناء الحذف الجماعي" }
  }
}


