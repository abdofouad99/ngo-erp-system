import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  const totalFamilies = await prisma.family.count()
  const totalBeneficiaries = await prisma.beneficiary.count()
  const totalSponsors = await prisma.sponsor.count()
  const totalSponsorships = await prisma.sponsorship.count()

  const sponsors = await prisma.sponsor.findMany({
    include: {
      _count: {
        select: { sponsorships: true }
      }
    }
  })

  console.log("=== FINAL GRAND SYSTEM AUDIT REPORT ===")
  console.log(`Total Families: ${totalFamilies}`)
  console.log(`Total Beneficiaries: ${totalBeneficiaries}`)
  console.log(`Total Sponsors: ${totalSponsors}`)
  console.log(`Total Sponsorships: ${totalSponsorships}`)
  console.table(sponsors.map(s => ({
    id: s.id,
    fullName: s.fullName,
    organization: s.organization,
    country: s.country,
    sponsorshipsCount: s._count.sponsorships
  })))
}

main().finally(() => prisma.$disconnect())
