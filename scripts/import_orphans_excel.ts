import * as XLSX from "xlsx"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ─── Excel Serial Date → JS Date ───────────────────────────────────────────
function excelDateToJSDate(serial: number): Date | null {
  if (!serial || isNaN(serial)) return null
  // Excel's epoch starts at Jan 1, 1900 (with a leap-year bug for 1900)
  const utcDays = serial - 25569  // days from 1900-01-01 to 1970-01-01 unix epoch
  return new Date(utcDays * 86400 * 1000)
}

function cleanPhone(raw: any): string | null {
  if (!raw) return null
  const s = String(raw).replace(/\D/g, "").trim()
  if (s.length < 7) return null
  return s
}

function cleanString(raw: any): string | null {
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  return s.length === 0 ? null : s
}

function cleanDecimal(raw: any): number | null {
  if (raw === null || raw === undefined || raw === "") return null
  const n = parseFloat(String(raw))
  return isNaN(n) ? null : n
}

function cleanInt(raw: any): number | null {
  if (raw === null || raw === undefined || raw === "") return null
  const n = parseInt(String(raw), 10)
  return isNaN(n) ? null : n
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      const isConnectionError = err?.message?.includes("Server has closed") ||
        err?.message?.includes("Can't reach") ||
        err?.message?.includes("Connection refused") ||
        err?.code === "P1001" || err?.code === "P1017"
      if (isConnectionError && attempt < retries) {
        console.warn(`⚠️ Connection error, retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})...`)
        await new Promise(r => setTimeout(r, delayMs))
        continue
      }
      throw err
    }
  }
  throw new Error("Max retries exceeded")
}async function pMap<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  const promises: Promise<void>[] = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const currIndex = index++
      const item = items[currIndex]
      try {
        results[currIndex] = await fn(item, currIndex)
      } catch (err) {
        // preserve error to handle in main loop
        results[currIndex] = err as any
      }
    }
  }

  for (let i = 0; i < Math.min(limit, items.length); i++) {
    promises.push(worker())
  }
  await Promise.all(promises)
  return results
}

function mapGender(raw: any): "MALE" | "FEMALE" | null {
  const s = cleanString(raw)
  if (!s) return null
  if (s.includes("ذكر")) return "MALE"
  if (s.includes("أنثى") || s.includes("انثى") || s.includes("بنت")) return "FEMALE"
  return "MALE" // default
}

function mapOrphanType(raw: any): string {
  const s = cleanString(raw) || ""
  if (s.includes("أبوين") || s.includes("ابوين")) return "BOTH"
  if (s.includes("الأم") || s.includes("الام")) return "MOTHER"
  return "FATHER" // most common default
}

