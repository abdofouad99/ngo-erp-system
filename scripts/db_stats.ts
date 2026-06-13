import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const beneficiaryCount = await prisma.beneficiary.count()
  const familyCount = await prisma.family.count()
  const sponsorCount = await prisma.sponsor.count()
  const tagCount = await prisma.tag.count()
  const sponsorshipCount = await prisma.sponsorship.count()
  const beneficiaryTagCount = await prisma.beneficiaryTag.count()

  console.log("=== DB Stats ===")
  console.log(`Beneficiaries: ${beneficiaryCount}`)
  console.log(`Families: ${familyCount}`)
  console.log(`Sponsors: ${sponsorCount}`)
  console.log(`Tags: ${tagCount}`)
  console.log(`Sponsorships: ${sponsorshipCount}`)
  console.log(`BeneficiaryTags: ${beneficiaryTagCount}`)
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
