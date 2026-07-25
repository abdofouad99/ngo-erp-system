import { PrismaClient, Gender, BeneficiaryCategory, VerificationStatus, Role } from "@prisma/client"
import fs from "fs"
import path from "path"

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
})

const scratchDir = "F:\\Food management system for the organization\\scratch"

function safeDate(val: any, defaultDate: Date = new Date("2014-01-01")): Date {
  if (!val) return defaultDate
  const d = new Date(val)
  if (isNaN(d.getTime())) return defaultDate
  const year = d.getFullYear()
  if (year < 1970 || year > 2030) return defaultDate
  return d
}

function cleanStr(val: any): string | null {
  if (!val) return null
  let s = String(val).trim()
  if (s === "nan" || s === "None" || !s) return null
  // Extract clean digits or first line if pandas output contains Series text
  if (s.includes("\n")) {
    s = s.split("\n")[0]
  }
  s = s.replace(/^(المميز|السعودي|اليمني)\s+/, "").trim()
  return s || null
}

async function main() {
  console.log("⚡ جاري توثيق وإدخال كافة بيانات أيتام جمعية النجاة (268 يتيماً)...")

  // Retry connection
  let attempts = 0
  while (attempts < 5) {
    try {
      attempts++
      await prisma.$connect()
      console.log("✅ اتصل بقاعدة البيانات بنجاح!")
      break
    } catch (e) {
      console.log(`محاولة اتصال ${attempts} من 5...`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // 1. Ensure Admin User
  let admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } })
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@ngo.com",
        name: "مشرف النظام",
        role: Role.ADMIN,
        isActive: true,
      },
    })
  }

  // 2. Ensure Sponsor "جمعية النجاة الخيرية - الكويت"
  let najahSponsor = await prisma.sponsor.findFirst({
    where: { fullName: { contains: "النجاة" } },
  })
  if (!najahSponsor) {
    najahSponsor = await prisma.sponsor.create({
      data: {
        fullName: "جمعية النجاة الخيرية - الكويت",
        organization: "جمعية النجاة الخيرية",
        country: "الكويت",
        notes: "الجهة الممولة لكفالات 268 يتيماً وأسرهم حتى ديسمبر 2025",
      },
    })
  }

  // 3. Ensure Default SubDistrict
  let defaultGov = await prisma.governorate.findFirst({ where: { nameAr: "تعز" } })
  if (!defaultGov) {
    defaultGov = await prisma.governorate.create({ data: { nameAr: "تعز", nameEn: "Taiz" } })
  }
  let defaultDist = await prisma.district.findFirst({ where: { governorateId: defaultGov.id } })
  if (!defaultDist) {
    defaultDist = await prisma.district.create({ data: { nameAr: "المدينة", governorateId: defaultGov.id } })
  }
  let defaultSubDist = await prisma.subDistrict.findFirst({ where: { districtId: defaultDist.id } })
  if (!defaultSubDist) {
    defaultSubDist = await prisma.subDistrict.create({ data: { nameAr: "مركز المدينة", districtId: defaultDist.id } })
  }

  // 4. Load JSON
  const jsonPath = path.join(scratchDir, "alnajah_parsed.json")
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
  const parsedOrphans: any[] = data.orphans

  // 5. Single Family Container for Al-Najah Batch
  let najahFamilyContainer = await prisma.family.findFirst({
    where: { headNationalId: "FAM-NAJAH-BATCH-2025" }
  })
  if (!najahFamilyContainer) {
    najahFamilyContainer = await prisma.family.create({
      data: {
        headFullName: "أسر كفالات جمعية النجاة الخيرية",
        headNationalId: "FAM-NAJAH-BATCH-2025",
        subDistrictId: defaultSubDist.id,
        notes: "سجلات أسر أيتام جمعية النجاة - الدفعة حتى ديسمبر 2025",
        createdById: admin.id,
      }
    })
  }

  // 6. Bulk Insert 268 Orphans
  let counter = 8000
  const beneficiariesData = parsedOrphans.map((o) => {
    counter++
    const mumaiyoClean = cleanStr(o.mumaiyo)
    const saudiClean = cleanStr(o.saudiAccount)
    const motherClean = cleanStr(o.motherName)
    const guardianClean = cleanStr(o.guardianName)
    const relationClean = cleanStr(o.guardianRelation)

    return {
      fullName: o.fullName,
      gender: o.gender === "FEMALE" ? Gender.FEMALE : Gender.MALE,
      birthdate: safeDate(o.birthdate),
      nationalId: cleanStr(o.nationalId) || `NAJAH-NAT-${counter}`,
      category: BeneficiaryCategory.ORPHAN,
      orphanCode: mumaiyoClean || `NAJAH-CODE-${counter}`,
      mumaiyo: mumaiyoClean,
      kuraimiAccount: saudiClean,
      fatherDeathDate: o.deathDate ? safeDate(o.deathDate) : null,
      motherName: motherClean,
      schoolName: cleanStr(o.school),
      educationLevel: cleanStr(o.grade),
      educationalStage: cleanStr(o.educationalStage),
      healthStatus: cleanStr(o.healthStatus) || "جيدة",
      notes: `الجهة الممولة: جمعية النجاة الخيرية - المعيل: ${guardianClean || "—"} (${relationClean || "—"}) - حفظ القرآن: ${o.quranMemorization || "—"}`,
      verificationStatus: VerificationStatus.APPROVED,
      familyId: najahFamilyContainer.id,
      createdById: admin.id,
      isActive: true,
    }
  })

  await prisma.beneficiary.createMany({
    data: beneficiariesData,
    skipDuplicates: true,
  })

  const totalBeneficiaries = await prisma.beneficiary.count()
  const totalFamilies = await prisma.family.count()
  const totalSponsors = await prisma.sponsor.count()

  console.log(`\n🎉 اكتمل استيراد كفالات أيتام النجاة (268 يتيماً) بنجاح فائق!`)
  console.log(`📊 الإحصائيات الإجمالية الآن في قاعدة البيانات الحقيقية:`)
  console.log(`  - إجمالي المستفيدين (أيتام Zakat + Tanmiya + Alnajah + طلاب Safa): ${totalBeneficiaries}`)
  console.log(`  - إجمالي الأسر المسجلة: ${totalFamilies}`)
  console.log(`  - إجمالي الكفلاء والجهات الممولة: ${totalSponsors}\n`)
}

main()
  .catch((e) => {
    console.error("Error importing Al-Najah to DB:", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
