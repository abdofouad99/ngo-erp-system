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

function mapGender(raw: any): "MALE" | "FEMALE" | null {
  const s = cleanString(raw)
  if (!s) return null
  if (s.includes("ذكر")) return "MALE"
  if (s.includes("أنثى") || s.includes("انثى") || s.includes("بنت")) return "FEMALE"
  return "MALE" // default
}

function mapOrphanType(raw: any): string {
  const s = cleanString(raw) || ""
  if (s.includes("أبوين") || s.includes("ابوين")) return "BOTH_PARENTS"
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
  let adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!adminUser) {
    console.error("❌ No admin user found. Please create one first.")
    process.exit(1)
  }

  // Get or create a default SubDistrict for orphans (required by Family)
  let defaultSubDistrict = await prisma.subDistrict.findFirst()
  if (!defaultSubDistrict) {
    console.error("❌ No SubDistrict found in the database. Please seed location data first.")
    process.exit(1)
  }

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]

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
        continue
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
        continue
      }

      // ── Step 1: Find or create Sponsor ──────────────────────────────────
      let sponsor = null
      if (sponsorOrgName) {
        sponsor = await prisma.sponsor.findFirst({
          where: { organization: sponsorOrgName }
        })
        if (!sponsor) {
          sponsor = await prisma.sponsor.create({
            data: {
              fullName: sponsorOrgName,
              organization: sponsorOrgName,
              country: "SA"
            }
          })
        }
      }

      // ── Step 2: Create Family record ────────────────────────────────────
      // headNationalId must be unique — use a generated value based on row index + orphan code
      const familyHeadName = fatherName || guardianName || fullName || `أسرة-${i}`
      const fakeNationalId = `IMPORT-${Date.now()}-${i}`
      const family = await prisma.family.create({
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

      // ── Step 3: Create Beneficiary (Orphan) ─────────────────────────────
      const beneficiary = await prisma.beneficiary.create({
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
          kuraimiAccount: codeSaudi,
          mumaiyo: codeMumaiyo,

          // Education
          educationLevel: educLevel,
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

      // ── Step 4: Create Guardian ──────────────────────────────────────────
      if (guardianName) {
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
      }

      // ── Step 5: Create Sponsorship ───────────────────────────────────────
      if (sponsor && sponsorAmount && sponsorAmount > 0) {
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
      }

      // ── Step 6: Create Tag for classification ────────────────────────────
      if (classification) {
        let tag = await prisma.tag.findFirst({ where: { nameAr: classification } })
        if (!tag) {
          tag = await prisma.tag.create({ data: { nameAr: classification, category: "ORPHAN" as any, color: "#6366f1" } })
        }
        await prisma.beneficiaryTag.create({
          data: {
            beneficiaryId: beneficiary.id,
            tagId: tag.id,
          }
        }).catch(() => {}) // ignore duplicate
      }

      successCount++

      if (successCount % 100 === 0) {
        console.log(`✅ Imported ${successCount}/${dataRows.length}...`)
      }

    } catch (err: any) {
      errorCount++
      console.error(`❌ Error on row ${i + 4} (${cleanString(row[20])}): ${err.message}`)
      if (errorCount > 20) {
        console.error("Too many errors. Stopping.")
        break
      }
    }
  }

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
