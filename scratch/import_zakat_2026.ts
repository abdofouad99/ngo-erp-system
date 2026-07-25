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

function safeDate(val: any, defaultDate: Date = new Date("2012-01-01")): Date {
  if (!val) return defaultDate
  const d = new Date(val)
  if (isNaN(d.getTime())) return defaultDate
  return d
}

function safeNullableDate(val: any): Date | null {
  if (!val) return null
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  return d
}

async function main() {
  console.log("🚀 بدء استيراد أيتام بيت الزكاة (الجهة المموله: بيت الزكاة)...")

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

  // Ensure Sponsor "بيت الزكاة"
  let zakatSponsor = await prisma.sponsor.findFirst({ where: { fullName: "بيت الزكاة" } })
  if (!zakatSponsor) {
    zakatSponsor = await prisma.sponsor.create({
      data: {
        fullName: "بيت الزكاة",
        organization: "بيت الزكاة الكويتي",
        country: "الكويت",
        notes: "الجهة الممولة لكفالة الأيتام لعام 2026",
      },
    })
  }

  // Load JSON Data
  const jsonPath = path.join(scratchDir, "zakat_2026_parsed.json")
  const parsedData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
  const parsedFamilies: any[] = parsedData.families
  const parsedOrphans: any[] = parsedData.orphans

  console.log(`📦 جاري تحضير ${parsedFamilies.length} أسرة و ${parsedOrphans.length} يتيم كفالة بيت الزكاة...`)

  // Prepare Families Array
  const familiesData: any[] = []
  const familyKeyToId = new Map<string, string>()

  let famCounter = 2000
  for (const f of parsedFamilies) {
    famCounter++
    const customId = `fam-zakat-${famCounter}-${Math.random().toString(36).substring(2, 6)}`
    const nationalId = f.headNationalId && f.headNationalId.length >= 5 
      ? f.headNationalId 
      : `ID-FAM-ZAKAT-${famCounter}-${Math.random().toString(36).substring(2, 6)}`

    familyKeyToId.set(f.key, customId)

    familiesData.push({
      id: customId,
      headFullName: f.headFullName || "غير مدون",
      headNationalId: nationalId,
      headPhoneNumber: f.headPhoneNumber || null,
      headAltPhone: f.headAltPhone || null,
      addressDetail: f.addressDetail || null,
      notes: f.notes || "كفالة بيت الزكاة 2026",
      subDistrictId: defaultSubDist.id,
      familyMembersCount: f.members_count || 1,
      createdById: admin.id,
      isActive: true,
    })
  }

  // Batch insert Families
  console.log("🚀 جاري إدراج الأسر التابعة لبيت الزكاة (createMany)...")
  await prisma.family.createMany({
    data: familiesData,
    skipDuplicates: true,
  })
  console.log("✅ تم إدراج كافة الأسر بنجاح!")

  // Prepare Orphans Array
  let orphanCounter = 2000
  const orphansData = parsedOrphans.map((o) => {
    orphanCounter++
    const targetFamilyId = familyKeyToId.get(o.familyKey) || familiesData[0].id
    const nationalId = o.nationalId && o.nationalId.length >= 4 
      ? o.nationalId 
      : `ORF-ZAKAT-${orphanCounter}-${Math.random().toString(36).substring(2, 6)}`

    return {
      fullName: o.fullName,
      shortName: o.shortName || null,
      gender: o.gender === "FEMALE" ? Gender.FEMALE : Gender.MALE,
      birthdate: safeDate(o.birthdate),
      nationalId: nationalId,
      category: BeneficiaryCategory.ORPHAN,
      orphanCode: o.orphanCode || `ZAKAT-CODE-${orphanCounter}`,
      mumaiyo: o.mumaiyo || null,
      kuraimiAccount: o.kuraimiAccount || null,
      kuraimiAccountOld: o.kuraimiAccountOld || null,
      educationLevel: o.educationLevel || null,
      schoolName: o.schoolName || null,
      educationalStage: o.educationalStage || null,
      notes: o.notes || null,
      motherName: o.motherName || null,
      fatherDeathDate: safeNullableDate(o.fatherDeathDate),
      fatherDeathCause: o.fatherDeathCause || null,
      healthStatus: o.healthStatus || null,
      baitZakatNumber: o.orphanCode || null,
      verificationStatus: VerificationStatus.APPROVED,
      familyId: targetFamilyId,
      createdById: admin.id,
      isActive: true,
    }
  })

  console.log("🚀 جاري إدراج 720 يتيم من بيت الزكاة بالكامل...")
  await prisma.beneficiary.createMany({
    data: orphansData,
    skipDuplicates: true,
  })

  const finalFamiliesCount = await prisma.family.count()
  const finalOrphansCount = await prisma.beneficiary.count()

  console.log(`\n🎉 اكتمل استيراد ملف أيتام بيت الزكاة 2026 بنجاح!`)
  console.log(`📊 إحصائيات البيانات في قاعدة البيانات الآن:`)
  console.log(`  - إجمالي الأيتام المستوردين من بيت الزكاة: ${finalOrphansCount}`)
  console.log(`  - إجمالي الأسر: ${finalFamiliesCount}\n`)
}

main()
  .catch((e) => {
    console.error("❌ خطأ أثناء استيراد أيتام بيت الزكاة:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
