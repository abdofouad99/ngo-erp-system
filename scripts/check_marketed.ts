import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const orphans = await prisma.beneficiary.findMany({
    where: {
      category: "ORPHAN",
      deletedAt: null
    },
    select: {
      fullName: true,
      marketedToOrg: true
    }
  })

  const withMarketed = orphans.filter(o => o.marketedToOrg)
  console.log(`Total active orphans: ${orphans.length}`)
  console.log(`Orphans with marketedToOrg set: ${withMarketed.length}`)
  
  if (withMarketed.length > 0) {
    console.log("\nSome samples:")
    withMarketed.slice(0, 10).forEach(o => {
      console.log(`- ${o.fullName}: marketedToOrg = "${o.marketedToOrg}"`)
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
