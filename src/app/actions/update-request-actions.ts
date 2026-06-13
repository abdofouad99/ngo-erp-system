"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// =============================================================================
// GENERATE TOKEN — المشرف يولّد الرابط
// =============================================================================
export async function generateOrphanUpdateToken(beneficiaryId: string) {
  try {
    // احذف أي طلب REJECTED قديم وأنشئ واحداً جديداً
    // لكن إذا كان PENDING موجود، أعد نفس الرابط
    const existing = await prisma.orphanUpdateRequest.findFirst({
      where: { beneficiaryId, status: "PENDING" },
    })

    if (existing) {
      const baseUrl = process.env.NEXTAUTH_URL || "https://ngo-erp-system.vercel.app"
      return { success: true, url: `${baseUrl}/update/${existing.token}`, token: existing.token }
    }

    const request = await prisma.orphanUpdateRequest.create({
      data: { beneficiaryId },
    })

    const baseUrl = process.env.NEXTAUTH_URL || "https://ngo-erp-system.vercel.app"
    return { success: true, url: `${baseUrl}/update/${request.token}`, token: request.token }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================================================
// GET BY TOKEN — الصفحة العامة تجلب بيانات اليتيم (بدون auth)
// =============================================================================
export async function getUpdateRequestByToken(token: string) {
  try {
    const request = await prisma.orphanUpdateRequest.findUnique({
      where: { token },
      include: {
        beneficiary: {
          include: {
            guardians: { orderBy: { isPrimary: "desc" } },
            siblings: { orderBy: { siblingOrder: "asc" } },
          },
        },
      },
    })

    if (!request) return { success: false, error: "الرابط غير صحيح أو منتهي الصلاحية" }

    return { success: true, request }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================================================
// SUBMIT — المعيل يُرسل التحديث
// =============================================================================
export async function submitUpdateRequest(token: string, submitterName: string, data: UpdateData) {
  try {
    const request = await prisma.orphanUpdateRequest.findUnique({ where: { token } })
    if (!request) return { success: false, error: "الرابط غير صحيح" }

    // إذا كان APPROVED، لا يُسمح بإعادة الإرسال
    if (request.status === "APPROVED") {
      return { success: false, error: "تم قبول هذا الطلب مسبقاً ولا يمكن تعديله" }
    }

    await prisma.orphanUpdateRequest.update({
      where: { token },
      data: {
        submitterName,
        submittedData: data as any,
        status: "PENDING",
        rejectionReason: null, // مسح سبب الرفض القديم عند إعادة الإرسال
      },
    })

    revalidatePath("/dashboard/update-requests")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================================================
// APPROVE — المشرف يقبل ويُطبّق التغييرات على بيانات اليتيم
// =============================================================================
export async function approveUpdateRequest(requestId: string, reviewedById: string) {
  try {
    const request = await prisma.orphanUpdateRequest.findUnique({
      where: { id: requestId },
      include: { beneficiary: { include: { guardians: true, siblings: true } } },
    })

    if (!request || !request.submittedData) return { success: false, error: "الطلب غير موجود" }

    const data = request.submittedData as UpdateData

    await prisma.$transaction(async (tx) => {
      // تحديث بيانات اليتيم (الحقول المسموح بها فقط)
      await tx.beneficiary.update({
        where: { id: request.beneficiaryId },
        data: {
          // تعليم
          educationLevel:    data.educationLevel    ?? undefined,
          educationalStage:  data.educationalStage  ?? undefined,
          schoolName:        data.schoolName        ?? undefined,
          quranMemorization: data.quranMemorization ?? undefined,
          // صحة
          healthStatus:      data.healthStatus      ?? undefined,
          // سكن
          birthGovernorate:  data.birthGovernorate  ?? undefined,
          birthDistrict:     data.birthDistrict     ?? undefined,
          birthVillage:      data.birthVillage      ?? undefined,
          birthArea:         data.birthArea         ?? undefined,
          housingStatus:     data.housingStatus     ?? undefined,
          // مالي
          kuraimiAccount:    data.kuraimiAccount    ?? undefined,
        },
      })

      // تحديث بيانات المعيل الأساسي
      if (data.guardian && request.beneficiary.guardians.length > 0) {
        const primaryGuardian = request.beneficiary.guardians.find(g => g.isPrimary) || request.beneficiary.guardians[0]
        await tx.guardian.update({
          where: { id: primaryGuardian.id },
          data: {
            fullName:   data.guardian.fullName   || undefined,
            relation:   data.guardian.relation   || undefined,
            occupation: data.guardian.occupation || undefined,
            phone1:     data.guardian.phone1     || undefined,
            phone2:     data.guardian.phone2     || undefined,
            phone3:     data.guardian.phone3     || undefined,
            phone4:     data.guardian.phone4     || undefined,
          },
        })
      }

      // تحديث بيانات الإخوة
      if (data.siblings && data.siblings.length > 0) {
        for (const sib of data.siblings) {
          if (sib.id) {
            await tx.sibling.update({
              where: { id: sib.id },
              data: {
                fullName:      sib.fullName      || undefined,
                qualification: sib.qualification || undefined,
                socialStatus:  sib.socialStatus  || undefined,
              },
            })
          }
        }
      }

      // تحديث حالة الطلب
      await tx.orphanUpdateRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED", reviewedById },
      })
    })

    revalidatePath("/dashboard/update-requests")
    revalidatePath("/dashboard/orphans")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================================================
// REJECT — المشرف يرفض مع سبب
// =============================================================================
export async function rejectUpdateRequest(requestId: string, reason: string, reviewedById: string) {
  try {
    await prisma.orphanUpdateRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", rejectionReason: reason, reviewedById },
    })

    revalidatePath("/dashboard/update-requests")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================================================
// GET ALL — المشرف يجلب جميع الطلبات
// =============================================================================
export async function getAllUpdateRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
  try {
    const requests = await prisma.orphanUpdateRequest.findMany({
      where: status ? { status } : {},
      include: {
        beneficiary: {
          select: {
            id: true, fullName: true, orphanCode: true,
            guardians: { where: { isPrimary: true }, take: 1 },
            siblings: { select: { id: true, fullName: true, qualification: true, socialStatus: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, requests }
  } catch (error: any) {
    return { success: false, error: error.message, requests: [] }
  }
}

// =============================================================================
// TYPE — البيانات المسموح بتحديثها فقط
// =============================================================================
export interface UpdateData {
  // تعليم
  educationLevel?:    string
  educationalStage?:  string
  schoolName?:        string
  quranMemorization?: string
  // صحة
  healthStatus?:      string
  // سكن
  birthGovernorate?:  string
  birthDistrict?:     string
  birthVillage?:      string
  birthArea?:         string
  housingStatus?:     string
  // مالي
  kuraimiAccount?:    string
  // معيل
  guardian?: {
    fullName?:   string
    relation?:   string
    occupation?: string
    phone1?:     string
    phone2?:     string
    phone3?:     string
    phone4?:     string
  }
  // إخوة
  siblings?: {
    id?:           string
    fullName?:     string
    qualification?: string
    socialStatus?:  string
  }[]
}
