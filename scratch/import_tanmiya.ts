import { PrismaClient, Gender, BeneficiaryCategory, VerificationStatus, Role } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.DIRECT_URL,
    },
  },
})

const scratchDir = "C:\\Users\\my computer\\.gemini\\antigravity\\brain\\b1f67750-12b1-4ef0-90a2-b46de15cbea6\\scratch"

function safeDate(val: any, defaultDate: Date = new Date("2015-01-01")): Date {
  if (!val) return defaultDate
  const d = new Date(val)
  if (isNaN(d.getTime())) return defaultDate
  return d
}

async function main() {
  console.log("🚀 بدء استيراد الملف الثاني: أيتام جمعية تنمية الخيرية (25 يتيم)...")

  // Ensure Admin User
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

  // Ensure Default SubDistrict
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

  // Ensure Sponsor "جمعية تنمية الخيرية"
  let tanmiyaSponsor = await prisma.sponsor.findFirst({ where: { fullName: "جمعية تنمية الخيرية" } })
  if (!tanmiyaSponsor) {
    tanmiyaSponsor = await prisma.sponsor.create({
      data: {
        fullName: "جمعية تنمية الخيرية",
        organization: "جمعية تنمية الخيرية - الكويت",
        country: "الكويت",
        notes: "جهة ممولة لمشروع كفالتهم جنة (25 يتيم)",
      },
    })
  }

  // Load JSON Data
  const jsonPath = path.join(scratchDir, "tanmiya_parsed.json")
  const parsedData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
  const parsedFamilies: any[] = parsedData.families
  const parsedOrphans: any[] = parsedData.orphans

  console.log(`📦 جاري تحضير ${parsedFamilies.length} أسرة و ${parsedOrphans.length} يتيم لجمعية تنمية الخيرية...`)

  // Prepare Families Array
  const familiesData: any[] = []
  const familyKeyToId = new Map<string, string>()

  let famCounter = 3000
  for (const f of parsedFamilies) {
    famCounter++
    const customId = `fam-tanmiya-${famCounter}-${Math.random().toString(36).substring(2, 6)}`
    const nationalId = `ID-FAM-TANMIYA-${famCounter}-${Math.random().toString(36).substring(2, 6)}`

    familyKeyToId.set(f.key, customId)

    familiesData.push({
      id: customId,
      headFullName: f.headFullName || "أسرة اليتيم",
      headNationalId: nationalId,
      headPhoneNumber: f.headPhoneNumber || null,
      headAltPhone: f.headAltPhone || null,
      addressDetail: f.addressDetail || null,
      notes: f.notes || "كفالة جمعية تنمية الخيرية (مشروع كفالتهم جنة)",
      subDistrictId: defaultSubDist.id,
      familyMembersCount: f.members_count || 1,
      createdById: admin.id,
      isActive: true,
    })
  }

  // Batch insert Families
  console.log("🚀 جاري إدراج الأسر التابعة لجمعية تنمية الخيرية (createMany)...")
  await prisma.family.createMany({
    data: familiesData,
    skipDuplicates: true,
  })
  console.log("✅ تم إدراج أسر تنمية الخيرية بنجاح!")

  // Prepare Orphans Array
  let orphanCounter = 3000
  const orphansData = parsedOrphans.map((o) => {
    orphanCounter++
    const targetFamilyId = familyKeyToId.get(o.familyKey) || familiesData[0].id
    const nationalId = `ORF-TANMIYA-${orphanCounter}-${Math.random().toString(36).substring(2, 6)}`

    return {
      fullName: o.fullName,
      gender: o.gender === "FEMALE" ? Gender.FEMALE : Gender.MALE,
      birthdate: safeDate(o.birthdate),
      nationalId: nationalId,
      category: BeneficiaryCategory.ORPHAN,
      orphanCode: `TANMIYA-CODE-${orphanCounter}`,
      educationLevel: o.educationLevel || null,
      educationalStage: o.educationalStage || null,
      notes: o.notes || null,
      fatherDeathCause: o.fatherDeathCause || "توفي والده",
      healthStatus: o.healthStatus || "سليم",
      verificationStatus: VerificationStatus.APPROVED,
      familyId: targetFamilyId,
      createdById: admin.id,
      isActive: true,
    }
  })

  console.log("🚀 جاري إدراج الـ 25 يتيم لجمعية تنمية الخيرية بالكامل...")
  await prisma.beneficiary.createMany({
    data: orphansData,
    skipDuplicates: true,
  })

  const finalFamiliesCount = await prisma.family.count()
  const finalOrphansCount = await prisma.beneficiary.count()
  const finalSponsorsCount = await prisma.sponsor.count()

  console.log(`\n🎉 اكتمل استيراد ملف أيتام جمعية تنمية الخيرية بنجاح!`)
  console.log(`📊 إحصائيات البيانات الإجمالية في قاعدة البيانات الآن:`)
  console.log(`  - إجمالي الأيتام في النظام: ${finalOrphansCount} يتيم (720 من بيت الزكاة + 25 من تنمية الخيرية)`)
  console.log(`  - إجمالي الأسر في النظام: ${finalFamiliesCount} أسرة`)
  console.log(`  - إجمالي الجهات الكافلة/الكفلاء: ${finalSponsorsCount}\n`)
}

main()
  .catch((e) => {
    console.error("❌ خطأ أثناء استيراد أيتام تنمية الخيرية:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
