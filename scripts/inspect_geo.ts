import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const governorates = await prisma.governorate.findMany({
    include: {
      districts: true
    }
  })
  
  console.log("=== Geo Structure in DB ===")
  for (const g of governorates) {
    console.log(`Gov: "${g.nameAr}" (ID: ${g.id}), Districts Count: ${g.districts.length}`)
    if (g.districts.length > 0) {
      console.log(`  First few districts: ${g.districts.slice(0, 3).map(d => `"${d.nameAr}"`).join(", ")}`)
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
