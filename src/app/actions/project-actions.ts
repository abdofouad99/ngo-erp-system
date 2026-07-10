"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ProjectCategory, ProjectStatus, Currency } from "@prisma/client"
import { diffObjects, createAuditLog } from "@/lib/audit-utils"
import { getCurrentUser } from "@/app/actions/auth-actions"

// =============================================================================
// PROJECT VALIDATION SCHEMA
// =============================================================================

const projectSchema = z.object({
  name: z.string().min(3, "اسم المشروع مطلوب ويجب ألا يقل عن 3 أحرف"),
  description: z.string().optional().nullable().or(z.literal("")),
  category: z.nativeEnum(ProjectCategory, { errorMap: () => ({ message: "يرجى تحديد فئة المشروع" }) }),
  status: z.nativeEnum(ProjectStatus, { errorMap: () => ({ message: "يرجى تحديد حالة المشروع" }) }).default(ProjectStatus.DRAFT),
  budget: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().min(0, "الميزانية لا تقل عن 0").optional().nullable()
  ),
  currency: z.nativeEnum(Currency, { errorMap: () => ({ message: "يرجى اختيار عملة المشروع" }) }).default(Currency.USD),
  targetCount: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().min(1, "عدد المستهدفين لا يقل عن 1").optional().nullable()
  ),
  startDate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable().transform((str) => (str ? new Date(str) : null))
  ),
  endDate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable().transform((str) => (str ? new Date(str) : null))
  ),
})

// =============================================================================
// DISTRIBUTION (PROJECT BENEFICIARY) VALIDATION SCHEMA
// =============================================================================

const distributionSchema = z.object({
  projectId: z.string().min(1, "يرجى اختيار المشروع"),
  beneficiaryId: z.string().min(1, "يرجى اختيار المستفيد"),
  batchNumber: z.preprocess(
    (val) => (val === "" || val === null ? 1 : Number(val)),
    z.number().min(1, "رقم الدفعة لا يقل عن 1")
  ),
  deliveredItem: z.string().min(1, "يرجى تحديد المادة أو المساعدة الموزعة"),
  quantity: z.preprocess(
    (val) => (val === "" || val === null ? 1 : Number(val)),
    z.number().min(1, "الكمية لا تقل عن 1")
  ),
  unitValue: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().min(0, "القيمة لا تقل عن 0").optional().nullable()
  ),
  currency: z.nativeEnum(Currency).default(Currency.USD),
  isDelivered: z.boolean().default(false),
  deliveryNotes: z.string().optional().nullable().or(z.literal("")),
  deliveryDate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable().transform((str) => (str ? new Date(str) : null))
  ),
})

// =============================================================================
// PROJECT ACTIONS
// =============================================================================

export async function createProject(rawInput: any) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const validatedData = projectSchema.parse(rawInput)

    // Get Admin user for audit log
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })
    if (!adminUser) {
      return { success: false, error: "فشل النظام في تحديد هوية المستخدم المسؤول عن الإدخال" }
    }

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        category: validatedData.category,
        status: validatedData.status,
        budget: validatedData.budget,
        currency: validatedData.currency,
        targetCount: validatedData.targetCount,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        createdById: adminUser.id,
      },
    })

    // Log audit
    await createAuditLog({
      entityType: "PROJECT",
      entityId: project.id,
      action: "CREATE",
      changes: diffObjects({}, project),
      userId: adminUser.id,
    })

    revalidatePath("/dashboard/projects")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating project:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ بيانات المشروع" }
  }
}

export async function updateProject(id: string, rawInput: any) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const validatedData = projectSchema.parse(rawInput)

    const projectExists = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    })
    if (!projectExists) {
      return { success: false, error: "المشروع المطلوب غير موجود بالنظام" }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        category: validatedData.category,
        status: validatedData.status,
        budget: validatedData.budget,
        currency: validatedData.currency,
        targetCount: validatedData.targetCount,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
      },
    })

    // Log audit
    await createAuditLog({
      entityType: "PROJECT",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(projectExists, updatedProject),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/projects")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating project:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء تحديث بيانات المشروع" }
  }
}

export async function deleteProject(id: string) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const projectToDelete = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    })
    if (!projectToDelete) {
      return { success: false, error: "المشروع المطلوب غير موجود بالنظام" }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const deletedProject = await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "CANCELLED",
      },
    })

    // Log audit
    await createAuditLog({
      entityType: "PROJECT",
      entityId: id,
      action: "DELETE",
      changes: diffObjects(projectToDelete, deletedProject),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/projects")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting project:", error)
    return { success: false, error: "فشل حذف المشروع." }
  }
}

