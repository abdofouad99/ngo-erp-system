import { PrismaClient } from "@prisma/client"
import { calculateFamilyNeedScore } from "@/lib/need-score-calculator"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log("⚡ فحص واختبار حاسبة مؤشر الحاجة والهشاشة لعينات الأسر في قاعدة البيانات...")

  const sampleFamilies = await prisma.family.findMany({
    take: 5,
    include: {
      subDistrict: {
        include: {
          district: {
            include: { governorate: true }
          }
        }
      }
    }
  })

  for (const fam of sampleFamilies) {
    const res = calculateFamilyNeedScore({
      manualMembersCount: fam.manualMembersCount,
      familyMembersCount: fam.familyMembersCount,
      monthlyIncome: fam.monthlyIncome,
      orphansCount: fam.orphansCount,
      hasOrphans: fam.hasOrphans,
      hasWidow: fam.hasWidow,
      specialNeedsCount: fam.specialNeedsCount,
      kidsUnder5Count: fam.kidsUnder5Count,
      elderlyAbove60Count: fam.elderlyAbove60Count,
      housingCondition: fam.housingCondition,
      housingType: fam.housingType,
    })

    console.log(`\n🏠 الأسرة: ${fam.headFullName}`)
    console.log(`  • درجة مؤشر الحاجة: ${res.score}% (${res.priorityAr})`)
    console.log(`  • لون الشارة: ${res.badgeColor}`)
    console.log(`  • الأسباب المحسوبة: ${res.reasons.join(" • ")}`)
  }
}

main().finally(() => prisma.$disconnect())
