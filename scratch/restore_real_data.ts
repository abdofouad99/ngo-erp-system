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
  console.log("⚡ بدء استعادة فائقة السرعة للأيتام والأسر الحقيقية بالكامل...")

  // Clean current temp data
  await prisma.beneficiary.deleteMany({})
  await prisma.family.deleteMany({})

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

  // Load JSON Data
  const f1Families: any[] = JSON.parse(fs.readFileSync(path.join(scratchDir, "f1_families.json"), "utf-8"))
  const f2Families: any[] = JSON.parse(fs.readFileSync(path.join(scratchDir, "f2_families.json"), "utf-8"))
  const f1Orphans: any[] = JSON.parse(fs.readFileSync(path.join(scratchDir, "f1_orphans.json"), "utf-8"))

  console.log(`📦 جاري تحضير ${f1Families.length + f2Families.length} أسرة حقيقية و ${f1Orphans.length} يتيم حقيقي...`)

  // Prepare Families Array
  const familiesData: any[] = []
  const familyKeyToId = new Map<string, string>()

  const allFamilies = [...f1Families, ...f2Families]
  let famCounter = 1000

  for (const f of allFamilies) {
    famCounter++
    const customId = `fam-real-${famCounter}-${Math.random().toString(36).substring(2, 6)}`
    const nationalId = f.headNationalId && f.headNationalId.length >= 5 
      ? f.headNationalId 
      : `ID-FAM-${famCounter}-${Math.random().toString(36).substring(2, 6)}`

    familyKeyToId.set(f.key, customId)

    familiesData.push({
      id: customId,
      headFullName: f.headFullName || "غير مدون",
      headNationalId: nationalId,
      headPhoneNumber: f.headPhoneNumber || null,
      headAltPhone: f.headAltPhone || null,
      addressDetail: f.addressDetail || null,
      notes: f.notes || null,
      subDistrictId: defaultSubDist.id,
      familyMembersCount: f.members_count || 1,
      createdById: admin.id,
      isActive: true,
    })
  }

  // Batch insert Families
  console.log("🚀 جاري إدراج الأسر (createMany)...")
  await prisma.family.createMany({
    data: familiesData,
    skipDuplicates: true,
  })
  console.log("✅ تم إدراج الأسر الحقيقية بنجاح!")

  // Insert Orphans in batch via createMany
  console.log(`🚀 جاري إدراج 735 يتيم حقيقي في استعلام مجمّع...`)
  let orphanCounter = 1000

  const orphansData = f1Orphans.map((o) => {
    orphanCounter++
    const targetFamilyId = familyKeyToId.get(o.familyKey) || familiesData[0].id
    const nationalId = o.nationalId && o.nationalId.length >= 4 
      ? o.nationalId 
      : `ORF-NAT-${orphanCounter}-${Math.random().toString(36).substring(2, 6)}`

    return {
      fullName: o.fullName,
      gender: o.gender === "FEMALE" ? Gender.FEMALE : Gender.MALE,
      birthdate: safeDate(o.birthdate),
      nationalId: nationalId,
      category: BeneficiaryCategory.ORPHAN,
      orphanCode: o.orphanCode || null,
      kuraimiAccount: o.kuraimiAccount || null,
      educationLevel: o.educationLevel || null,
      schoolName: o.schoolName || null,
      educationalStage: o.educationalStage || null,
      notes: o.notes || null,
      motherName: o.motherName || null,
      fatherDeathDate: safeNullableDate(o.fatherDeathDate),
      fatherDeathCause: o.fatherDeathCause || null,
      healthStatus: o.healthStatus || null,
      verificationStatus: VerificationStatus.APPROVED,
      familyId: targetFamilyId,
      createdById: admin.id,
      isActive: true,
    }
  })

  await prisma.beneficiary.createMany({
    data: orphansData,
    skipDuplicates: true,
  })

  const finalFamiliesCount = await prisma.family.count()
  const finalOrphansCount = await prisma.beneficiary.count()

  console.log(`\n🎉 اكتملت عملية استعادة الأيتام والأسر الحقيقية بنجاح تام!`)
  console.log(`📊 إحصائيات البيانات الحقيقية في قاعدة البيانات الآن:`)
  console.log(`  - إجمالي الأسر الحقيقية: ${finalFamiliesCount}`)
  console.log(`  - إجمالي الأيتام والمستفيدين الحقيقيين: ${finalOrphansCount}\n`)
}

main()
  .catch((e) => {
    console.error("❌ خطأ أثناء استعادة البيانات:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
