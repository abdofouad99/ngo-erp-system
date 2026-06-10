"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { TagCategory } from "@prisma/client"
import { z } from "zod"

// =============================================================================
// SCHEMAS
// =============================================================================

const CreateTagSchema = z.object({
  nameAr: z.string().min(2, "الاسم بالعربي مطلوب ولا يقل عن حرفين"),
  nameEn: z.string().optional(),
  category: z.nativeEnum(TagCategory),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون غير صالح"),
  description: z.string().optional(),
  sortOrder: z.number().optional().default(0),
})

const UpdateTagSchema = CreateTagSchema.partial().extend({
  id: z.string(),
})

// =============================================================================
// READ — جلب التصنيفات
// =============================================================================

/** جلب جميع التصنيفات النشطة مقسمة بالفئات */
export async function getAllTags() {
  try {
    const tags = await prisma.tag.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { nameAr: "asc" }],
    })
    return { success: true, tags }
  } catch (error) {
    console.error("getAllTags error:", error)
    return { success: false, error: "فشل جلب التصنيفات" }
  }
}

/** جلب تصنيفات بفئة محددة */
export async function getTagsByCategory(category: TagCategory) {
  try {
    const tags = await prisma.tag.findMany({
      where: { category, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
    })
    return { success: true, tags }
  } catch (error) {
    console.error("getTagsByCategory error:", error)
    return { success: false, error: "فشل جلب التصنيفات" }
  }
}

/** جلب جميع التصنيفات (بما فيها المعطلة) لصفحة الإعدادات */
export async function getAllTagsAdmin() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { nameAr: "asc" }],
      include: {
        _count: {
          select: { beneficiaryTags: true, familyTags: true },
        },
      },
    })
    return { success: true, tags }
  } catch (error) {
    console.error("getAllTagsAdmin error:", error)
    return { success: false, error: "فشل جلب التصنيفات" }
  }
}

// =============================================================================
// WRITE — إنشاء وتعديل التصنيفات
// =============================================================================

/** إنشاء تصنيف جديد */
export async function createTag(formData: FormData) {
  const raw = {
    nameAr: formData.get("nameAr") as string,
    nameEn: (formData.get("nameEn") as string) || undefined,
    category: formData.get("category") as TagCategory,
    color: (formData.get("color") as string) || "#6366f1",
    description: (formData.get("description") as string) || undefined,
    sortOrder: Number(formData.get("sortOrder") || 0),
  }

  const validated = CreateTagSchema.safeParse(raw)
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  try {
    const tag = await prisma.tag.create({ data: validated.data })
    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    return { success: true, tag, message: `تم إنشاء التصنيف "${tag.nameAr}" بنجاح` }
  } catch (error) {
    console.error("createTag error:", error)
    return { success: false, error: "فشل إنشاء التصنيف" }
  }
}

/** تعديل تصنيف موجود */
export async function updateTag(formData: FormData) {
  const raw = {
    id: formData.get("id") as string,
    nameAr: formData.get("nameAr") as string,
    nameEn: (formData.get("nameEn") as string) || undefined,
    category: formData.get("category") as TagCategory,
    color: (formData.get("color") as string) || "#6366f1",
    description: (formData.get("description") as string) || undefined,
    sortOrder: Number(formData.get("sortOrder") || 0),
  }

  const validated = UpdateTagSchema.safeParse(raw)
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { id, ...data } = validated.data
  try {
    const tag = await prisma.tag.update({ where: { id }, data })
    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard/orphans")
    return { success: true, tag, message: `تم تحديث التصنيف "${tag.nameAr}"` }
  } catch (error) {
    console.error("updateTag error:", error)
    return { success: false, error: "فشل تحديث التصنيف" }
  }
}

/** تفعيل/تعطيل تصنيف */
export async function toggleTag(id: string) {
  try {
    const current = await prisma.tag.findUnique({ where: { id } })
    if (!current) return { success: false, error: "التصنيف غير موجود" }

    const tag = await prisma.tag.update({
      where: { id },
      data: { isActive: !current.isActive },
    })
    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard/orphans")
    return {
      success: true,
      tag,
      message: tag.isActive ? `تم تفعيل "${tag.nameAr}"` : `تم تعطيل "${tag.nameAr}"`,
    }
  } catch (error) {
    console.error("toggleTag error:", error)
    return { success: false, error: "فشل تغيير حالة التصنيف" }
  }
}

/** حذف تصنيف نهائياً (فقط إذا لم يكن مستخدماً) */
export async function deleteTag(id: string) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: { select: { beneficiaryTags: true, familyTags: true } },
      },
    })
    if (!tag) return { success: false, error: "التصنيف غير موجود" }

    const usageCount = tag._count.beneficiaryTags + tag._count.familyTags
    if (usageCount > 0) {
      return {
        success: false,
        error: `لا يمكن حذف هذا التصنيف لأنه مستخدم في ${usageCount} سجل. يمكنك تعطيله بدلاً من حذفه.`,
      }
    }

    await prisma.tag.delete({ where: { id } })
    revalidatePath("/dashboard/settings")
    return { success: true, message: `تم حذف التصنيف "${tag.nameAr}"` }
  } catch (error) {
    console.error("deleteTag error:", error)
    return { success: false, error: "فشل حذف التصنيف" }
  }
}

// =============================================================================
// BENEFICIARY TAGS — إدارة تصنيفات المستفيدين
// =============================================================================

