"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// =============================================================================
// HELPER: Get or create a default SubDistrict for auto-created families
// =============================================================================
async function getDefaultSubDistrictId(): Promise<number> {
  // البحث عن أي منطقة فرعية موجودة للاستخدام كقيمة افتراضية
  const sub = await prisma.subDistrict.findFirst()
  if (sub) return sub.id
  // إنشاء تسلسل جغرافي افتراضي إذا لم يوجد أي شيء
  const gov = await prisma.governorate.upsert({
    where: { nameAr: "غير محدد" },
    update: {},
    create: { nameAr: "غير محدد", nameEn: "Unknown" },
  })
  const dist = await prisma.district.upsert({
    where: { nameAr_governorateId: { nameAr: "غير محدد", governorateId: gov.id } },
    update: {},
    create: { nameAr: "غير محدد", governorateId: gov.id },
  })
  const subNew = await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "غير محدد", districtId: dist.id } },
    update: {},
    create: { nameAr: "غير محدد", districtId: dist.id },
  })
  return subNew.id
}

// =============================================================================
// SCHEMAS
// =============================================================================

const GuardianSchema = z.object({
  fullName:   z.string().min(2, "اسم المعيل مطلوب"),
  nationalId: z.string().optional(),
  relation:   z.string().optional(),
  occupation: z.string().optional(),
  phone1:     z.string().optional(),
  phone2:     z.string().optional(),
  phone3:     z.string().optional(),
  phone4:     z.string().optional(),
  isPrimary:  z.boolean().default(true),
})

const SiblingSchema = z.object({
  fullName:     z.string().min(1, "اسم الأخ مطلوب"),
  qualification: z.string().optional(),
  birthdate:    z.string().optional(),
  socialStatus: z.string().optional(),
  gender:       z.enum(["MALE", "FEMALE"]).optional(),
  siblingOrder: z.number().int().min(1).max(7),
})

// =============================================================================
// GUARDIAN ACTIONS
// =============================================================================

export async function upsertGuardians(beneficiaryId: string, guardians: any[]) {
  try {
    // حذف القديمة وإعادة الإنشاء
    await prisma.guardian.deleteMany({ where: { beneficiaryId } })

    if (guardians.length > 0) {
      await prisma.guardian.createMany({
        data: guardians.map((g, i) => ({
          beneficiaryId,
          fullName:   g.fullName,
          nationalId: g.nationalId || null,
          relation:   g.relation || null,
          occupation: g.occupation || null,
          phone1:     g.phone1 || null,
          phone2:     g.phone2 || null,
          phone3:     g.phone3 || null,
          phone4:     g.phone4 || null,
          isPrimary:  i === 0,
        })),
      })
    }

    revalidatePath("/dashboard/orphans")
    return { success: true }
  } catch (error) {
    console.error("upsertGuardians error:", error)
    return { success: false, error: "فشل حفظ بيانات المعيل" }
  }
}

// =============================================================================
// SIBLING ACTIONS
// =============================================================================

export async function upsertSiblings(beneficiaryId: string, siblings: any[]) {
  try {
    await prisma.sibling.deleteMany({ where: { beneficiaryId } })

    if (siblings.length > 0) {
      await prisma.sibling.createMany({
        data: siblings.map((s, i) => ({
          beneficiaryId,
          fullName:      s.fullName,
          qualification: s.qualification || null,
          birthdate:     s.birthdate ? new Date(s.birthdate) : null,
          socialStatus:  s.socialStatus || null,
          gender:        s.gender || null,
          siblingOrder:  i + 1,
        })),
      })
    }

    revalidatePath("/dashboard/orphans")
    return { success: true }
  } catch (error) {
    console.error("upsertSiblings error:", error)
    return { success: false, error: "فشل حفظ بيانات الإخوة" }
  }
}

// =============================================================================
// CREATE FULL ORPHAN (with guardians + siblings)
// =============================================================================

