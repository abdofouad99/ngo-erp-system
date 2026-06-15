import { PrismaClient, Gender, VerificationStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== NGO Database Orphan Classification Splitting (Bulk Testing) ===")

  // 1. Ensure all initial tags exist in the database
  const initialOperationalTags = [
    { nameAr: "تحت التسويق", category: "ORPHAN_OPERATIONAL_STATUS", color: "#3b82f6", sortOrder: 1 },
    { nameAr: "مكفول", category: "ORPHAN_OPERATIONAL_STATUS", color: "#22c55e", sortOrder: 2 },
    { nameAr: "إعادة تسويق", category: "ORPHAN_OPERATIONAL_STATUS", color: "#eab308", sortOrder: 3 },
    { nameAr: "موقوف", category: "ORPHAN_OPERATIONAL_STATUS", color: "#ef4444", sortOrder: 4 },
    { nameAr: "خارج عن الدفع", category: "ORPHAN_OPERATIONAL_STATUS", color: "#6b7280", sortOrder: 5 },
    { nameAr: "توقف الكافل", category: "ORPHAN_OPERATIONAL_STATUS", color: "#f97316", sortOrder: 6 },
    { nameAr: "مرتجع", category: "ORPHAN_OPERATIONAL_STATUS", color: "#a855f7", sortOrder: 7 },
  ]

  const initialFundingTags = [
    { nameAr: "بيت الزكاة", category: "FUNDING_SOURCE", color: "#0ea5e9", sortOrder: 1 },
    { nameAr: "جهة الحياة", category: "FUNDING_SOURCE", color: "#14b8a6", sortOrder: 2 },
    { nameAr: "تمويل داخلي", category: "FUNDING_SOURCE", color: "#8b5cf6", sortOrder: 3 },
    { nameAr: "أخرى", category: "FUNDING_SOURCE", color: "#78716c", sortOrder: 4 },
  ]

  // Seed operational tags
  const opTagsInDb = []
  for (const tag of initialOperationalTags) {
    let t = await prisma.tag.findFirst({
      where: { nameAr: tag.nameAr, category: "ORPHAN_OPERATIONAL_STATUS" }
    })
    if (!t) {
      t = await prisma.tag.create({
        data: {
          nameAr: tag.nameAr,
          category: "ORPHAN_OPERATIONAL_STATUS",
          color: tag.color,
          sortOrder: tag.sortOrder,
          isActive: true
        }
      })
      console.log(`Created operational tag: ${tag.nameAr}`)
    }
    opTagsInDb.push(t)
  }

  // Seed funding tags
  const fundTagsInDb = []
  for (const tag of initialFundingTags) {
    let t = await prisma.tag.findFirst({
      where: { nameAr: tag.nameAr, category: "FUNDING_SOURCE" }
    })
    if (!t) {
      t = await prisma.tag.create({
        data: {
          nameAr: tag.nameAr,
          category: "FUNDING_SOURCE",
          color: tag.color,
          sortOrder: tag.sortOrder,
          isActive: true
        }
      })
      console.log(`Created funding tag: ${tag.nameAr}`)
    }
    fundTagsInDb.push(t)
  }

  // 2. Fetch all orphans
  const orphans = await prisma.beneficiary.findMany({
    where: { category: "ORPHAN", isActive: true },
    select: { id: true, fullName: true }
  })

  console.log(`Found ${orphans.length} active orphans in the database.`)

  if (orphans.length === 0) {
    console.log("No active orphans found to split.")
    return
  }

  // Genders list
  const genders: Gender[] = ["MALE", "FEMALE"]
  
  // Verification statuses list
  const statuses: VerificationStatus[] = ["APPROVED", "PENDING", "REJECTED"]

  // Group orphans by combination for bulk update
  const groups: Record<string, { ids: string[]; gender: Gender; status: VerificationStatus }> = {}
  
  for (let i = 0; i < orphans.length; i++) {
    const orphan = orphans[i]
    const gender = genders[i % genders.length]
    const status = statuses[i % statuses.length]
    const key = `${gender}_${status}`
    
    if (!groups[key]) {
      groups[key] = { ids: [], gender, status }
    }
    groups[key].ids.push(orphan.id)
  }

  // Perform bulk updates on main fields
  console.log("Updating genders and verification statuses in bulk...")
  for (const key of Object.keys(groups)) {
    const { ids, gender, status } = groups[key]
    await prisma.beneficiary.updateMany({
      where: { id: { in: ids } },
      data: { gender, verificationStatus: status }
    })
    console.log(`  - Group ${key}: updated ${ids.length} orphans`)
  }

  // Delete all existing operational and funding tag links for these orphans
  console.log("Deleting old operational/funding tags in bulk...")
  await prisma.beneficiaryTag.deleteMany({
    where: {
      beneficiaryId: { in: orphans.map(o => o.id) },
      tag: {
        category: {
          in: ["ORPHAN_OPERATIONAL_STATUS", "FUNDING_SOURCE"]
        }
      }
    }
  })

  // Prepare and insert new tag links in bulk
  console.log("Creating new tag associations in bulk...")
  const tagsToInsert: { beneficiaryId: string; tagId: string }[] = []
  
  for (let i = 0; i < orphans.length; i++) {
    const orphan = orphans[i]
    const targetOpTag = opTagsInDb[i % opTagsInDb.length]
    const targetFundTag = fundTagsInDb[i % fundTagsInDb.length]
    
    tagsToInsert.push({ beneficiaryId: orphan.id, tagId: targetOpTag.id })
    tagsToInsert.push({ beneficiaryId: orphan.id, tagId: targetFundTag.id })
  }

  await prisma.beneficiaryTag.createMany({
    data: tagsToInsert
  })

  console.log(`Successfully split and classified ${orphans.length} orphans in bulk.`)

  // 3. Print breakdown stats
  console.log("\n=== Stats Breakdown after Splitting ===")
  
  const genderStats = await prisma.beneficiary.groupBy({
    by: ['gender'],
    where: { category: "ORPHAN", isActive: true },
    _count: true
  })
  console.log("Genders:")
  genderStats.forEach(g => console.log(`  - ${g.gender}: ${g._count}`))

  const verificationStats = await prisma.beneficiary.groupBy({
    by: ['verificationStatus'],
    where: { category: "ORPHAN", isActive: true },
    _count: true
  })
  console.log("Verification Statuses:")
  verificationStats.forEach(s => console.log(`  - ${s.verificationStatus}: ${s._count}`))

  const operationalTagCounts = await prisma.beneficiaryTag.groupBy({
    by: ['tagId'],
    where: {
      beneficiary: { category: "ORPHAN", isActive: true },
      tag: { category: "ORPHAN_OPERATIONAL_STATUS" }
    },
    _count: true
  })
  
  console.log("Operational Statuses:")
  for (const tc of operationalTagCounts) {
    const t = opTagsInDb.find(tag => tag.id === tc.tagId)
    if (t) {
      console.log(`  - ${t.nameAr}: ${tc._count}`)
    }
  }

  const fundingTagCounts = await prisma.beneficiaryTag.groupBy({
    by: ['tagId'],
    where: {
      beneficiary: { category: "ORPHAN", isActive: true },
      tag: { category: "FUNDING_SOURCE" }
    },
    _count: true
  })

  console.log("Funding Sources:")
  for (const tc of fundingTagCounts) {
    const t = fundTagsInDb.find(tag => tag.id === tc.tagId)
    if (t) {
      console.log(`  - ${t.nameAr}: ${tc._count}`)
    }
  }

  console.log("======================================================")
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
