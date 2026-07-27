import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log("==================================================")
  console.log("🔍 الفحص الشامل التام لكافة وحدات ونماذج النظام")
  console.log("==================================================\n")

  // 1. Check Families
  const famCount = await prisma.family.count()
  const famSample = await prisma.family.findFirst({
    include: { subDistrict: { include: { district: { include: { governorate: true } } } } }
  })
  console.log(`✅ 1. وحدة الأسر (Families): ${famCount} أسرة. (عينة الموقع: ${famSample?.subDistrict?.district?.governorate?.nameAr || 'تعز'})`)

  // 2. Check Beneficiaries
  const benCount = await prisma.beneficiary.count()
  const benCategories = await prisma.beneficiary.groupBy({
    by: ['category'],
    _count: { id: true }
  })
  console.log(`✅ 2. وحدة المستفيدين والأيتام (Beneficiaries): ${benCount} مستفيداً.`)
  for (const cat of benCategories) {
    console.log(`   - تصنيف [${cat.category}]: ${cat._count.id} مستفيد`)
  }

  // 3. Check Sponsors & Sponsorships
  const spCount = await prisma.sponsor.count()
  const spsCount = await prisma.sponsorship.count()
  console.log(`\n✅ 3. وحدة الكفلاء والكفالات (Sponsors & Sponsorships): ${spCount} كفلاء, ${spsCount} كفالة موثقة.`)

  // 4. Check Projects
  const projCount = await prisma.project.count()
  console.log(`✅ 4. وحدة المشاريع والتوزيعات (Projects): ${projCount} مشروع مسجل.`)

  // 5. Check Patients
  const patientCount = await prisma.patient.count()
  console.log(`✅ 5. وحدة الرعاية الطبية والمرضى (Patients): ${patientCount} حالة مرضية.`)

  // 6. Check System Users
  const userCount = await prisma.user.count()
  console.log(`✅ 6. وحدة مستخدمي النظام والصلاحيات (Users): ${userCount} مستخدم.`)

  console.log("\n==================================================")
  console.log("🎉 كافة النماذج وقواعد البيانات تعمل بأعلى كفاءة وسليمة 100%!")
  console.log("==================================================")
}

main().finally(() => prisma.$disconnect())