export async function createFullOrphan(data: {
  familyId?:         string   // اختياري للمسوقين — يُنشأ تلقائياً
  // شخصية
  fullName:          string
  shortName?:        string
  gender:            "MALE" | "FEMALE"
  birthdate:         string
  nationalId?:       string
  religion?:         string
  // حسابات
  orphanCode?:           string
  kuraimiAccount?:       string
  kuraimiAccountOld?:    string
  kuraimiAccountHolder?: string
  mumaiyo?:              string
  baitZakatNumber?:      string
  // تعليم
  educationLevel?:   string
  schoolName?:       string
  educationalStage?: string
  averageGrade?:     number | string
  educationalNeeds?: string
  quranMemorization?: string
  // صحة
  healthStatus?:     string
  disabilityType?:   string
  disability?:       boolean
  disabilityDetails?: string
  nutritionStatus?:  string
  housingStatus?:    string
  // تيتم
  orphanType?:       "FATHER" | "MOTHER" | "BOTH"
  fatherFullName?:   string
  fatherDeathDate?:  string
  fatherDeathCause?: string
  motherDeathDate?:  string
  motherName?:       string
  // مكان الميلاد
  birthGovernorate?: string
  birthDistrict?:    string
  birthVillage?:     string
  birthArea?:        string
  // معرِّف
  referrerName?:     string
  referrerPhone1?:   string
  referrerPhone2?:   string
  // تسويق
  marketedToOrg?:    string
  notes?:            string
  createdById?:      string
  // علاقات
  guardians?:        any[]
  siblings?:         any[]
}) {
  try {
    const { guardians = [], siblings = [], ...orphanData } = data

    // ── تحديد أو إنشاء الأسرة تلقائياً ─────────────────────────────────────
    let resolvedFamilyId = orphanData.familyId

    if (!resolvedFamilyId) {
      // استخدام بيانات المعيل الأساسي لإنشاء الأسرة
      const primaryGuardian = guardians[0]
      const guardianName = primaryGuardian?.fullName || orphanData.fullName
      const guardianNationalId = primaryGuardian?.nationalId

      // البحث عن أسرة موجودة بنفس رقم هوية المعيل لتفادي التكرار
      if (guardianNationalId) {
        const existingFamily = await prisma.family.findFirst({
          where: { headNationalId: guardianNationalId, deletedAt: null },
        })
        if (existingFamily) {
          resolvedFamilyId = existingFamily.id
        }
      }

      // إنشاء أسرة جديدة إذا لم توجد
      if (!resolvedFamilyId) {
        const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } })
        const subDistrictId = await getDefaultSubDistrictId()
        // توليد رقم هوية مؤقت فريد إذا لم يُدخَل
        const tempNationalId = guardianNationalId || `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

        // التحقق من عدم تكرار headNationalId المولّد
        const conflictCheck = await prisma.family.findFirst({ where: { headNationalId: tempNationalId } })
        const finalNationalId = conflictCheck ? `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : tempNationalId

        const newFamily = await prisma.family.create({
          data: {
            headFullName:   guardianName,
            headNationalId: finalNationalId,
            subDistrictId,
            isActive:       true,
            createdById:    adminUser?.id || (await prisma.user.findFirst())!.id,
          },
        })
        resolvedFamilyId = newFamily.id
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const orphan = await prisma.beneficiary.create({
      data: {
        familyId:          resolvedFamilyId!,
        category:          "ORPHAN",
        createdById:       orphanData.createdById || null,
        fullName:          orphanData.fullName,
        shortName:         orphanData.shortName || null,
        gender:            orphanData.gender,
        birthdate:         new Date(orphanData.birthdate),
        nationalId:        orphanData.nationalId || null,
        religion:          orphanData.religion || null,
        orphanCode:        orphanData.orphanCode || null,
        kuraimiAccount:    orphanData.kuraimiAccount || null,
        kuraimiAccountOld:    orphanData.kuraimiAccountOld    || null,
        kuraimiAccountHolder:  orphanData.kuraimiAccountHolder || null,
        mumaiyo:           orphanData.mumaiyo || null,
        baitZakatNumber:   orphanData.baitZakatNumber || null,
        educationLevel:    orphanData.educationLevel || null,
        schoolName:        orphanData.schoolName || null,
        educationalStage:  orphanData.educationalStage || null,
        averageGrade:      (orphanData.averageGrade !== undefined && orphanData.averageGrade !== null && orphanData.averageGrade !== "") ? Number(orphanData.averageGrade) : null,
        educationalNeeds:  orphanData.educationalNeeds || null,
        quranMemorization: orphanData.quranMemorization || null,
        healthStatus:      orphanData.healthStatus || null,
        disabilityType:    orphanData.disabilityType || null,
        disability:        orphanData.disability || false,
        disabilityDetails: orphanData.disabilityDetails || null,
        nutritionStatus:   orphanData.nutritionStatus || null,
        housingStatus:     orphanData.housingStatus || null,
        orphanType:        orphanData.orphanType || null,
        fatherFullName:    orphanData.fatherFullName || null,
        fatherDeathDate:   orphanData.fatherDeathDate ? new Date(orphanData.fatherDeathDate) : null,
        fatherDeathCause:  orphanData.fatherDeathCause || null,
        motherDeathDate:   orphanData.motherDeathDate ? new Date(orphanData.motherDeathDate) : null,
        motherName:        orphanData.motherName || null,
        birthGovernorate:  orphanData.birthGovernorate || null,
        birthDistrict:     orphanData.birthDistrict || null,
        birthVillage:      orphanData.birthVillage || null,
        birthArea:         orphanData.birthArea || null,
        referrerName:      orphanData.referrerName || null,
        referrerPhone1:    orphanData.referrerPhone1 || null,
        referrerPhone2:    orphanData.referrerPhone2 || null,
        marketedToOrg:     orphanData.marketedToOrg || null,
        notes:             orphanData.notes || null,
      },
    })

    // إضافة المعيلين
    if (guardians.length > 0) {
      await upsertGuardians(orphan.id, guardians)
    }

    // إضافة الإخوة
    if (siblings.length > 0) {
      await upsertSiblings(orphan.id, siblings)
    }

    revalidatePath("/dashboard/orphans")
    return { success: true, orphan, message: `تم إضافة اليتيم "${orphan.fullName}" بنجاح` }
  } catch (error: any) {
    console.error("createFullOrphan error:", error)
    if (error.code === "P2002") {
      return { success: false, error: "رقم الملف أو الهوية مكرر في النظام" }
    }
    return { success: false, error: "فشل إضافة اليتيم" }
  }
}