/** إضافة/حذف تصنيفات لمستفيد (تحديث كامل) */
export async function updateBeneficiaryTags(beneficiaryId: string, tagIds: string[]) {
  try {
    // حذف جميع التصنيفات الحالية
    await prisma.beneficiaryTag.deleteMany({ where: { beneficiaryId } })

    // إضافة التصنيفات الجديدة
    if (tagIds.length > 0) {
      await prisma.beneficiaryTag.createMany({
        data: tagIds.map((tagId) => ({ beneficiaryId, tagId })),
        skipDuplicates: true,
      })
    }

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/reports")
    revalidatePath("/dashboard/kanban")
    return { success: true, message: "تم تحديث تصنيفات المستفيد" }
  } catch (error) {
    console.error("updateBeneficiaryTags error:", error)
    return { success: false, error: "فشل تحديث التصنيفات" }
  }
}

// =============================================================================
// FAMILY TAGS — إدارة تصنيفات الأسر
// =============================================================================

/** إضافة/حذف تصنيفات لأسرة (تحديث كامل) */
export async function updateFamilyTags(familyId: string, tagIds: string[]) {
  try {
    await prisma.familyTag.deleteMany({ where: { familyId } })

    if (tagIds.length > 0) {
      await prisma.familyTag.createMany({
        data: tagIds.map((tagId) => ({ familyId, tagId })),
        skipDuplicates: true,
      })
    }

    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard/reports")
    return { success: true, message: "تم تحديث تصنيفات الأسرة" }
  } catch (error) {
    console.error("updateFamilyTags error:", error)
    return { success: false, error: "فشل تحديث التصنيفات" }
  }
}

// =============================================================================
// SEED — إدخال التصنيفات الأولية
// =============================================================================

export async function seedInitialTags() {
  const initialTags = [
    // الحالة التشغيلية للأيتام
    { nameAr: "تحت التسويق", category: "ORPHAN_OPERATIONAL_STATUS" as TagCategory, color: "#3b82f6", sortOrder: 1 },
    { nameAr: "مكفول", category: "ORPHAN_OPERATIONAL_STATUS" as TagCategory, color: "#22c55e", sortOrder: 2 },
    { nameAr: "إعادة تسويق", category: "ORPHAN_OPERATIONAL_STATUS" as TagCategory, color: "#eab308", sortOrder: 3 },
    { nameAr: "موقوف", category: "ORPHAN_OPERATIONAL_STATUS" as TagCategory, color: "#ef4444", sortOrder: 4 },
    { nameAr: "خارج عن الدفع", category: "ORPHAN_OPERATIONAL_STATUS" as TagCategory, color: "#6b7280", sortOrder: 5 },
    { nameAr: "توقف الكافل", category: "ORPHAN_OPERATIONAL_STATUS" as TagCategory, color: "#f97316", sortOrder: 6 },
    { nameAr: "مرتجع", category: "ORPHAN_OPERATIONAL_STATUS" as TagCategory, color: "#a855f7", sortOrder: 7 },
    // جهة التمويل
    { nameAr: "بيت الزكاة", category: "FUNDING_SOURCE" as TagCategory, color: "#0ea5e9", sortOrder: 1 },
    { nameAr: "جهة الحياة", category: "FUNDING_SOURCE" as TagCategory, color: "#14b8a6", sortOrder: 2 },
    { nameAr: "تمويل داخلي", category: "FUNDING_SOURCE" as TagCategory, color: "#8b5cf6", sortOrder: 3 },
    { nameAr: "أخرى", category: "FUNDING_SOURCE" as TagCategory, color: "#78716c", sortOrder: 4 },
    // احتياجات الأسرة
    { nameAr: "ترميم منزل", category: "FAMILY_NEED" as TagCategory, color: "#f59e0b", sortOrder: 1 },
    { nameAr: "تسديد ديون", category: "FAMILY_NEED" as TagCategory, color: "#ef4444", sortOrder: 2 },
    { nameAr: "كفالة معيشية", category: "FAMILY_NEED" as TagCategory, color: "#22c55e", sortOrder: 3 },
    { nameAr: "تمكين اقتصادي", category: "FAMILY_NEED" as TagCategory, color: "#6366f1", sortOrder: 4 },
    // الحالات الطبية
    { nameAr: "سرطان", category: "MEDICAL_CONDITION" as TagCategory, color: "#dc2626", sortOrder: 1 },
    { nameAr: "فشل كلوي", category: "MEDICAL_CONDITION" as TagCategory, color: "#9333ea", sortOrder: 2 },
    { nameAr: "إعاقة حركية", category: "MEDICAL_CONDITION" as TagCategory, color: "#d97706", sortOrder: 3 },
    { nameAr: "إعاقة بصرية", category: "MEDICAL_CONDITION" as TagCategory, color: "#0284c7", sortOrder: 4 },
    { nameAr: "مرض مزمن", category: "MEDICAL_CONDITION" as TagCategory, color: "#be185d", sortOrder: 5 },
  ]

  try {
    let created = 0
    for (const tag of initialTags) {
      const exists = await prisma.tag.findFirst({
        where: { nameAr: tag.nameAr, category: tag.category },
      })
      if (!exists) {
        await prisma.tag.create({ data: tag })
        created++
      }
    }
    revalidatePath("/dashboard/settings")
    return { success: true, message: `تم إضافة ${created} تصنيف جديد` }
  } catch (error) {
    console.error("seedInitialTags error:", error)
    return { success: false, error: "فشل إضافة التصنيفات الأولية" }
  }
}
