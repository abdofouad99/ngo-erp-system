import { PrismaClient, Gender, BeneficiaryCategory, VerificationStatus, Role } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
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

async function main() {
  console.log("⚡ جاري توثيق وإدراج كافة بيانات برنامج الصفا للقرآن والدعاة في قاعدة البيانات...")

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

  // Ensure Sponsor "جمعية الصفا الخيرية"
  let safaSponsor = await prisma.sponsor.findFirst({ where: { fullName: "جمعية الصفا الخيرية - الكويت" } })
  if (!safaSponsor) {
    safaSponsor = await prisma.sponsor.create({
      data: {
        fullName: "جمعية الصفا الخيرية - الكويت",
        organization: "جمعية الصفا الإنسانية الخيرية",
        country: "الكويت",
        notes: "الجهة الممولة لكفالة ودعم القرآن الكريم والدعاة",
      },
    })
  }

  // Load JSON
  const jsonPath = path.join(scratchDir, "safa_program_parsed.json")
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
  const huffaz: any[] = data.huffaz

  // Create a default Safa Family container if needed
  let safaFamily = await prisma.family.findFirst({ where: { headNationalId: "FAM-SAFA-PROGRAM-2026" } })
  if (!safaFamily) {
    safaFamily = await prisma.family.create({
      data: {
        headFullName: "أسر حُفّاظ جمعية الصفا",
        headNationalId: "FAM-SAFA-PROGRAM-2026",
        subDistrictId: defaultSubDist.id,
        notes: "أسر مستفيدي برنامج كفالة القرآن والدعاة - جمعية الصفا",
        createdById: admin.id,
      },
    })
  }

  // Insert 102 Huffaz into Beneficiary table under STUDENT category
  let counter = 4000
  const beneficiariesData = huffaz.map((h) => {
    counter++
    return {
      fullName: h.fullName,
      gender: h.gender === "FEMALE" ? Gender.FEMALE : Gender.MALE,
      birthdate: safeDate(h.birthdate),
      nationalId: h.nationalId || `SAFA-NAT-${counter}`,
      category: BeneficiaryCategory.STUDENT,
      orphanCode: h.mumaiyo || `SAFA-CODE-${counter}`,
      mumaiyo: h.mumaiyo || null,
      kuraimiAccount: h.saudiAccount || null,
      educationLevel: h.grade || null,
      schoolName: h.schoolOrUniversity || null,
      educationalStage: h.educationalStage || null,
      notes: `مركز: ${h.quranCenter || "—"} - حلقة: ${h.quranCircle || "—"} - حفظ: ${h.quranMemorized || "—"}`,
      healthStatus: h.healthStatus || "سليمة",
      verificationStatus: VerificationStatus.APPROVED,
      familyId: safaFamily.id,
      createdById: admin.id,
      isActive: true,
    }
  })

  await prisma.beneficiary.createMany({
    data: beneficiariesData,
    skipDuplicates: true,
  })

  const totalBeneficiaries = await prisma.beneficiary.count()
  const totalSponsors = await prisma.sponsor.count()

  console.log(`\n🎉 تم توثيق برنامج الصفا للقرآن والدعاة بنجاح في قاعدة البيانات PostgreSQL!`)
  console.log(`📊 الإحصائيات الإجمالية الآن:`)
  console.log(`  - إجمالي المستفيدين في النظام (أيتام + طلاب حفاظ): ${totalBeneficiaries}`)
  console.log(`  - إجمالي الجهات الممولة والكفلاء: ${totalSponsors}\n`)
}

main()
  .catch((e) => {
    console.error("Error inserting Safa to DB:", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