// =============================================================================
// UPDATE FULL ORPHAN
// =============================================================================

export async function updateFullOrphan(
  id: string,
  data: Parameters<typeof createFullOrphan>[0],
  resetStatus = false   // عند التعديل من المسوق، يُعاد الوضع لـ PENDING
) {
  try {
    const { guardians = [], siblings = [], familyId, ...orphanData } = data

    const updateData: any = {
      fullName:          orphanData.fullName,
      shortName:         orphanData.shortName || null,
      gender:            orphanData.gender,
      birthdate:         new Date(orphanData.birthdate),
      nationalId:        orphanData.nationalId || null,
      religion:          orphanData.religion || null,
      orphanCode:        orphanData.orphanCode || null,
      kuraimiAccount:    orphanData.kuraimiAccount || null,
      kuraimiAccountOld:    orphanData.kuraimiAccountOld    || null,
      kuraimiAccountHolder:  orphanData.kuraimiAccountHolder || null,
      mumaiyo:           orphanData.mumaiyo || null,
      baitZakatNumber:   orphanData.baitZakatNumber || null,
      educationLevel:    orphanData.educationLevel || null,
      schoolName:        orphanData.schoolName || null,
      educationalStage:  orphanData.educationalStage || null,
      averageGrade:      (orphanData.averageGrade !== undefined && orphanData.averageGrade !== null && orphanData.averageGrade !== "") ? Number(orphanData.averageGrade) : null,
      educationalNeeds:  orphanData.educationalNeeds || null,
      quranMemorization: orphanData.quranMemorization || null,
      healthStatus:      orphanData.healthStatus || null,
      disabilityType:    orphanData.disabilityType || null,
      disability:        orphanData.disability || false,
      disabilityDetails: orphanData.disabilityDetails || null,
      nutritionStatus:   orphanData.nutritionStatus || null,
      housingStatus:     orphanData.housingStatus || null,
      orphanType:        orphanData.orphanType || null,
      fatherFullName:    orphanData.fatherFullName || null,
      fatherDeathDate:   orphanData.fatherDeathDate ? new Date(orphanData.fatherDeathDate) : null,
      fatherDeathCause:  orphanData.fatherDeathCause || null,
      motherDeathDate:   orphanData.motherDeathDate ? new Date(orphanData.motherDeathDate) : null,
      motherName:        orphanData.motherName || null,
      birthGovernorate:  orphanData.birthGovernorate || null,
      birthDistrict:     orphanData.birthDistrict || null,
      birthVillage:      orphanData.birthVillage || null,
      birthArea:         orphanData.birthArea || null,
      referrerName:      orphanData.referrerName || null,
      referrerPhone1:    orphanData.referrerPhone1 || null,
      referrerPhone2:    orphanData.referrerPhone2 || null,
      marketedToOrg:     orphanData.marketedToOrg || null,
      notes:             orphanData.notes || null,
    }

    // إعادة الحالة لـ PENDING عند تعديل الطلب المرفوض من المسوق
    if (resetStatus) {
      updateData.verificationStatus = "PENDING"
      updateData.rejectionReason    = null
    }

    const orphan = await prisma.beneficiary.update({
      where: { id },
      data: updateData,
    })

    await upsertGuardians(id, guardians)
    await upsertSiblings(id, siblings)

    revalidatePath("/dashboard/orphans")
    return { success: true, orphan, message: `تم تحديث بيانات "${orphan.fullName}"` }
  } catch (error: any) {
    console.error("updateFullOrphan error:", error)
    return { success: false, error: "فشل تحديث البيانات" }
  }
}
