// =============================================================================
// NGO ERP — Excel Data Ingest Script
// Run with: npx tsx scripts/import_excel_data.ts
// =============================================================================

import { PrismaClient, Gender, BeneficiaryCategory, ProjectCategory, ProjectStatus, Currency, PovertyLevel, OrphanType } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

const scratchDir = "C:\\Users\\my computer\\.gemini\\antigravity\\brain\\b1f67750-12b1-4ef0-90a2-b46de15cbea6\\scratch"

// Logs
const log = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  success: (msg: string) => console.log(`[SUCCESS] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string, err?: any) => console.error(`[ERROR] ${msg}`, err || ""),
}

// Helpers for caching Geographics to avoid querying supabse repeatedly
const govCache: Record<string, number> = {}
const distCache: Record<string, number> = {}
const subDistCache: Record<string, number> = {}

async function getOrCreateSubDistrict(govName: string, distName: string, subDistName: string): Promise<number> {
  const cleanGov = (govName || "تعز").trim()
  const cleanDist = (distName || "المظفر").trim()
  const cleanSub = (subDistName || "حي الحصب").trim()

  const govKey = cleanGov
  const distKey = `${cleanGov}_${cleanDist}`
  const subDistKey = `${cleanGov}_${cleanDist}_${cleanSub}`

  // 1. Resolve Governorate
  if (!govCache[govKey]) {
    let gov = await prisma.governorate.findUnique({
      where: { nameAr: cleanGov },
    })
    if (!gov) {
      gov = await prisma.governorate.create({
        data: { nameAr: cleanGov },
      })
      log.info(`Created new Governorate: ${cleanGov}`)
    }
    govCache[govKey] = gov.id
  }
  const govId = govCache[govKey]

  // 2. Resolve District
  if (!distCache[distKey]) {
    let dist = await prisma.district.findFirst({
      where: { nameAr: cleanDist, governorateId: govId },
    })
    if (!dist) {
      dist = await prisma.district.create({
        data: { nameAr: cleanDist, governorateId: govId },
      })
      log.info(`Created new District: ${cleanDist} in ${cleanGov}`)
    }
    distCache[distKey] = dist.id
  }
  const distId = distCache[distKey]

  // 3. Resolve SubDistrict
  if (!subDistCache[subDistKey]) {
    let subDist = await prisma.subDistrict.findFirst({
      where: { nameAr: cleanSub, districtId: distId },
    })
    if (!subDist) {
      subDist = await prisma.subDistrict.create({
        data: { nameAr: cleanSub, districtId: distId },
      })
      log.info(`Created new Sub-District/Area: ${cleanSub} in ${cleanDist}`)
    }
    subDistCache[subDistKey] = subDist.id
  }

  return subDistCache[subDistKey]
}

// Simple hash generator for unique deterministic IDs
function getDeterministicId(name: string, fallback: string) {
  let hash = 0
  const combined = `${name}_${fallback}`
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `SYS-GEN-${Math.abs(hash).toString(36).substring(0, 10).toUpperCase()}`
}

async function main() {
  log.info("Starting database ingestion script...")

  // Get Admin user
  let adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  })
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: "admin@ngo.com",
        name: "مشرف النظام",
        role: "ADMIN",
        isActive: true,
      },
    })
    log.success("Created default system administrator user admin@ngo.com")
  }

  // Map to hold our created Family IDs by their Excel Keys
  const familyKeyToIdMap: Record<string, string> = {}

  // ---------------------------------------------------------------------------
  // Step 1: Import File 1 Caregiver Families
  // ---------------------------------------------------------------------------
  log.info("Step 1: Importing File 1 Caregiver Families...")
  const f1Families = JSON.parse(fs.readFileSync(path.join(scratchDir, "f1_families.json"), "utf8"))
  let f1FamSuccess = 0
  let f1FamSkipped = 0

  for (const fam of f1Families) {
    try {
      const nationalId = fam.headNationalId || fam.key
      // Check if family already exists by nationalId
      let existing = await prisma.family.findUnique({
        where: { headNationalId: nationalId },
      })

      if (existing) {
        familyKeyToIdMap[fam.key] = existing.id
        f1FamSkipped++
        continue
      }

      // Resolve SubDistrict
      const subDistrictId = await getOrCreateSubDistrict(fam.governorate, fam.district, fam.subDistrict)

      // Create Family
      const created = await prisma.family.create({
        data: {
          headFullName: fam.headFullName,
          headNationalId: nationalId,
          headGender: Gender.MALE, // Default
          headPhoneNumber: fam.headPhoneNumber || null,
          headAltPhone: fam.headAltPhone || null,
          addressDetail: fam.addressDetail || null,
          subDistrictId: subDistrictId,
          vulnerabilityScore: 80, // High score for orphan caregivers
          notes: fam.notes || "مستورد من ملف الأيتام",
          guardianName: fam.headFullName,
          guardianRelation: fam.relation || "معيل",
          guardianPhone: fam.headPhoneNumber || null,
          familyMembersCount: fam.members_count || 1,
          isActive: true,
          createdById: adminUser.id,
        },
      })

      familyKeyToIdMap[fam.key] = created.id
      f1FamSuccess++
    } catch (err) {
      log.error(`Failed to import family (${fam.headFullName}):`, err)
    }
  }
  log.success(`Imported File 1 Families: ${f1FamSuccess} created, ${f1FamSkipped} skipped.`)

  // ---------------------------------------------------------------------------
  // Step 2: Import File 1 Orphans
  // ---------------------------------------------------------------------------
  log.info("Step 2: Importing File 1 Orphans...")
  const f1Orphans = JSON.parse(fs.readFileSync(path.join(scratchDir, "f1_orphans.json"), "utf8"))
  let orphanSuccess = 0
  let orphanSkipped = 0

  for (const orphan of f1Orphans) {
    try {
      const familyId = familyKeyToIdMap[orphan.familyKey]
      if (!familyId) {
        log.warn(`Skip orphan (${orphan.fullName}) - Parent family not found for key: ${orphan.familyKey}`)
        continue
      }

      // Check unique constraints (nationalId or orphanCode)
      if (orphan.nationalId) {
        const exist = await prisma.beneficiary.findFirst({
          where: { nationalId: orphan.nationalId, familyId: familyId },
        })
        if (exist) {
          orphanSkipped++
          continue
        }
      }
      if (orphan.orphanCode) {
        const exist = await prisma.beneficiary.findUnique({
          where: { orphanCode: orphan.orphanCode },
        })
        if (exist) {
          orphanSkipped++
          continue
        }
      }

      // Parse dates safely
      let birthdate = new Date("2015-01-01")
      if (orphan.birthdate) {
        const d = new Date(orphan.birthdate)
        if (!isNaN(d.getTime())) {
          birthdate = d
        }
      }

      let deathDate: Date | null = null
      if (orphan.fatherDeathDate) {
        const d = new Date(orphan.fatherDeathDate)
        if (!isNaN(d.getTime())) {
          deathDate = d
        }
      }

      await prisma.beneficiary.create({
        data: {
          fullName: orphan.fullName,
          gender: orphan.gender === "FEMALE" ? Gender.FEMALE : Gender.MALE,
          birthdate: birthdate,
          nationalId: orphan.nationalId || null,
          category: BeneficiaryCategory.ORPHAN,
          orphanCode: orphan.orphanCode || null,
          kuraimiAccount: orphan.kuraimiAccount || null,
          educationLevel: orphan.educationLevel || null,
          schoolName: orphan.schoolName || null,
          educationalStage: orphan.educationalStage || null,
          notes: orphan.notes || null,
          familyId: familyId,
          motherName: orphan.motherName || null,
          fatherDeathDate: deathDate,
          fatherDeathCause: orphan.fatherDeathCause || null,
          orphanType: OrphanType.FATHER, // Default
          verificationStatus: "APPROVED",
          isActive: true,
        },
      })

      orphanSuccess++
    } catch (err) {
      log.error(`Failed to import orphan (${orphan.fullName}):`, err)
    }
  }
  log.success(`Imported Orphans: ${orphanSuccess} created, ${orphanSkipped} skipped.`)

  // ---------------------------------------------------------------------------
  // Step 3: Import File 2 General Families
  // ---------------------------------------------------------------------------
  log.info("Step 3: Importing File 2 General Families...")
  const f2Families = JSON.parse(fs.readFileSync(path.join(scratchDir, "f2_families.json"), "utf8"))
  let f2FamSuccess = 0
  let f2FamSkipped = 0

  for (const fam of f2Families) {
    try {
      const nationalId = fam.headNationalId || fam.key
      let existing = await prisma.family.findUnique({
        where: { headNationalId: nationalId },
      })

      if (existing) {
        f2FamSkipped++
        continue
      }

      const subDistrictId = await getOrCreateSubDistrict(fam.governorate, fam.district, fam.subDistrict)

      let poverty: PovertyLevel = PovertyLevel.MEDIUM
      if (fam.povertyLevel === "SEVERE") poverty = PovertyLevel.SEVERE

      await prisma.family.create({
        data: {
          headFullName: fam.headFullName,
          headNationalId: nationalId,
          headGender: Gender.MALE,
          headPhoneNumber: fam.headPhoneNumber || null,
          addressDetail: fam.addressDetail || null,
          subDistrictId: subDistrictId,
          vulnerabilityScore: poverty === PovertyLevel.SEVERE ? 65 : 40,
          notes: fam.notes || "مستورد من ملف الأسر والمستفيدين",
          guardianName: fam.guardianName || null,
          guardianRelation: fam.guardianRelation || null,
          povertyLevel: poverty,
          isActive: true,
          createdById: adminUser.id,
        },
      })

      f2FamSuccess++
    } catch (err) {
      log.error(`Failed to import general family (${fam.headFullName}):`, err)
    }
  }
  log.success(`Imported General Families: ${f2FamSuccess} created, ${f2FamSkipped} skipped.`)

  // ---------------------------------------------------------------------------
  // Step 4: Import File 2 Projects & Distributions
  // ---------------------------------------------------------------------------
  log.info("Step 4: Importing Projects & Distributions...")
  const distributions = JSON.parse(fs.readFileSync(path.join(scratchDir, "distributions.json"), "utf8"))
  let distSuccess = 0
  let distSkipped = 0

  for (const dist of distributions) {
    try {
      // 1. Find or create the Project
      const cleanProjectName = dist.projectName.trim()
      let project = await prisma.project.findFirst({
        where: { name: cleanProjectName, deletedAt: null },
      })

      if (!project) {
        project = await prisma.project.create({
          data: {
            name: cleanProjectName,
            description: `مشروع مستورد تلقائياً: ${cleanProjectName} (نوع: ${dist.projectType})`,
            category: ProjectCategory.IN_KIND,
            status: ProjectStatus.ACTIVE,
            createdById: adminUser.id,
          },
        })
        log.info(`Created new project: ${cleanProjectName}`)
      }

      // 2. Find Family matching the headFullName
      let family = await prisma.family.findFirst({
        where: { headFullName: dist.headFullName, deletedAt: null },
      })

      // Try matching by phone if name did not yield exact match
      if (!family && dist.phone) {
        family = await prisma.family.findFirst({
          where: { headPhoneNumber: dist.phone, deletedAt: null },
        })
      }

      // If still not found, create a new family for this distribution recipient
      if (!family) {
        const subDistrictId = await getOrCreateSubDistrict("تعز", "المظفر", "غير محدد")
        const generatedId = getDeterministicId(dist.headFullName, dist.phone || "gen")
        
        family = await prisma.family.create({
          data: {
            headFullName: dist.headFullName,
            headNationalId: generatedId,
            headGender: Gender.MALE,
            headPhoneNumber: dist.phone || null,
            headAltPhone: dist.phone2 || null,
            addressDetail: dist.address || null,
            subDistrictId: subDistrictId,
            vulnerabilityScore: 50,
            notes: "عائلة مستوردة تلقائياً من كشف توزيع المشاريع العينية",
            isActive: true,
            createdById: adminUser.id,
          },
        })
        log.info(`Created family dynamically for project beneficiary: ${dist.headFullName}`)
      }

      // 3. Resolve the head beneficiary (category GENERAL) to link project beneficiary to
      let beneficiary = await prisma.beneficiary.findFirst({
        where: { familyId: family.id, fullName: family.headFullName, deletedAt: null },
      })

      if (!beneficiary) {
        beneficiary = await prisma.beneficiary.create({
          data: {
            fullName: family.headFullName,
            gender: Gender.MALE,
            birthdate: new Date("1980-01-01"),
            category: BeneficiaryCategory.GENERAL,
            familyId: family.id,
            verificationStatus: "APPROVED",
            isActive: true,
          },
        })
      }

      // 4. Create ProjectBeneficiary distribution
      // Verify duplicate distribution
      const existDist = await prisma.projectBeneficiary.findFirst({
        where: {
          projectId: project.id,
          beneficiaryId: beneficiary.id,
          batchNumber: 1,
          deletedAt: null,
        },
      })

      if (existDist) {
        distSkipped++
        continue
      }

      await prisma.projectBeneficiary.create({
        data: {
          projectId: project.id,
          beneficiaryId: beneficiary.id,
          batchNumber: 1,
          deliveredItem: dist.projectType || "سلة عينية / باص",
          quantity: 1,
          isDelivered: true,
          deliveryDate: new Date(),
          recordedById: adminUser.id,
        },
      })

      distSuccess++
    } catch (err) {
      log.error(`Failed to import project distribution for (${dist.headFullName}):`, err)
    }
  }
  log.success(`Imported Distributions: ${distSuccess} created, ${distSkipped} skipped.`)

  // ---------------------------------------------------------------------------
  // Step 5: Send Notification to the system
  // ---------------------------------------------------------------------------
  const totalFamilies = f1FamSuccess + f2FamSuccess
  const totalOrphans = orphanSuccess
  const totalDistributions = distSuccess

  await prisma.notification.create({
    data: {
      title: "نجاح استيراد قاعدة البيانات بالكامل",
      message: `اكتملت عملية الاستيراد المجمعة لقواعد البيانات للعام 2025 بنجاح: تم استيراد ${totalFamilies} أسرة، ${totalOrphans} يتيماً، و ${totalDistributions} تسليمات مشاريع عينية.`,
      type: "SUCCESS",
      read: false,
    },
  })
  log.success("In-app success notification created.")

  log.info("Database ingestion successfully finished.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    log.error("Ingestion failed critically:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
