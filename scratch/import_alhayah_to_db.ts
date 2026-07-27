import { PrismaClient, PaymentCycle, Role, BeneficiaryCategory } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log("⚡ جاري رفع واستيراد بيانات أسرة مؤسسة الحياة الخيرية إلى قاعدة البيانات...")

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

  const jsonPath = path.join(process.cwd(), "src", "data", "alhayah_parsed.json")
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found at ${jsonPath}`)
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8")
  const alhayahData = JSON.parse(rawData)

  // 1. Find or create Sponsor: مؤسسة الحياة الخيرية
  let sponsor = await prisma.sponsor.findFirst({
    where: { fullName: { contains: "الحياة" } },
  })

  if (!sponsor) {
    sponsor = await prisma.sponsor.create({
      data: {
        fullName: "مؤسسة الحياة الخيرية",
        organization: "مؤسسة الحياة الخيرية - اليمن",
        country: "اليمن",
        phone: "777930032",
        email: "alhayah@ngo.com",
        notes: "جهة كافلة رسمية للأسر المتعففة في اليمن",
      },
    })
    console.log("✅ تم إنشاء الكفيل الجديد: مؤسسة الحياة الخيرية")
  } else {
    console.log(`✅ تم العثور على الكفيل: ${sponsor.fullName}`)
  }

  // 2. Find or create Admin User
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

  // 3. Get any valid subDistrict
  let subDistrict = await prisma.subDistrict.findFirst()
  if (!subDistrict) {
    const gov = await prisma.governorate.create({ data: { nameAr: "تعز" } })
    const dist = await prisma.district.create({ data: { nameAr: "المظفر", governorateId: gov.id } })
    subDistrict = await prisma.subDistrict.create({ data: { nameAr: "تعز المدينة", districtId: dist.id } })
  }

  let importedFamiliesCount = 0
  let importedMembersCount = 0

  for (const fam of alhayahData.families) {
    // Check if headFullName exists already
    let createdFamily = await prisma.family.findFirst({ where: { headFullName: fam.headName } })
    
    if (!createdFamily) {
      const nationalId = `HAYAH-NAT-${Math.floor(100000000 + Math.random() * 900000000)}`
      
      // Create Family
      createdFamily = await prisma.family.create({
        data: {
          headFullName: fam.headName,
          headNationalId: nationalId,
          headGender: fam.headRole.includes("الأم") ? "FEMALE" : "MALE",
          subDistrictId: subDistrict.id,
          housingType: fam.housingType,
          rentAmount: fam.rentAmount ? parseFloat(fam.rentAmount.replace(/[^0-9.]/g, '')) || null : null,
          headPhoneNumber: fam.phone,
          addressDetail: fam.address,
          notes: `كفالة أسر متعففة - مؤسسة الحياة الخيرية. ${fam.statusSummary}`,
          manualMembersCount: fam.members.length,
          createdById: admin.id,
        },
      })
      importedFamiliesCount++
    }

    // Create Family Members / Beneficiaries
    for (const mem of fam.members) {
      const fullName = `${mem.name} ${fam.headName}`
      const existingBen = await prisma.beneficiary.findFirst({
        where: { familyId: createdFamily.id, fullName: fullName }
      })

      if (existingBen) continue

      const orphanCode = `HAYAH-${Math.floor(100000 + Math.random() * 900000)}`
      
      const createdBeneficiary = await prisma.beneficiary.create({
        data: {
          familyId: createdFamily.id,
          fullName: fullName,
          orphanCode: orphanCode,
          category: BeneficiaryCategory.GENERAL,
          gender: mem.relation.includes("بنت") || mem.relation.includes("أخت") ? "FEMALE" : "MALE",
          relationshipToHead: mem.relation,
          educationalStage: mem.educationStage,
          birthdate: mem.birthYear && !isNaN(Number(mem.birthYear)) ? new Date(`${mem.birthYear}-01-01`) : new Date("2015-01-01"),
          isActive: true,
          notes: `عضو أسرة متعففة - كفالة مؤسسة الحياة الخيرية`,
        },
      })

      // Link Sponsorship
      await prisma.sponsorship.create({
        data: {
          beneficiary: { connect: { id: createdBeneficiary.id } },
          family: { connect: { id: createdFamily.id } },
          sponsor: { connect: { id: sponsor.id } },
          createdBy: { connect: { id: admin.id } },
          amount: 100,
          currency: "SAR",
          paymentCycle: PaymentCycle.MONTHLY,
          startDate: new Date("2025-01-01"),
          status: "ACTIVE",
          notes: "كفالة أسر متعففة - مؤسسة الحياة",
        },
      })
      importedMembersCount++
    }
  }

  const totalFamInDb = await prisma.family.count()
  const totalBenInDb = await prisma.beneficiary.count()
  const totalSponsInDb = await prisma.sponsorship.count()

  console.log(`🎉 تم استيراد وتوثيق جميع البيانات بنجاح!`)
  console.log(`- الأسر المستوردة مؤخراً: ${importedFamiliesCount}`)
  console.log(`- الأفراد المستوردون مؤخراً: ${importedMembersCount}`)
  console.log(`- إجمالي الأسر في قاعدة البيانات: ${totalFamInDb}`)
  console.log(`- إجمالي المستفيدين في قاعدة البيانات: ${totalBenInDb}`)
  console.log(`- إجمالي الكفالات الموثقة في قاعدة البيانات: ${totalSponsInDb}`)
}

main().catch(err => {
  console.error("IMPORT_ERROR:", err)
}).finally(() => prisma.$disconnect())