// ─── Main Import ────────────────────────────────────────────────────────────
async function main() {
  const DRY_RUN = process.argv.includes("--dry-run")
  console.log(`🚀 Starting orphan import${DRY_RUN ? " [DRY RUN]" : ""}...`)

  const filePath = "C:\\Users\\my computer\\Downloads\\كشف بيانات الايتام كامل .xlsx"
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][]

  // Row 0: Title, Row 1: Subtitle/Sponsor info, Row 2: Headers, Row 3+: Data
  const dataRows = rawData.slice(3).filter(row => row[20] !== null && row[20] !== undefined)

  console.log(`📋 Found ${dataRows.length} valid orphan rows to import.`)

  // Get or create system admin user for createdBy
  let adminUser = await withRetry(() => prisma.user.findFirst({ where: { role: "ADMIN" } }))
  if (!adminUser) {
    console.error("❌ No admin user found. Please create one first.")
    process.exit(1)
  }

  // Get or create a default SubDistrict for orphans (required by Family)
  let defaultSubDistrict = await withRetry(() => prisma.subDistrict.findFirst())
  if (!defaultSubDistrict) {
    console.error("❌ No SubDistrict found in the database. Please seed location data first.")
    process.exit(1)
  }

  console.log("📥 Loading existing database records into memory cache...")
  const sponsors = await withRetry(() => prisma.sponsor.findMany())
  const sponsorMap = new Map<string, any>(sponsors.map(s => [s.organization || s.fullName, s]))

  const families = await withRetry(() => prisma.family.findMany({ where: { headNationalId: { startsWith: "IMPORT-FAM-" } } }))
  const familyMap = new Map<string, any>(families.map(f => [f.headNationalId, f]))

  const beneficiaries = await withRetry(() => prisma.beneficiary.findMany({ where: { category: "ORPHAN" } }))
  const beneficiaryMap = new Map<string, any>(beneficiaries.map(b => [b.orphanCode || "", b]))

  const guardians = await withRetry(() => prisma.guardian.findMany())
  const guardianSet = new Set<string>(guardians.map(g => `${g.beneficiaryId}_${g.fullName}`))

  const sponsorships = await withRetry(() => prisma.sponsorship.findMany())
  const sponsorshipSet = new Set<string>(sponsorships.map(s => `${s.sponsorId}_${s.beneficiaryId}`))

  const tags = await withRetry(() => prisma.tag.findMany())
  const tagMap = new Map<string, any>(tags.map(t => [t.nameAr, t]))

  const beneficiaryTags = await withRetry(() => prisma.beneficiaryTag.findMany())
  const benTagSet = new Set<string>(beneficiaryTags.map(bt => `${bt.beneficiaryId}_${bt.tagId}`))
  console.log(`✅ Loaded ${sponsors.length} sponsors, ${families.length} families, ${beneficiaries.length} orphans, ${tags.length} tags into memory.`)

  // ── Pre-create Sponsors & Tags to avoid parallel duplicates ───────────
  console.log("🚀 Pre-creating sponsors & tags...")
  const uniqueSponsorNames = Array.from(new Set(dataRows.map(row => cleanString(row[4])).filter(Boolean) as string[]))
  for (const name of uniqueSponsorNames) {
    let sponsor = sponsorMap.get(name)
    if (!sponsor) {
      sponsor = await prisma.sponsor.create({
        data: {
          fullName: name,
          organization: name,
          country: "SA"
        }
      })
      sponsorMap.set(name, sponsor)
    }
  }

  const uniqueTags = Array.from(new Set(dataRows.map(row => cleanString(row[19])).filter(Boolean) as string[]))
  for (const name of uniqueTags) {
    let tag = tagMap.get(name)
    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          nameAr: name,
          category: "ORPHAN_OPERATIONAL_STATUS",
          color: "#6366f1"
        }
      })
      tagMap.set(name, tag)
    }
  }
  console.log("✅ Pre-creation finished.")

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  await pMap(dataRows, 5, async (row, i) => {
    if (errorCount > 30) return

    try {
      // ── Extract all columns ──────────────────────────────────────────────
      const rowNum         = cleanInt(row[0])
      const codeYemeni     = cleanString(row[1])
      const codeSaudi      = cleanString(row[2])
      const codeMumaiyo    = cleanString(row[3])
      const sponsorOrgName = cleanString(row[4])
      const sponsorAmount  = cleanDecimal(row[5])
      const sponsorMonths  = cleanInt(row[6])
      const shareOrphanKWD = cleanDecimal(row[7])
      const shareOrgKWD    = cleanDecimal(row[8])
      const totalKWD       = cleanDecimal(row[9])
      const shareOrphanSAR = cleanDecimal(row[10])
      const shareOrgSAR    = cleanDecimal(row[11])
      const totalSAR       = cleanDecimal(row[12])
      const orphanShare    = cleanDecimal(row[13])
      const orphanShareRnd = cleanDecimal(row[14])
      const houseShare     = cleanDecimal(row[15])
      const orphanCodeLocal= cleanString(row[16])

      const classification = cleanString(row[19])
      const fullName       = cleanString(row[20])
      const fatherName     = cleanString(row[21])
      const religion       = cleanString(row[22])
      const gender         = mapGender(row[23])
      const birthdateRaw   = row[24]
      const birthdate      = typeof birthdateRaw === "number" ? excelDateToJSDate(birthdateRaw) : null
      const birthGov       = cleanString(row[26])
      const birthDist      = cleanString(row[27])
      const birthVillage   = cleanString(row[28])
      const birthArea      = cleanString(row[29])
      const currentGov     = cleanString(row[30])
      const currentDist    = cleanString(row[31])
      const currentArea    = cleanString(row[32])
      const currentAddrFull= cleanString(row[33])
      const orphanTypeRaw  = cleanString(row[34])
      const deathDateRaw   = row[35]
      const fatherDeathDate= typeof deathDateRaw === "number" ? excelDateToJSDate(deathDateRaw) : null
      const fatherDeathCause= cleanString(row[36])
      const motherName     = cleanString(row[37])
      const siblingsMale   = cleanInt(row[38])
      const siblingsFemale = cleanInt(row[39])
      const siblingsTotal  = cleanInt(row[40])
      const educLevel      = cleanString(row[41])
      const schoolName     = cleanString(row[42])
      const schoolGrade    = cleanString(row[43])
      const dropoutReason  = cleanString(row[44])
      const quranMemorize  = cleanString(row[45])
      const prayer         = cleanString(row[46])
      const aspirations    = cleanString(row[47])
      // col 48 = سليم, col 49 = مريض — derived
      const diseaseType    = cleanString(row[50])
      const healthStatus   = cleanString(row[51])
      const nutrition      = cleanString(row[52])
      const housing        = cleanString(row[53])
      const guardianName   = cleanString(row[54])
      const guardianRel    = cleanString(row[55])
      const guardianJob    = cleanString(row[56])
      const incomeType     = cleanString(row[57])
      const incomeSuff     = cleanString(row[58])
      const phone1         = cleanPhone(row[59])
      const phone2         = cleanPhone(row[60])
      const phone3         = cleanPhone(row[61])

      if (!fullName) {
        skipCount++
        return
      }

      // Determine final orphanCode
      const finalOrphanCode = orphanCodeLocal || codeYemeni || `ROW-${i + 4}`

      if (DRY_RUN) {
        if (i < 3) {
          console.log(`\n[DRY RUN] Row ${i + 4}:`, {
            fullName, fatherName, gender, birthdate, orphanType: mapOrphanType(orphanTypeRaw || ""),
            finalOrphanCode, sponsorOrgName, sponsorAmount, guardianName
          })
        }
        successCount++
        return
      }
      await withRetry(async () => {
        // ── Step 1: Find or create Sponsor ──────────────────────────────────
        let sponsor = null
        if (sponsorOrgName) {
          sponsor = sponsorMap.get(sponsorOrgName)
          if (!sponsor) {
            sponsor = await prisma.sponsor.create({
              data: {
                fullName: sponsorOrgName,
                organization: sponsorOrgName,
                country: "SA"
              }
            })
            sponsorMap.set(sponsorOrgName, sponsor)
          }
        }

        // ── Step 2: Create Family record (Idempotent by deterministic headNationalId) ──────────────────────────
        const familyHeadName = fatherName || guardianName || fullName || `أسرة-${i}`
        const fakeNationalId = `IMPORT-FAM-${finalOrphanCode}`
        let family = familyMap.get(fakeNationalId)
        if (!family) {
          family = await prisma.family.create({
            data: {
              headFullName: familyHeadName,
              headNationalId: fakeNationalId,
              subDistrictId: defaultSubDistrict!.id,
              guardianName: guardianName,
              guardianRelation: guardianRel,
              guardianPhone: phone1,
              createdById: adminUser!.id,
            }
          })
          familyMap.set(fakeNationalId, family)
        }

        // ── Step 3: Create Beneficiary (Orphan) (Idempotent by finalOrphanCode) ───────────────────────────
        let beneficiary = beneficiaryMap.get(finalOrphanCode)
        if (!beneficiary) {
          beneficiary = await prisma.beneficiary.create({
            data: {
              fullName: fullName!,
              gender: gender || "MALE",
              birthdate: birthdate || new Date("2010-01-01"),
              religion: religion,
              category: "ORPHAN",
              familyId: family.id,
              createdById: adminUser!.id,

              // Identification
              orphanCode: finalOrphanCode,
              kuraimiAccountYemeni: codeYemeni,
              kuraimiAccount: codeSaudi,
              mumaiyo: codeMumaiyo,

              // Education
              educationLevel: educLevel,
              educationalStage: educLevel,
              schoolName: schoolName,
              schoolGrade: schoolGrade,
              educationDropoutReason: dropoutReason,
              quranMemorization: quranMemorize,
              prayerCommitment: prayer,
              aspirations: aspirations,

              // Health
              healthStatus: healthStatus,
              disabilityType: diseaseType,
              disability: !!(diseaseType && diseaseType !== "لايوجد" && diseaseType !== "لا يوجد" && diseaseType !== "سليم"),

              // Living
              nutritionStatus: nutrition,
              housingStatus: housing,

              // Orphan info
              orphanType: mapOrphanType(orphanTypeRaw || "") as any,
              fatherFullName: fatherName,
              fatherDeathDate: fatherDeathDate,
              fatherDeathCause: fatherDeathCause,
              motherName: motherName,

              // Birth location
              birthGovernorate: birthGov,
              birthDistrict: birthDist,
              birthVillage: birthVillage,
              birthArea: birthArea,

              // Current location
              currentGovernorate: currentGov,
              currentDistrict: currentDist,
              currentArea: currentArea,
              currentAddressFull: currentAddrFull,

              // Siblings count
              siblingsMaleCount: siblingsMale,
              siblingsFemaleCount: siblingsFemale,
              siblingsTotal: siblingsTotal,

              verificationStatus: "APPROVED",
              isActive: true,
            }
          })
          beneficiaryMap.set(finalOrphanCode, beneficiary)
        }

        // ── Step 4: Create Guardian (Idempotent) ──────────────────────────────────────────
        if (guardianName) {
          const guardianKey = `${beneficiary.id}_${guardianName}`
          if (!guardianSet.has(guardianKey)) {
            await prisma.guardian.create({
              data: {
                beneficiaryId: beneficiary.id,
                fullName: guardianName,
                relation: guardianRel,
                occupation: guardianJob,
                incomeType: incomeType,
                incomeSufficiency: incomeSuff,
                phone1: phone1,
                phone2: phone2,
                phone3: phone3,
                isPrimary: true,
              }
            })
            guardianSet.add(guardianKey)
          }
        }

        // ── Step 5: Create Sponsorship (Idempotent) ───────────────────────────────────────
        if (sponsor && sponsorAmount && sponsorAmount > 0) {
          const sponsorshipKey = `${sponsor.id}_${beneficiary.id}`
          if (!sponsorshipSet.has(sponsorshipKey)) {
            await prisma.sponsorship.create({
              data: {
                sponsorId: sponsor.id,
                beneficiaryId: beneficiary.id,
                amount: sponsorAmount,
                currency: "KWD" as any,
                paymentCycle: "MONTHLY",
                status: "ACTIVE",
                createdById: adminUser!.id,

                // Months
                sponsorshipMonths: sponsorMonths,

                // KWD breakdown
                shareOrphanKWD: shareOrphanKWD,
                shareOrgKWD: shareOrgKWD,
                totalAmountKWD: totalKWD,

                // SAR breakdown
                shareOrphanSAR: shareOrphanSAR,
                shareOrgSAR: shareOrgSAR,
                totalAmountSAR: totalSAR,

                // Shares
                orphanShare: orphanShare,
                orphanShareRounded: orphanShareRnd,
                houseShare: houseShare,
              }
            })
            sponsorshipSet.add(sponsorshipKey)
          }
        }

        // ── Step 6: Create Tag for classification ────────────────────────────
        if (classification) {
          let tag = tagMap.get(classification)
          if (!tag) {
            tag = await prisma.tag.create({ data: { nameAr: classification, category: "ORPHAN_OPERATIONAL_STATUS", color: "#6366f1" } })
            tagMap.set(classification, tag)
          }
          const benTagKey = `${beneficiary.id}_${tag.id}`
          if (!benTagSet.has(benTagKey)) {
            await prisma.beneficiaryTag.create({
              data: {
                beneficiaryId: beneficiary.id,
                tagId: tag.id,
              }
            }).catch(() => {}) // ignore duplicate
            benTagSet.add(benTagKey)
          }
        }
      })
      successCount++

      if (successCount % 20 === 0) {
        console.log(`✅ Imported ${successCount}/${dataRows.length}...`)
      }

    } catch (err: any) {
      errorCount++
      console.error(`❌ Error on row ${i + 4} (${cleanString(row[20])}): ${err.message}`)
    }
  })

  console.log("\n🎉 Import completed!")
  console.log(JSON.stringify({ successCount, skipCount, errorCount }, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Fatal error:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
