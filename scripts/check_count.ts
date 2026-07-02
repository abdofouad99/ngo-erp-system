import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const orphans = await prisma.beneficiary.findMany({
    where: { category: "ORPHAN", deletedAt: null },
    include: { family: true }
  })
  
  const orphansWithNoFamily = orphans.filter(o => !o.family)
  console.log(`Total Orphans: ${orphans.length}`)
  console.log(`Orphans with no family: ${orphansWithNoFamily.length}`)
  if (orphansWithNoFamily.length > 0) {
    console.log("IDs of orphans with no family:", orphansWithNoFamily.map(o => o.id))
  }
}

main().then(() => prisma.$disconnect())
