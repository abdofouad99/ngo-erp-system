import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  console.log("🧹 Cleaning up partially imported orphans from failed runs...")

  // Find all orphans created with fake IMPORT- nationalId families
  const fakeFamilies = await prisma.family.findMany({
    where: {
      headNationalId: {
        startsWith: "IMPORT-"
      }
    },
    select: { id: true }
  })

  const fakeFamilyIds = fakeFamilies.map(f => f.id)
  console.log(`Found ${fakeFamilyIds.length} partially-imported families to clean up.`)

  if (fakeFamilyIds.length === 0) {
    console.log("✅ Nothing to clean up.")
    return
  }

  // Get beneficiary IDs in those families
  const orphans = await prisma.beneficiary.findMany({
    where: { familyId: { in: fakeFamilyIds } },
    select: { id: true }
  })
  const orphanIds = orphans.map(o => o.id)
  console.log(`Found ${orphanIds.length} orphans to delete.`)

  if (orphanIds.length > 0) {
    await prisma.orphanUpdateRequest.deleteMany({ where: { beneficiaryId: { in: orphanIds } } })
    await prisma.beneficiaryTag.deleteMany({ where: { beneficiaryId: { in: orphanIds } } })
    await prisma.caseActivity.deleteMany({ where: { beneficiaryId: { in: orphanIds } } })
    await prisma.projectBeneficiary.deleteMany({ where: { beneficiaryId: { in: orphanIds } } })
    await prisma.sponsorship.deleteMany({ where: { beneficiaryId: { in: orphanIds } } })
    await prisma.attachment.deleteMany({ where: { beneficiaryId: { in: orphanIds } } })
    await prisma.guardian.deleteMany({ where: { beneficiaryId: { in: orphanIds } } })
    await prisma.sibling.deleteMany({ where: { beneficiaryId: { in: orphanIds } } })
    await prisma.beneficiary.deleteMany({ where: { id: { in: orphanIds } } })
    console.log(`✅ Deleted ${orphanIds.length} orphans.`)
  }

  // Delete the families
  await prisma.family.deleteMany({ where: { id: { in: fakeFamilyIds } } })
  console.log(`✅ Deleted ${fakeFamilyIds.length} fake families.`)

  // Cleanup any orphan sponsors with no sponsorships
  const orphanedSponsors = await prisma.sponsor.findMany({
    where: { sponsorships: { none: {} } }
  })
  if (orphanedSponsors.length > 0) {
    await prisma.sponsor.deleteMany({ where: { id: { in: orphanedSponsors.map(s => s.id) } } })
    console.log(`✅ Cleaned up ${orphanedSponsors.length} orphaned sponsors.`)
  }

  console.log("🎉 Cleanup done!")
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
})
