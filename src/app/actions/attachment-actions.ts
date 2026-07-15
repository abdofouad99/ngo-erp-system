"use server"

import { prisma } from "@/lib/prisma"
import { createSupabaseAdminClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { translateDocumentType } from "@/lib/attachment-utils"

// re-export for convenience
export { translateDocumentType }

const BUCKET = "orphan-attachments"


// UPLOAD ATTACHMENT
// =============================================================================

export async function uploadOrphanAttachment(formData: FormData) {
  try {
    const orphanId    = formData.get("orphanId") as string
    const file        = formData.get("file") as File
    const docType     = (formData.get("documentType") as string) || "OTHER"
    const description = (formData.get("description") as string) || null

    if (!orphanId || !file || file.size === 0) {
      return { success: false, error: "بيانات الملف غير مكتملة" }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "حجم الملف يتجاوز الحد المسموح (5 ميغابايت)" }
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "نوع الملف غير مدعوم. يُسمح بـ PDF, JPG, PNG فقط" }
    }

    const supabase  = createSupabaseAdminClient()
    const timestamp = Date.now()
    const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${orphanId}/${timestamp}_${safeName}`

    // رفع الملف إلى Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return { success: false, error: `فشل رفع الملف: ${uploadError.message}` }
    }

    // الحصول على الرابط العام
    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    // حفظ سجل Attachment في قاعدة البيانات
    const attachment = await prisma.attachment.create({
      data: {
        fileName:     file.name,
        fileUrl:      publicData.publicUrl,
        storagePath,
        mimeType:     file.type,
        sizeBytes:    file.size,
        documentType: docType as any,
        description,
        beneficiaryId: orphanId,
      },
    })

    revalidatePath(`/dashboard/orphans`)
    revalidatePath(`/dashboard/marketer`)
    return { success: true, attachment }
  } catch (error: any) {
    console.error("uploadOrphanAttachment error:", error)
    return { success: false, error: "حدث خطأ أثناء رفع الملف" }
  }
}

// =============================================================================
// GET ATTACHMENTS
// =============================================================================

export async function getOrphanAttachments(orphanId: string) {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { beneficiaryId: orphanId },
      orderBy: { createdAt: "asc" },
    })
    return { success: true, attachments }
  } catch (error: any) {
    console.error("getOrphanAttachments error:", error)
    return { success: false, error: "فشل جلب المرفقات", attachments: [] }
  }
}

// =============================================================================
// GET SIGNED DOWNLOAD URL (آمن ومؤقت)
// =============================================================================

export async function getSignedDownloadUrl(storagePath: string) {
  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600) // ساعة واحدة

    if (error || !data) {
      return { success: false, error: "فشل إنشاء رابط التحميل" }
    }
    return { success: true, url: data.signedUrl }
  } catch (error: any) {
    console.error("getSignedDownloadUrl error:", error)
    return { success: false, error: "حدث خطأ أثناء إنشاء رابط التحميل" }
  }
}

// =============================================================================
// DELETE ATTACHMENT
// =============================================================================

export async function deleteAttachment(attachmentId: string) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    })
    if (!attachment) {
      return { success: false, error: "المرفق غير موجود" }
    }

    const supabase = createSupabaseAdminClient()
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([attachment.storagePath])

    if (storageError) {
      console.error("Storage delete error:", storageError)
      // نكمل حتى لو فشل حذف Storage لأن قاعدة البيانات هي المصدر الحقيقي
    }

    await prisma.attachment.delete({ where: { id: attachmentId } })

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/marketer")
    revalidatePath("/dashboard/families")
    return { success: true }
  } catch (error: any) {
    console.error("deleteAttachment error:", error)
    return { success: false, error: "فشل حذف المرفق" }
  }
}

// =============================================================================
// FAMILY ATTACHMENTS
// =============================================================================

export async function uploadFamilyAttachment(formData: FormData) {
  try {
    const familyId    = formData.get("familyId") as string
    const file        = formData.get("file") as File
    const docType     = (formData.get("documentType") as string) || "OTHER"
    const description = (formData.get("description") as string) || null

    if (!familyId || !file || file.size === 0) {
      return { success: false, error: "بيانات الملف غير مكتملة" }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "حجم الملف يتجاوز الحد المسموح (5 ميغابايت)" }
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "نوع الملف غير مدعوم. يُسمح بـ PDF, JPG, PNG فقط" }
    }

    const supabase  = createSupabaseAdminClient()
    const timestamp = Date.now()
    const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `families/${familyId}/${timestamp}_${safeName}`

    // رفع الملف إلى Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return { success: false, error: `فشل رفع الملف: ${uploadError.message}` }
    }

    // الحصول على الرابط العام
    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    // حفظ سجل Attachment في قاعدة البيانات
    const attachment = await prisma.attachment.create({
      data: {
        fileName:     file.name,
        fileUrl:      publicData.publicUrl,
        storagePath,
        mimeType:     file.type,
        sizeBytes:    file.size,
        documentType: docType as any,
        description,
        familyId:     familyId,
      },
    })

    revalidatePath(`/dashboard/families`)
    return { success: true, attachment }
  } catch (error: any) {
    console.error("uploadFamilyAttachment error:", error)
    return { success: false, error: "حدث خطأ أثناء رفع الملف" }
  }
}

export async function getFamilyAttachments(familyId: string) {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { familyId: familyId },
      orderBy: { createdAt: "asc" },
    })
    return { success: true, attachments }
  } catch (error: any) {
    console.error("getFamilyAttachments error:", error)
    return { success: false, error: "فشل جلب المرفقات", attachments: [] }
  }
}

// =============================================================================
// PATIENT ATTACHMENTS
// =============================================================================

export async function uploadPatientAttachment(formData: FormData) {
  try {
    const patientId   = formData.get("patientId") as string
    const file        = formData.get("file") as File
    const docType     = (formData.get("documentType") as string) || "OTHER"
    const description = (formData.get("description") as string) || null

    if (!patientId || !file || file.size === 0) {
      return { success: false, error: "بيانات الملف غير مكتملة" }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "حجم الملف يتجاوز الحد المسموح (5 ميغابايت)" }
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "نوع الملف غير مدعوم. يُسمح بـ PDF, JPG, PNG فقط" }
    }

    const supabase  = createSupabaseAdminClient()
    const timestamp = Date.now()
    const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `patients/${patientId}/${timestamp}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return { success: false, error: `فشل رفع الملف: ${uploadError.message}` }
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    const attachment = await prisma.attachment.create({
      data: {
        fileName:     file.name,
        fileUrl:      publicData.publicUrl,
        storagePath,
        mimeType:     file.type,
        sizeBytes:    file.size,
        documentType: docType as any,
        description,
        patientId:    patientId,
      },
    })

    revalidatePath(`/dashboard/patients`)
    return { success: true, attachment }
  } catch (error: any) {
    console.error("uploadPatientAttachment error:", error)
    return { success: false, error: "حدث خطأ أثناء رفع الملف" }
  }
}

export async function getPatientAttachments(patientId: string) {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { patientId },
      orderBy: { createdAt: "asc" },
    })
    return { success: true, attachments }
  } catch (error: any) {
    console.error("getPatientAttachments error:", error)
    return { success: false, error: "فشل جلب المرفقات", attachments: [] }
  }
}

