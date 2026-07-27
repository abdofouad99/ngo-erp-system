import subprocess
import json

script = """
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  const familiesCount = await prisma.family.count()
  const beneficiariesCount = await prisma.beneficiary.count()
  const sponsorsCount = await prisma.sponsor.count()
  const sponsorshipsCount = await prisma.sponsorship.count()

  const sponsors = await prisma.sponsor.findMany({
    select: {
      id: true,
      fullName: true,
      organization: true,
      country: true,
      _count: {
        select: { sponsorships: true }
      }
    }
  })

  console.log("=== FINAL SYSTEM AUDIT REPORT ===")
  console.log(`Total Families: ${familiesCount}`)
  console.log(`Total Beneficiaries: ${beneficiariesCount}`)
  console.log(`Total Sponsors: ${sponsorsCount}`)
  console.log(`Total Sponsorships: ${sponsorshipsCount}`)
  console.log("\\nSponsors List:")
  console.table(sponsors)
}

main().finally(() => prisma.$disconnect())
"""

with open(r"F:\Food management system for the organization\scratch\run_audit.ts", "w", encoding="utf-8") as f:
    f.write(script)

print("AUDIT_SCRIPT_READY")
