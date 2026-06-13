import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const orphans = await prisma.beneficiary.findMany({
    where: {
      category: "ORPHAN",
      deletedAt: null
    },
    include: {
      family: true
    }
  })

  console.log("=== Active Orphans Fields Inspection ===")
  console.log(`Total active orphans: ${orphans.length}`)

  // Helper to get non-empty counts and unique sample values
  const checkField = (name: string, getter: (o: any) => any) => {
    const values = orphans.map(getter).filter(Boolean)
    const uniqueValues = Array.from(new Set(values))
    console.log(`- ${name}: populated in ${values.length}/${orphans.length} records. Unique values count: ${uniqueValues.length}`)
    if (uniqueValues.length > 0) {
      console.log(`  Samples: ${uniqueValues.slice(0, 5).map(v => `"${v}"`).join(", ")}`)
    }
  }

  checkField("fullName", o => o.fullName)
  checkField("orphanCode", o => o.orphanCode)
  checkField("nationalId", o => o.nationalId)
  checkField("marketedToOrg", o => o.marketedToOrg)
  checkField("religion", o => o.religion)
  checkField("birthGovernorate", o => o.birthGovernorate)
  checkField("birthDistrict", o => o.birthDistrict)
  checkField("schoolName", o => o.schoolName)
  checkField("family.headFullName", o => o.family?.headFullName)
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
