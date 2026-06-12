"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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
  familyId:          string
  // شخصية
  fullName:          string
  shortName?:        string
  gender:            "MALE" | "FEMALE"
  birthdate:         string
  nationalId?:       string
  religion?:         string
  // حسابات
  orphanCode?:       string
  kuraimiAccount?:   string
  kuraimiAccountOld?: string
  mumaiyo?:          string
  baitZakatNumber?:  string
  // تعليم
  educationLevel?:   string
  schoolName?:       string
  educationalStage?: string
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
  // علاقات
  guardians?:        any[]
  siblings?:         any[]
}) {
  try {
    const { guardians = [], siblings = [], ...orphanData } = data

    const orphan = await prisma.beneficiary.create({
      data: {
        familyId:          orphanData.familyId,
        category:          "ORPHAN",
        fullName:          orphanData.fullName,
        shortName:         orphanData.shortName || null,
        gender:            orphanData.gender,
        birthdate:         new Date(orphanData.birthdate),
        nationalId:        orphanData.nationalId || null,
        religion:          orphanData.religion || null,
        orphanCode:        orphanData.orphanCode || null,
        kuraimiAccount:    orphanData.kuraimiAccount || null,
        kuraimiAccountOld: orphanData.kuraimiAccountOld || null,
        mumaiyo:           orphanData.mumaiyo || null,
        baitZakatNumber:   orphanData.baitZakatNumber || null,
        educationLevel:    orphanData.educationLevel || null,
        schoolName:        orphanData.schoolName || null,
        educationalStage:  orphanData.educationalStage || null,
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

export async function updateFullOrphan(id: string, data: Parameters<typeof createFullOrphan>[0]) {
  try {
    const { guardians = [], siblings = [], familyId, ...orphanData } = data

    const orphan = await prisma.beneficiary.update({
      where: { id },
      data: {
        fullName:          orphanData.fullName,
        shortName:         orphanData.shortName || null,
        gender:            orphanData.gender,
        birthdate:         new Date(orphanData.birthdate),
        nationalId:        orphanData.nationalId || null,
        religion:          orphanData.religion || null,
        orphanCode:        orphanData.orphanCode || null,
        kuraimiAccount:    orphanData.kuraimiAccount || null,
        kuraimiAccountOld: orphanData.kuraimiAccountOld || null,
        mumaiyo:           orphanData.mumaiyo || null,
        baitZakatNumber:   orphanData.baitZakatNumber || null,
        educationLevel:    orphanData.educationLevel || null,
        schoolName:        orphanData.schoolName || null,
        educationalStage:  orphanData.educationalStage || null,
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

    await upsertGuardians(id, guardians)
    await upsertSiblings(id, siblings)

    revalidatePath("/dashboard/orphans")
    return { success: true, orphan, message: `تم تحديث بيانات "${orphan.fullName}"` }
  } catch (error: any) {
    console.error("updateFullOrphan error:", error)
    return { success: false, error: "فشل تحديث البيانات" }
  }
}
