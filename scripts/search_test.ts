import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== Testing search terms ===")

  // Search by Tag containing 'كويت'
  const tagKuwait = await prisma.beneficiary.findMany({
    where: {
      tags: {
        some: {
          tag: {
            nameAr: { contains: "كويت" }
          }
        }
      }
    },
    include: {
      tags: { include: { tag: true } }
    },
    take: 5
  })
  console.log(`\nOrphans with Tag matching 'كويت': ${tagKuwait.length}`)
  tagKuwait.forEach(o => {
    console.log(`- ${o.fullName} (Tags: ${o.tags.map(t => t.tag.nameAr).join(", ")})`)
  })

  // Search by Sponsor containing 'كويت'
  const sponsorKuwait = await prisma.beneficiary.findMany({
    where: {
      sponsorships: {
        some: {
          sponsor: {
            fullName: { contains: "كويت" }
          }
        }
      }
    },
    include: {
      sponsorships: { include: { sponsor: true } }
    },
    take: 5
  })
  console.log(`\nOrphans with Sponsor matching 'كويت': ${sponsorKuwait.length}`)
  sponsorKuwait.forEach(o => {
    console.log(`- ${o.fullName} (Sponsors: ${o.sponsorships.map(s => s.sponsor.fullName).join(", ")})`)
  })

  // Search by Sponsor containing 'العون'
  const sponsorDirect = await prisma.beneficiary.findMany({
    where: {
      sponsorships: {
        some: {
          sponsor: {
            fullName: { contains: "العون" }
          }
        }
      }
    },
    include: {
      sponsorships: { include: { sponsor: true } }
    },
    take: 5
  })
  console.log(`\nOrphans with Sponsor matching 'العون': ${sponsorDirect.length}`)
  sponsorDirect.forEach(o => {
    console.log(`- ${o.fullName} (Sponsors: ${o.sponsorships.map(s => s.sponsor.fullName).join(", ")})`)
  })
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
