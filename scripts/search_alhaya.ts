import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== Searching database for 'الحياة' ===")

  // 1. Tags matching 'الحياة'
  const tags = await prisma.tag.findMany({
    where: {
      OR: [
        { nameAr: { contains: "الحياة" } },
        { nameEn: { contains: "alhaya", mode: "insensitive" } }
      ]
    }
  })
  console.log(`\nFound ${tags.length} Tags containing 'الحياة':`)
  tags.forEach(t => console.log(`- ID: ${t.id}, nameAr: "${t.nameAr}", category: ${t.category}`))

  // 2. Sponsors matching 'الحياة'
  const sponsors = await prisma.sponsor.findMany({
    where: {
      fullName: { contains: "الحياة" }
    }
  })
  console.log(`\nFound ${sponsors.length} Sponsors containing 'الحياة':`)
  sponsors.forEach(s => console.log(`- ID: ${s.id}, fullName: "${s.fullName}"`))

  // 3. Beneficiaries with marketedToOrg matching 'الحياة'
  const beneficiariesMarketed = await prisma.beneficiary.findMany({
    where: {
      marketedToOrg: { contains: "الحياة" }
    }
  })
  console.log(`\nFound ${beneficiariesMarketed.length} Beneficiaries with marketedToOrg containing 'الحياة':`)
  beneficiariesMarketed.forEach(b => console.log(`- ID: ${b.id}, Code: ${b.orphanCode}, fullName: "${b.fullName}", marketedToOrg: "${b.marketedToOrg}"`))

  // 4. BeneficiaryTag connections matching 'الحياة'
  const beneficiaryTags = await prisma.beneficiaryTag.findMany({
    where: {
      tag: { nameAr: { contains: "الحياة" } }
    },
    include: {
      beneficiary: true,
      tag: true
    }
  })
  console.log(`\nFound ${beneficiaryTags.length} Beneficiary-Tag relations matching 'الحياة':`)
  beneficiaryTags.forEach(bt => console.log(`- Orphan: "${bt.beneficiary.fullName}", Tag: "${bt.tag.nameAr}"`))

  // 5. Let's see some tags in general to know what tags actually exist
  const allTags = await prisma.tag.findMany({
    take: 10
  })
  console.log(`\nListing up to 10 general Tags in DB:`)
  allTags.forEach(t => console.log(`- nameAr: "${t.nameAr}", category: ${t.category}`))

  // 6. Let's list some sponsors in general
  const allSponsors = await prisma.sponsor.findMany({
    take: 10
  })
  console.log(`\nListing up to 10 general Sponsors in DB:`)
  allSponsors.forEach(s => console.log(`- fullName: "${s.fullName}"`))
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
