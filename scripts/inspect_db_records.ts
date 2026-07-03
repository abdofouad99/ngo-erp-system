import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const orphans = await prisma.beneficiary.findMany({
    where: { category: "ORPHAN", deletedAt: null },
    take: 5,
    include: { family: true, sponsorships: true }
  })
  
  console.log("Inspecting first 5 imported database records:")
  for (const o of orphans) {
    console.log(`\nName: ${o.fullName}`)
    console.log(`  orphanCode (رقم اليتيم): ${o.orphanCode}`)
    console.log(`  kuraimiAccount (حساب الكريمي الجديد): ${o.kuraimiAccount}`)
    console.log(`  mumaiyo (المميز): ${o.mumaiyo}`)
  }
}

main().then(() => prisma.$disconnect())
