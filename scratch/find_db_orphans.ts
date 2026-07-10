import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const orphans = await prisma.beneficiary.findMany({
    where: { category: "ORPHAN", deletedAt: null },
    select: { fullName: true, orphanCode: true }
  })

  const searchTerms = ["شايع", "حامس", "المصقري", "غلا", "ردفان", "مزروع", "الانسى", "عمر طلال", "عمرو طلال"]
  
  console.log("Searching database for keywords:")
  for (const term of searchTerms) {
    const matches = orphans.filter(o => o.fullName.includes(term))
    console.log(`\nMatches for "${term}":`)
    for (const m of matches) {
      console.log(`  - "${m.fullName}" (Code: ${m.orphanCode})`)
    }
  }
}

main().then(() => prisma.$disconnect())
