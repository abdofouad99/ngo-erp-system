import fs from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"
import { createSupabaseAdminClient } from "../src/lib/supabase"
// Load env variables manually
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

// Config
const ATTACHMENTS_DIR = "H:\\ملفات ايتام النجاة  للدفعه حتى ديسمبر 2025 - عدد  268"
const BUCKET = "orphan-attachments"
const DRY_RUN = !process.argv.includes("--execute")
const PHOTOS_ONLY = process.argv.includes("--photos-only")
const DOCUMENTS_ONLY = process.argv.includes("--documents-only")

// Normalize Arabic text for fuzzy matching but keep spaces
function normalizeNameKeepSpaces(name: string): string {
  if (!name) return ""
  return name
    .trim()
    .replace(/[أإآآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "") // remove diacritics
    .replace(/\s+/g, " ") // normalize spacing
}

// Normalize Arabic text for fuzzy matching (no spaces)
function normalizeName(name: string): string {
  return normalizeNameKeepSpaces(name).replace(/\s+/g, "")
}

// Helper to get first N words of a name
function getFirstNWords(name: string, n: number): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, n).join(" ")
}

// Get MIME type based on extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    case ".pdf":
      return "application/pdf"
    default:
      return "application/octet-stream"
  }
}

async function main() {
  console.log(`🚀 Starting attachments upload script... Mode: ${DRY_RUN ? "DRY RUN (No changes will be saved)" : "EXECUTE (Uploading files and writing to DB)"}`)
  
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

  if (!fs.existsSync(ATTACHMENTS_DIR)) {
    console.error(`❌ Error: Source directory does not exist at: ${ATTACHMENTS_DIR}`)
    process.exit(1)
  }

  // 1. Fetch all active orphans from the DB
  console.log("📥 Loading orphans from database...")
  let orphans: any[] = []
  let loadRetries = 5
  while (loadRetries > 0) {
    try {
      orphans = await prisma.beneficiary.findMany({
        where: { category: "ORPHAN", deletedAt: null },
        select: { id: true, fullName: true, orphanCode: true }
      })
      break
    } catch (err: any) {
      loadRetries--
      console.warn(`  ⚠️ Failed to load orphans, retrying... (${loadRetries} retries left). Error: ${err.message || err}`)
      await prisma.$disconnect()
      await new Promise(r => setTimeout(r, 3000))
      await prisma.$connect()
      if (loadRetries === 0) throw err
    }
  }
  console.log(`✅ Loaded ${orphans.length} orphans from database.`)

  // Create a map of normalized names to orphans
  const orphanMap = new Map<string, typeof orphans[0]>()
  for (const o of orphans) {
    const norm = normalizeName(o.fullName)
    orphanMap.set(norm, o)
  }

  // 2. Read subdirectories in H:
  console.log(`📁 Reading local directory: ${ATTACHMENTS_DIR}...`)
  const items = fs.readdirSync(ATTACHMENTS_DIR)
  const folders = items.filter(item => {
    const fullPath = path.join(ATTACHMENTS_DIR, item)
    return fs.statSync(fullPath).isDirectory()
  })
  console.log(`📋 Found ${folders.length} folders in local directory.`)

  const supabase = createSupabaseAdminClient()
  
  let matchCount = 0
  let unmatchCount = 0
  let filesUploadedCount = 0
  let dbInsertedCount = 0
  const unmatchedFolders: string[] = []

  for (const folderName of folders) {
    const normalizedFolder = normalizeName(folderName)
    let matchedOrphan = null
    
    // Check manual override first
    if (MANUAL_FOLDER_MAP[folderName]) {
      const dbName = MANUAL_FOLDER_MAP[folderName]
      matchedOrphan = orphanMap.get(normalizeName(dbName))
      if (matchedOrphan) {
        console.log(`🎯 [Manual Match] "${folderName}" mapped to DB orphan "${matchedOrphan.fullName}" (${matchedOrphan.orphanCode || "No Code"})`)
      }
    }
    
    if (!matchedOrphan) {
      matchedOrphan = orphanMap.get(normalizedFolder)
    }

    if (!matchedOrphan) {
      // 1. 3-word prefix match fallback
      const folder3WordsNorm = normalizeName(getFirstNWords(folderName, 3))
      const matches3Words = orphans.filter(o => normalizeName(getFirstNWords(o.fullName, 3)) === folder3WordsNorm)

      if (matches3Words.length === 1) {
        const matched = matches3Words[0]
        console.log(`💡 [3-Word Match] "${folderName}" matched DB orphan "${matched.fullName}" (${matched.orphanCode || "No Code"})`)
        await processFolder(folderName, matched)
        matchCount++
      } else {
        // 2. 14-char normalized prefix match fallback (resolves عبد/أبو spacing issues)
        const folder14Char = normalizedFolder.substring(0, 14)
        const matches14Char = orphans.filter(o => normalizeName(o.fullName).substring(0, 14) === folder14Char)

        if (folder14Char.length >= 10 && matches14Char.length === 1) {
          const matched = matches14Char[0]
          console.log(`💡 [14-Char Match] "${folderName}" matched DB orphan "${matched.fullName}" (${matched.orphanCode || "No Code"})`)
          await processFolder(folderName, matched)
          matchCount++
        } else {
          // 3. 12-char normalized prefix match fallback
          const folder12Char = normalizedFolder.substring(0, 12)
          const matches12Char = orphans.filter(o => normalizeName(o.fullName).substring(0, 12) === folder12Char)

          if (folder12Char.length >= 8 && matches12Char.length === 1) {
            const matched = matches12Char[0]
            console.log(`💡 [12-Char Match] "${folderName}" matched DB orphan "${matched.fullName}" (${matched.orphanCode || "No Code"})`)
            await processFolder(folderName, matched)
            matchCount++
          } else {
            // 4. Fallback to partial substring match
            let partialMatch = null
            for (const [normDbName, o] of orphanMap.entries()) {
              if (normDbName.includes(normalizedFolder) || normalizedFolder.includes(normDbName)) {
                partialMatch = o
                break
              }
            }

            if (partialMatch) {
              console.log(`⚠️ [Partial Match] "${folderName}" matched DB orphan "${partialMatch.fullName}" (${partialMatch.orphanCode || "No Code"})`)
              await processFolder(folderName, partialMatch)
              matchCount++
            } else {
              unmatchCount++
              unmatchedFolders.push(folderName)
            }
          }
        }
      }
    } else {
      await processFolder(folderName, matchedOrphan)
      matchCount++
    }
  }

  async function processFolder(folderName: string, orphan: typeof orphans[0]) {
    const folderPath = path.join(ATTACHMENTS_DIR, folderName)
    const files = fs.readdirSync(folderPath).filter(f => {
      const stats = fs.statSync(path.join(folderPath, f))
      if (!stats.isFile()) return false
      const ext = path.extname(f).toLowerCase()
      const isPhoto = [".jpg", ".jpeg", ".png"].includes(ext)
      const isDoc = ext === ".pdf"
      if (PHOTOS_ONLY && !isPhoto) return false
      if (DOCUMENTS_ONLY && !isDoc) return false
      return true
    })

    if (files.length === 0) return

    console.log(`📂 [${orphan.fullName}] matches folder "${folderName}". Found ${files.length} files.`)

    for (const fileName of files) {
      const filePath = path.join(folderPath, fileName)
      const stats = fs.statSync(filePath)
      const mimeType = getMimeType(filePath)
      const sizeBytes = stats.size

      // Guess DocumentType
      let docType = "OTHER"
      const lowerName = fileName.toLowerCase()
      if (lowerName.endsWith(".pdf")) {
        docType = "OTHER" // PDF dossier
      } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png")) {
        if (lowerName.includes("شخصيه") || lowerName.includes("صوره") || fileName.includes("صورة") || fileName.includes("شخصية")) {
          docType = "ORPHAN_PHOTO_4X6"
        } else {
          docType = "FIELD_PHOTO"
        }
      }

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
      const timestamp = Date.now()
      const storagePath = `${orphan.id}/${timestamp}_${safeName}`

      // Check if already uploaded and linked (idempotency check)
      try {
        const existing = await prisma.attachment.findFirst({
          where: {
            beneficiaryId: orphan.id,
            fileName: fileName
          }
        })
        if (existing) {
          console.log(`  Skip: "${fileName}" is already uploaded.`)
          filesUploadedCount++
          dbInsertedCount++
          continue
        }
      } catch (dbErr) {
        console.warn(`  ⚠️ Warning: Failed to check existence of "${fileName}" in DB (will try uploading):`, dbErr)
      }

      if (DRY_RUN) {
        console.log(`  [DRY] Would upload "${fileName}" (${docType}) to storage: ${storagePath}`)
        filesUploadedCount++
        dbInsertedCount++
      } else {
        try {
          // Read local file into buffer
          const fileBuffer = fs.readFileSync(filePath)

          // 1. Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, fileBuffer, {
              contentType: mimeType,
              upsert: false
            })

          if (uploadError) {
            console.error(`  ❌ Failed to upload "${fileName}" for ${orphan.fullName}: ${uploadError.message}`)
            continue
          }

          // 2. Get Public URL
          const { data: publicData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(storagePath)

          const fileUrl = publicData.publicUrl

          // 3. Insert record in Prisma DB with auto-reconnect retry
          let dbInsertSuccess = false
          let dbRetries = 3
          while (dbRetries > 0) {
            try {
              await prisma.attachment.create({
                data: {
                  fileName: fileName,
                  fileUrl: fileUrl,
                  storagePath: storagePath,
                  mimeType: mimeType,
                  sizeBytes: sizeBytes,
                  documentType: docType as any,
                  beneficiaryId: orphan.id,
                  description: `مستورد تلقائياً من المجلد المحلي: ${fileName}`
                }
              })
              dbInsertSuccess = true
              break
            } catch (dbErr: any) {
              dbRetries--
              console.error(`  ⚠️ DB insert failed, reconnecting Prisma and retrying... (${dbRetries} retries left). Error: ${dbErr.message || dbErr}`)
              try {
                await prisma.$disconnect()
                await new Promise(r => setTimeout(r, 2000))
                await prisma.$connect()
              } catch (reconErr) {
                console.error("  ❌ Failed to reconnect Prisma Client:", reconErr)
              }
              if (dbRetries === 0) {
                throw dbErr
              }
            }
          }

          filesUploadedCount++
          dbInsertedCount++
          console.log(`  ✅ Successfully uploaded & linked: "${fileName}"`)
        } catch (err: any) {
          console.error(`  ❌ Error processing file "${fileName}":`, err.message || err)
        }
      }
    }
  }

  console.log("\n📊 --- SUMMARY ---")
  console.log(`✅ Matched folders: ${matchCount}`)
  console.log(`❌ Unmatched folders: ${unmatchCount}`)
  console.log(`📤 Files uploaded: ${filesUploadedCount}`)
  console.log(`💾 DB Attachment records created: ${dbInsertedCount}`)

  if (unmatchedFolders.length > 0) {
    console.log("\n⚠️ Unmatched folders details:")
    unmatchedFolders.forEach(uf => console.log(`  - "${uf}"`))
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
  })
