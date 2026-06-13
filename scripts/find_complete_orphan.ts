import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== Searching for Orphans with Detailed Data ===")
  
  const orphans = await prisma.beneficiary.findMany({
    where: {
      category: "ORPHAN",
      deletedAt: null,
    },
    include: {
      guardians: true,
      siblings: true,
      family: true,
    },
  })

  if (orphans.length === 0) {
    console.log("No orphans found in the database.")
    return
  }

  const scoredOrphans = orphans.map(orphan => {
    const completenessScore = [
      orphan.orphanCode ? 1 : 0,
      orphan.kuraimiAccount ? 1 : 0,
      orphan.religion ? 1 : 0,
      orphan.quranMemorization ? 1 : 0,
      orphan.birthGovernorate ? 1 : 0,
      orphan.fatherDeathDate ? 1 : 0,
      orphan.guardians.length > 0 ? 1 : 0,
      orphan.siblings.length > 0 ? 1 : 0,
      orphan.referrerName ? 1 : 0,
      orphan.marketedToOrg ? 1 : 0,
    ].reduce((a, b) => a + b, 0)

    return { orphan, completenessScore }
  })

  // Sort by score and then by guardian/sibling count descending
  scoredOrphans.sort((a, b) => b.completenessScore - a.completenessScore || b.orphan.guardians.length - a.orphan.guardians.length)

  console.log(`Total orphans in DB: ${orphans.length}`)
  console.log("Top 10 most complete orphans:")

  for (let i = 0; i < Math.min(10, scoredOrphans.length); i++) {
    const { orphan, completenessScore } = scoredOrphans[i]
    console.log(`\n- Name: ${orphan.fullName}`)
    console.log(`  Orphan Code: ${orphan.orphanCode || "None"}`)
    console.log(`  Guardians count: ${orphan.guardians.length}`)
    console.log(`  Siblings count: ${orphan.siblings.length}`)
    console.log(`  Completeness score: ${completenessScore}/10`)
    console.log(`  Governorate: ${orphan.birthGovernorate || "None"}`)
    console.log(`  Kuraimi Account: ${orphan.kuraimiAccount || "None"}`)
    if (orphan.guardians.length > 0) {
      console.log(`  First Guardian: ${orphan.guardians[0].fullName} (${orphan.guardians[0].relation})`)
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
    process.exit(1)
  })
