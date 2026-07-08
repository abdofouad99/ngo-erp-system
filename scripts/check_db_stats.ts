import { PrismaClient } from "@prisma/client"
import fs from "fs"

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}

loadEnvFile(".env")
loadEnvFile(".env.local")

const prisma = new PrismaClient()

async function main() {
  console.log("📊 Starting NGO ERP Database Audit...")
  let dbRetries = 5
  while (dbRetries > 0) {
    try {
      const totalBeneficiaries = await prisma.beneficiary.count()
      const totalOrphans = await prisma.beneficiary.count({
        where: { category: "ORPHAN" }
      })
      const totalFamilies = await prisma.family.count()
      const totalAttachments = await prisma.attachment.count()
      
      const attachmentsLinkedToBeneficiary = await prisma.attachment.count({
        where: { NOT: { beneficiaryId: null } }
      })
      const attachmentsLinkedToFamily = await prisma.attachment.count({
        where: { NOT: { familyId: null } }
      })
      const attachmentsLinkedToProjectDelivery = await prisma.attachment.count({
        where: { NOT: { projectDeliveryId: null } }
      })

      console.log(`\n📌 General Statistics:`)
      console.log(`  - Total Families in Database: ${totalFamilies}`)
      console.log(`  - Total Beneficiaries in Database: ${totalBeneficiaries}`)
      console.log(`  - Total Orphans in Database: ${totalOrphans}`)
      
      console.log(`\n📌 Attachment Statistics:`)
      console.log(`  - Total Attachment Records: ${totalAttachments}`)
      console.log(`  - Attachments Linked to Beneficiaries: ${attachmentsLinkedToBeneficiary}`)
      console.log(`  - Attachments Linked to Families: ${attachmentsLinkedToFamily}`)
      console.log(`  - Attachments Linked to Project Delivery: ${attachmentsLinkedToProjectDelivery}`)

      // Let's get a distribution of how many attachments orphans have
      const orphansWithAttachments = await prisma.beneficiary.findMany({
        where: { category: "ORPHAN" },
        select: {
          id: true,
          fullName: true,
          _count: {
            select: { attachments: true }
          }
        }
      })

      const attachmentCounts = orphansWithAttachments.map(o => o._count.attachments)
      const totalLinkedToOrphans = attachmentCounts.reduce((a, b) => a + b, 0)
      const orphansWithAtLeastOne = attachmentCounts.filter(c => c > 0).length
      const orphansWithZero = attachmentCounts.filter(c => c === 0).length

      console.log(`\n📌 Orphan Attachment Distribution:`)
      console.log(`  - Total Attachments Linked directly to Orphans: ${totalLinkedToOrphans}`)
      console.log(`  - Orphans with at least 1 attachment: ${orphansWithAtLeastOne} / ${totalOrphans} (${((orphansWithAtLeastOne/totalOrphans)*100).toFixed(1)}%)`)
      console.log(`  - Orphans with 0 attachments: ${orphansWithZero} / ${totalOrphans} (${((orphansWithZero/totalOrphans)*100).toFixed(1)}%)`)

      if (orphansWithZero > 0) {
        console.log(`\n📌 List of Orphans with 0 attachments:`)
        orphansWithAttachments
          .filter(o => o._count.attachments === 0)
          .forEach((o, i) => console.log(`  ${i + 1}. ${o.fullName}`))
      }

      // Group orphans by how many attachments they have
      const groupMap: { [count: number]: number } = {}
      for (const count of attachmentCounts) {
        groupMap[count] = (groupMap[count] || 0) + 1
      }

      console.log(`\n📌 Attachment Count Breakdown (Orphans):`)
      Object.keys(groupMap).sort((a, b) => Number(a) - Number(b)).forEach(k => {
        console.log(`  - Orphans with exactly ${k} attachment(s): ${groupMap[Number(k)]}`)
      })

      break;
    } catch (err: any) {
      dbRetries--
      console.warn(`  ⚠️ Database query failed, retrying... (${dbRetries} retries left). Error: ${err.message || err}`)
      await prisma.$disconnect()
      await new Promise(r => setTimeout(r, 4000))
      await prisma.$connect()
      if (dbRetries === 0) {
        console.error("❌ Database audit failed after all retries:", err.message || err)
      }
    } finally {
      if (dbRetries === 0 || dbRetries === 5) {
        await prisma.$disconnect()
      }
    }
  }
}

main()
