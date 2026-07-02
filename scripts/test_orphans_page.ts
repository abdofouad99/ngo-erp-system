import { prisma } from "../src/lib/prisma"
import { getAllTags } from "../src/app/actions/tag-actions"

async function main() {
  console.log("🔍 Testing Orphans Page data fetching...")
  
  try {
    console.log("1. Fetching Orphans...")
    const orphans = await prisma.beneficiary.findMany({
      where: {
        category: "ORPHAN",
        deletedAt: null,
      },
      include: {
        family: true,
        sponsorships: {
          include: {
            sponsor: true,
          },
        },
        tags: {
          include: { tag: true },
        },
        guardians: {
          orderBy: { isPrimary: "desc" },
        },
        siblings: {
          orderBy: { siblingOrder: "asc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    console.log(`✅ Success: Fetched ${orphans.length} orphans.`)
  } catch (err: any) {
    console.error("❌ Error fetching orphans:", err)
  }

  try {
    console.log("2. Fetching Families...")
    const families = await prisma.family.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        headFullName: true,
      },
      orderBy: {
        headFullName: "asc",
      },
    })
    console.log(`✅ Success: Fetched ${families.length} families.`)
  } catch (err: any) {
    console.error("❌ Error fetching families:", err)
  }

  try {
    console.log("3. Fetching Tags...")
    const tagsResult = await getAllTags()
    console.log("✅ Success calling getAllTags:", tagsResult)
  } catch (err: any) {
    console.error("❌ Error calling getAllTags:", err)
  }
}

main().then(() => prisma.$disconnect()).catch(err => {
  console.error(err)
})
