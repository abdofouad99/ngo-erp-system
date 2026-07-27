import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import * as xlsx from "xlsx"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log("⚡ جاري توثيق وتحديث الحالات الاجتماعية وسبب الإعالة للأسر (نازحة، أرملة، فقيرة متعففة، حالتهم صعبة)...")

  // Read Tanmiya Excel file
  const tanmiyaPath = `C:\\Users\\my computer\\Downloads\\محدث كشف الأسر المستفيدة من مشروع كفالة الأسر المتعففة - 2025 - ناصر الدبوس تنمية (1)_٠٧٥٠٥٥.xlsx`
  const wb = xlsx.readFile(tanmiyaPath)
  const sheetName = wb.SheetNames[0]
  const rows: any[] = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" })

  let updatedCount = 0

  for (const r of rows) {
    const name = String(r["الاسم"] || "").trim()
    const phone = String(r["رقم التلفون "] || r["رقم التلفون"] || "").trim()
    const statusText = String(r["سبب الاعاله "] || r["سبب الاعاله"] || r["سبب الإعالة"] || "").trim()

    if (!name && !phone) continue

    const isDisplaced = statusText.includes("نازح") || statusText.includes("نازحه")
    const isWidow = statusText.includes("أرمل") || statusText.includes("ارمل")
    const isSeverePoverty = statusText.includes("فقيرة") || statusText.includes("صعبة") || statusText.includes("تعفف")

    // Find family by phone or name
    const family = await prisma.family.findFirst({
      where: {
        OR: [
          { headFullName: { contains: name.slice(0, 8) } },
          ...(phone ? [{ headPhoneNumber: { contains: phone } }] : [])
        ]
      }
    })

    if (family) {
      await prisma.family.update({
        where: { id: family.id },
        data: {
          socialStatus: statusText || family.socialStatus,
          isDisplaced: isDisplaced ? true : family.isDisplaced,
          hasWidow: isWidow ? true : family.hasWidow,
          povertyLevel: isSeverePoverty ? "SEVERE" : family.povertyLevel,
        }
      })
      updatedCount++
    }
  }

  console.log(`✅ تم تحديث ${updatedCount} أسرة بالحالات الاجتماعية والسمات من كشف تنمية!`)

  // Update overall counts for displaced, widows, etc.
  const totalDisplaced = await prisma.family.count({ where: { isDisplaced: true } })
  const totalWidows = await prisma.family.count({ where: { hasWidow: true } })
  const totalSevere = await prisma.family.count({ where: { povertyLevel: "SEVERE" } })

  console.log(`📊 الإحصائيات المحدثة بعد المزامنة:`)
  console.log(`  • الأسر النازحة: ${totalDisplaced}`)
  console.log(`  • أرامل ومعيلات: ${totalWidows}`)
  console.log(`  • أسر ذات فقر شديد: ${totalSevere}`)
}

main().finally(() => prisma.$disconnect())
