import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.DIRECT_URL,
    },
  },
})

async function main() {
  console.log("🧹 بدء تفريغ وتطوير النظام...")

  await prisma.attachment.deleteMany({}).catch(() => {})
  await prisma.beneficiaryTag.deleteMany({}).catch(() => {})
  await prisma.familyTag.deleteMany({}).catch(() => {})
  await prisma.sibling.deleteMany({}).catch(() => {})
  await prisma.guardian.deleteMany({}).catch(() => {})
  await prisma.sponsorship.deleteMany({}).catch(() => {})
  await prisma.projectBeneficiary.deleteMany({}).catch(() => {})
  await prisma.beneficiary.deleteMany({}).catch(() => {})
  await prisma.patient.deleteMany({}).catch(() => {})
  await prisma.family.deleteMany({}).catch(() => {})
  await prisma.project.deleteMany({}).catch(() => {})
  await prisma.sponsor.deleteMany({}).catch(() => {})

  const familiesCount = await prisma.family.count()
  const beneficiariesCount = await prisma.beneficiary.count()

  console.log(`الأسر: ${familiesCount}, المستفيدون: ${beneficiariesCount}`)
}

main()
  .catch((e) => {
    console.error("Error:", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
