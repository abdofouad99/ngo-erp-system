import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== NGO Database Verification ===")
  const govCount = await prisma.governorate.count()
  const distCount = await prisma.district.count()
  const subDistCount = await prisma.subDistrict.count()
  const familyCount = await prisma.family.count()
  const beneficiaryCount = await prisma.beneficiary.count()
  const projectCount = await prisma.project.count()
  const distributionCount = await prisma.projectBeneficiary.count()
  const notificationCount = await prisma.notification.count()

  console.log(`Governorates:    ${govCount}`)
  console.log(`Districts:       ${distCount}`)
  console.log(`Sub-districts:   ${subDistCount}`)
  console.log(`Families:        ${familyCount}`)
  console.log(`Beneficiaries:   ${beneficiaryCount}`)
  console.log(`Projects:        ${projectCount}`)
  console.log(`Distributions:   ${distributionCount}`)
  console.log(`Notifications:   ${notificationCount}`)

  console.log("=================================")
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
