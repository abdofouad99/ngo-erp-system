import fs from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"

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

const ATTACHMENTS_DIR = "H:\\ملفات ايتام النجاة  للدفعه حتى ديسمبر 2025 - عدد  268"

// Normalize Arabic text for fuzzy matching
function normalizeName(name: string): string {
  if (!name) return ""
  return name
    .trim()
    .replace(/[أإآآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "") // remove diacritics
    .replace(/\s+/g, "") // remove all spaces
}

function getFirstNWords(name: string, n: number): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, n).join(" ")
}

async function main() {
  console.log("🔍 Starting Deep Audit and Verification of Uploaded Attachments...")
  
  if (!fs.existsSync(ATTACHMENTS_DIR)) {
    console.error(`❌ Error: Source directory does not exist at: ${ATTACHMENTS_DIR}`)
    process.exit(1)
  }

  // Fetch all active orphans and their attachments
  console.log("📥 Loading orphans and attachments from database...")
  const orphans = await prisma.beneficiary.findMany({
    where: { category: "ORPHAN", deletedAt: null },
    select: {
      id: true,
      fullName: true,
      orphanCode: true,
      attachments: {
        select: {
          fileName: true,
          fileUrl: true,
          sizeBytes: true,
          documentType: true
        }
      }
    }
  })
  console.log(`✅ Loaded ${orphans.length} orphans from database.`)

  // Create a map of normalized names to orphans
  const orphanMap = new Map<string, typeof orphans[0]>()
  for (const o of orphans) {
    const norm = normalizeName(o.fullName)
    orphanMap.set(norm, o)
  }

  const MANUAL_FOLDER_MAP: { [folderName: string]: string } = {
    "احمد نايف علي احمد صالح الانسي": "احمد نائف علي احمد الانسي",
    "امير محمد عبد حزام مقبل": "امير محمد عبده حزام مقبل",
    "تركياء حسين صالح عامر ابوشايع": "تركيا حسين صالح عامر ابوشايع",
    "جنات حامس احمد محمد المصقري": "جنا حامس احمد محمد المصقري",
    "شذى حامس احمد محمد المصقري": "شذاء حامس احمد محمد المصقري",
    "عمر طلال احمد محمد عبد الوهاب بشر": "عمرو طلال أحمد محمد",
    "غلاء عبده محمد احمد محمد سعيد": "غلا عبده محمد احمد محمد سعيد",
    "ليلئ ردفان احمد عبده قائد الجابري": "ليلى ردفان احمد عبده قائد الجابري",
    "ليناء خالد أحمد صالح مزروع": "لينا خالد احمد صالح مزروع",
    "مجاهد فواد احمد صالح": "مجاهد فؤاد احمد صالح",
    "ياسمين محيي الدين علي حميد العباسي": "ياسمين محي الدين علي حميد"
  }

  // Read local folders
  const items = fs.readdirSync(ATTACHMENTS_DIR)
  const folders = items.filter(item => {
    const fullPath = path.join(ATTACHMENTS_DIR, item)
    return fs.statSync(fullPath).isDirectory()
  })

  let totalLocalFiles = 0
  let totalUploadedFiles = 0
  let totalMissingFiles = 0
  const missingFilesReport: { orphanName: string; fileName: string; sizeMB: string; error?: string }[] = []
  const skippedSystemFiles: { folderName: string; fileName: string }[] = []

  for (const folderName of folders) {
    if (folderName === "مجلد جديد") continue

    // Find matched orphan
    let matchedOrphan = null
    
    // Check manual override first
    if (MANUAL_FOLDER_MAP[folderName]) {
      const dbName = MANUAL_FOLDER_MAP[folderName]
      matchedOrphan = orphanMap.get(normalizeName(dbName))
    }
    
    if (!matchedOrphan) {
      const normalizedFolder = normalizeName(folderName)
      matchedOrphan = orphanMap.get(normalizedFolder)
    }

    if (!matchedOrphan) {
      // 1. 3-word prefix match fallback
      const folder3WordsNorm = normalizeName(getFirstNWords(folderName, 3))
      const matches3Words = orphans.filter(o => normalizeName(getFirstNWords(o.fullName, 3)) === folder3WordsNorm)
      if (matches3Words.length === 1) {
        matchedOrphan = matches3Words[0]
      }
    }

    if (!matchedOrphan) {
      // 2. 14-char normalized prefix match fallback
      const normalizedFolder = normalizeName(folderName)
      const folder14Char = normalizedFolder.substring(0, 14)
      const matches14Char = orphans.filter(o => normalizeName(o.fullName).substring(0, 14) === folder14Char)
      if (folder14Char.length >= 10 && matches14Char.length === 1) {
        matchedOrphan = matches14Char[0]
      }
    }

    if (!matchedOrphan) {
      // 3. 12-char normalized prefix match fallback
      const normalizedFolder = normalizeName(folderName)
      const folder12Char = normalizedFolder.substring(0, 12)
      const matches12Char = orphans.filter(o => normalizeName(o.fullName).substring(0, 12) === folder12Char)
      if (folder12Char.length >= 8 && matches12Char.length === 1) {
        matchedOrphan = matches12Char[0]
      }
    }

    if (!matchedOrphan) {
      // 4. Substring partial match fallback
      const normalizedFolder = normalizeName(folderName)
      let partialMatch = null
      for (const [normDbName, o] of orphanMap.entries()) {
        if (normDbName.includes(normalizedFolder) || normalizedFolder.includes(normDbName)) {
          partialMatch = o
          break
        }
      }
      if (partialMatch) {
        matchedOrphan = partialMatch
      }
    }

    if (!matchedOrphan) {
      console.warn(`⚠️ Warning: Folder "${folderName}" could not be matched to any database orphan.`)
      continue
    }

    const folderPath = path.join(ATTACHMENTS_DIR, folderName)
    const files = fs.readdirSync(folderPath).filter(f => {
      const stats = fs.statSync(path.join(folderPath, f))
      return stats.isFile()
    })

    const dbAttachmentNames = new Set(matchedOrphan.attachments.map(a => a.fileName))

    for (const fileName of files) {
      // Ignore system files
      if (fileName.toLowerCase() === "thumbs.db" || fileName.startsWith(".")) {
        skippedSystemFiles.push({ folderName, fileName })
        continue
      }

      totalLocalFiles++

      if (dbAttachmentNames.has(fileName)) {
        totalUploadedFiles++
      } else {
        totalMissingFiles++
        const filePath = path.join(folderPath, fileName)
        const stats = fs.statSync(filePath)
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
        
        let reason = "حجم الملف يتجاوز الحد المسموح في Supabase Storage (5 ميغابايت)"
        if (fileName.toLowerCase().endsWith(".docx") || fileName.toLowerCase().endsWith(".doc")) {
          reason = "صيغة الملف غير مدعومة في الحاوية السحابية (المسموح: PDF, JPG, PNG)"
        } else if (stats.size > 20 * 1024 * 1024) {
          reason = "حجم الملف كبير جداً (أكبر من 20 ميجابايت)"
        }
        
        missingFilesReport.push({
          orphanName: matchedOrphan.fullName,
          fileName,
          sizeMB,
          error: reason
        })
      }
    }
  }

  console.log("\n📊 Verification Audit Results:")
  console.log(`- Total Local Valid Files Searched: ${totalLocalFiles}`)
  console.log(`- Total Confirmed Uploaded & Linked in DB: ${totalUploadedFiles} (${((totalUploadedFiles / totalLocalFiles) * 100).toFixed(1)}%)`)
  console.log(`- Total Skipped System Files (Thumbs.db etc.): ${skippedSystemFiles.length}`)
  console.log(`- Total Missing/Failed Files: ${totalMissingFiles}`)

  if (missingFilesReport.length > 0) {
    console.log("\n❌ Detailed List of Missing/Failed Files:")
    missingFilesReport.forEach((item, index) => {
      console.log(`  ${index + 1}. اليتيم: ${item.orphanName} | الملف: ${item.fileName} (${item.sizeMB} MB) | السبب: ${item.error}`)
    })
  } else {
    console.log("\n🎉 PERFECT MATCH! All files successfully uploaded and matched in database!")
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
  })
