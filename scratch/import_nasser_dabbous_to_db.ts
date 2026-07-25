import { PrismaClient, Role } from "@prisma/client"
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

function cleanStr(val: any): string | null {
  if (!val) return null
  let s = String(val).trim()
  if (s === "nan" || s === "None" || !s) return null
  if (s.includes("\n")) s = s.split("\n")[0]
  return s || null
}

async function main() {
  console.log("⚡ جاري استيراد وتوثيق مشروع كفالة الأسر المتعففة 2025 - ناصر الدبوس (25 أسرة)...")

  // Connection retry logic
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

  // 2. Ensure Sponsor "جمعية تنمية الخيرية - ناصر الدبوس"
  let tanmiyaDabbousSponsor = await prisma.sponsor.findFirst({
    where: { fullName: { contains: "تنمية" } },
  })
  if (!tanmiyaDabbousSponsor) {
    tanmiyaDabbousSponsor = await prisma.sponsor.create({
      data: {
        fullName: "جمعية تنمية الخيرية - ناصر الدبوس",
        organization: "جمعية تنمية الخيرية",
        country: "الكويت",
        notes: "الجهة الممولة لمشروع كفالة الأسر المتعففة 2025 - ناصر الدبوس",
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
  const jsonPath = path.join(scratchDir, "nasser_dabbous_parsed.json")
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
  const parsedFamilies: any[] = data.families

  // 5. Insert 25 Families
  let famCounter = 9000
  let insertedFamiliesCount = 0

  for (const f of parsedFamilies) {
    famCounter++
    const headName = cleanStr(f.fullName) || `رب أسرة متعففة ${famCounter}`
    const natId = cleanStr(f.nationalId) || `DABBOUS-NAT-${famCounter}`
    const saudiAcc = cleanStr(f.saudiAccount)
    const phoneNum = cleanStr(f.phone)
    const idType = cleanStr(f.idType) || "شخصية"
    const reason = cleanStr(f.supportReason) || "فقيرة متعففة"
    const countMembers = parseInt(f.membersCount || "5") || 5
    
    // Check if family exists
    let existingFam = await prisma.family.findFirst({
      where: {
        OR: [
          { headNationalId: natId },
          { headFullName: headName }
        ]
      }
    })

    const notesText = `مشروع كفالة الأسر المتعففة 2025 - ناصر الدبوس (تنمية) - نوع البطاقة: ${idType} - سبب الإعالة: ${reason} - عدد الأفراد: ${countMembers} - حساب الكريمي: ${saudiAcc || "—"} - تلفون: ${phoneNum || "—"}`

    if (!existingFam) {
      existingFam = await prisma.family.create({
        data: {
          headFullName: headName,
          headNationalId: natId,
          headIdType: idType,
          subDistrictId: defaultSubDist.id,
          headPhoneNumber: phoneNum,
          kuraimiAccountSaudi: saudiAcc,
          manualMembersCount: countMembers,
          notes: notesText,
          createdById: admin.id,
        }
      })
      insertedFamiliesCount++
    } else {
      // Update existing family details
      await prisma.family.update({
        where: { id: existingFam.id },
        data: {
          headPhoneNumber: phoneNum || existingFam.headPhoneNumber,
          kuraimiAccountSaudi: saudiAcc || existingFam.kuraimiAccountSaudi,
          manualMembersCount: countMembers || existingFam.manualMembersCount,
          notes: `${existingFam.notes || ""} | ${notesText}`
        }
      })
    }
  }

  const totalFamilies = await prisma.family.count()
  const totalBeneficiaries = await prisma.beneficiary.count()
  const totalSponsors = await prisma.sponsor.count()

  console.log(`\n🎉 اكتمل استيراد مشروع الأسر المتعففة 2025 - ناصر الدبوس (25 أسرة) بنجاح فائق!`)
  console.log(`📊 الإحصائيات الإجمالية الآن في قاعدة البيانات الحقيقية:`)
  console.log(`  - إجمالي الأسر المسجلة بالكامل: ${totalFamilies}`)
  console.log(`  - إجمالي الأيتام والطلاب المستفيدين: ${totalBeneficiaries}`)
  console.log(`  - إجمالي الكفلاء والجهات الممولة: ${totalSponsors}\n`)
}

main()
  .catch((e) => {
    console.error("Error importing Nasser Dabbous Families to DB:", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
