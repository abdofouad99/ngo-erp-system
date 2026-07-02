import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.beneficiary.count({
    where: { category: "ORPHAN" }
  })
  console.log(`Current orphans count in DB: ${count}`)
}

main().then(() => prisma.$disconnect())