// =============================================================================
// DISTRIBUTION ACTIONS
// =============================================================================

export async function createDistribution(rawInput: any) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const validatedData = distributionSchema.parse(rawInput)

    // Check project exists
    const project = await prisma.project.findFirst({
      where: { id: validatedData.projectId, deletedAt: null },
    })
    if (!project) {
      return { success: false, error: "المشروع المحدد غير موجود بالنظام" }
    }

    // Check beneficiary exists
    const beneficiary = await prisma.beneficiary.findFirst({
      where: { id: validatedData.beneficiaryId, deletedAt: null },
    })
    if (!beneficiary) {
      return { success: false, error: "المستفيد المحدد غير موجود بالنظام" }
    }

    // Check unique constraint
    const existingDelivery = await prisma.projectBeneficiary.findFirst({
      where: {
        projectId: validatedData.projectId,
        beneficiaryId: validatedData.beneficiaryId,
        batchNumber: validatedData.batchNumber,
        deletedAt: null,
      },
    })

    if (existingDelivery) {
      return {
        success: false,
        error: `المستفيد قد تسلم بالفعل الدفعة رقم (${validatedData.batchNumber}) من هذا المشروع!`,
      }
    }

    // Get Admin user for audit
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })
    if (!adminUser) {
      return { success: false, error: "فشل النظام في تحديد هوية المستخدم المسؤول عن الإدخال" }
    }

    // Set delivery date automatically if marked delivered now
    let deliveryDate = validatedData.deliveryDate
    if (validatedData.isDelivered && !deliveryDate) {
      deliveryDate = new Date()
    }

    // Create delivery record
    const distribution = await prisma.projectBeneficiary.create({
      data: {
        projectId: validatedData.projectId,
        beneficiaryId: validatedData.beneficiaryId,
        batchNumber: validatedData.batchNumber,
        deliveredItem: validatedData.deliveredItem,
        quantity: validatedData.quantity,
        unitValue: validatedData.unitValue,
        currency: validatedData.currency || project.currency,
        isDelivered: validatedData.isDelivered,
        deliveryNotes: validatedData.deliveryNotes || null,
        deliveryDate,
        recordedById: adminUser.id,
      },
    })

    // Log audit
    await createAuditLog({
      entityType: "DISTRIBUTION",
      entityId: distribution.id,
      action: "CREATE",
      changes: diffObjects({}, distribution),
      userId: adminUser.id,
    })

    revalidatePath("/dashboard/projects")
    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating distribution:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "حدث خطأ غير متوقع أثناء تسجيل التوزيع" }
  }
}

export async function updateDistributionStatus(id: string, isDelivered: boolean, deliveryDateInput?: string) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    const distributionToUpdate = await prisma.projectBeneficiary.findUnique({
      where: { id },
    })

    const deliveryDate = isDelivered ? (deliveryDateInput ? new Date(deliveryDateInput) : new Date()) : null

    const updatedDistribution = await prisma.projectBeneficiary.update({
      where: { id },
      data: {
        isDelivered,
        deliveryDate,
        recordedById: adminUser?.id || null,
      },
    })

    // Log audit
    await createAuditLog({
      entityType: "DISTRIBUTION",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(distributionToUpdate, updatedDistribution),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/projects")
    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating distribution status:", error)
    return { success: false, error: "حدث خطأ أثناء تعديل حالة تسليم المساعدة" }
  }
}

export async function deleteDistribution(id: string) {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === "VIEWER") {
      return { success: false, error: "عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بالمسح أو التعديل." }
    }
    const distributionToDelete = await prisma.projectBeneficiary.findFirst({
      where: { id, deletedAt: null },
    })
    if (!distributionToDelete) {
      return { success: false, error: "سجل التوزيع غير موجود في النظام" }
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const deletedDistribution = await prisma.projectBeneficiary.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    // Log audit
    await createAuditLog({
      entityType: "DISTRIBUTION",
      entityId: id,
      action: "DELETE",
      changes: diffObjects(distributionToDelete, deletedDistribution),
      userId: adminUser?.id,
    })

    revalidatePath("/dashboard/projects")
    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting distribution:", error)
    return { success: false, error: "حدث خطأ أثناء حذف سجل التوزيع" }
  }
}
