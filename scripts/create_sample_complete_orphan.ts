import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== Creating Complete Sample Family & Orphan ===")

  // Find system user to associate audit fields
  const user = await prisma.user.findFirst()
  if (!user) {
    console.error("No users found in database.")
    return
  }

  // Find a subdistrict to associate geographical address
  const subDistrict = await prisma.subDistrict.findFirst()
  if (!subDistrict) {
    console.error("No subdistricts found in database.")
    return
  }

  // Delete existing sample orphan if it exists to avoid unique constraint violation
  const existingOrphan = await prisma.beneficiary.findUnique({
    where: { orphanCode: "SAMPLE-999" }
  })
  if (existingOrphan) {
    await prisma.beneficiary.delete({
      where: { id: existingOrphan.id }
    })
    console.log("Cleaned up existing sample orphan.")
  }

  // Delete existing sample family if it exists
  const existingFamily = await prisma.family.findFirst({
    where: { headNationalId: "9999999999" }
  })
  if (existingFamily) {
    await prisma.family.delete({
      where: { id: existingFamily.id }
    })
    console.log("Cleaned up existing sample family.")
  }

  // Create complete family
  const family = await prisma.family.create({
    data: {
      headFullName:    "محمد أحمد علي اليوسفي",
      headNationalId:  "9999999999",
      headGender:      "MALE",
      headPhoneNumber: "777112233",
      headAltPhone:    "733112233",
      headBirthdate:   new Date("1980-04-10"),
      addressDetail:   "حي الدحي - حارة النور - عمارة البركة الدور الثاني",
      subDistrictId:   subDistrict.id,
      vulnerabilityScore: 85,
      notes:           "الأسرة تعيش في ظروف صعبة جداً بعد وفاة الأب والأم، والأيتام يعيشون مع عمهم.",
      isActive:        true,
      
      // Assessment fields
      guardianName:       "صالح أحمد علي اليوسفي",
      guardianRelation:   "عم اليتيم",
      guardianPhone:      "771112233",
      familyMembersCount: 4,
      monthlyIncome:      60000,
      housingType:        "شقة إيجار",
      housingCondition:   "سيئة ومزدحمة",
      povertyLevel:       "SEVERE",
      
      createdById:        user.id,
    }
  })
  console.log(`Created sample family: ${family.headFullName} (ID: ${family.id})`)

  // Create complete orphan profile linked to this family
  const orphan = await prisma.beneficiary.create({
    data: {
      familyId:          family.id,
      category:          "ORPHAN",
      fullName:          "عبد الله محمد أحمد اليوسفي",
      shortName:         "عبد الله اليوسفي",
      gender:            "MALE",
      birthdate:         new Date("2015-05-12"),
      nationalId:        "10123456789",
      religion:          "إسلام",
      
      // Accounts
      orphanCode:        "SAMPLE-999",
      kuraimiAccount:    "3029999999",
      kuraimiAccountOld: "123456-999",
      mumaiyo:           "MM-99999",
      baitZakatNumber:   "BZ-77777",
      
      // Education & Living
      educationalStage:  "أساسي",
      educationLevel:    "الصف الرابع",
      schoolName:        "مدرسة الفلاح النموذجية",
      quranMemorization: "خمسة أجزاء",
      nutritionStatus:   "جيدة",
      housingStatus:     "إيجار",
      
      // Health
      healthStatus:      "سليم طبيعي",
      disability:        true,
      disabilityType:    "حركية خفيفة",
      disabilityDetails: "صعوبة بسيطة في المشي بالقدم اليسرى ويحتاج علاج طبيعي",
      
      // Orphanhood
      orphanType:        "BOTH",
      fatherFullName:    "محمد أحمد علي اليوسفي",
      fatherDeathDate:   new Date("2020-08-15"),
      fatherDeathCause:  "حادث سير",
      motherDeathDate:   new Date("2022-11-20"),
      motherName:        "فاطمة حسن عبده الصبري",
      
      // Place of Birth
      birthGovernorate:  "تعز",
      birthDistrict:     "المظفر",
      birthVillage:      "حي الدحي",
      birthArea:         "حارة النور",
      
      // Referrer
      referrerName:      "الشيخ عبد الرقيب الصبري",
      referrerPhone1:    "777123456",
      referrerPhone2:    "733123456",
      
      // Marketing
      marketedToOrg:     "الهيئة الخيرية الإسلامية العالمية",
      notes:             "اليتيم متفوق دراسياً ويحتاج لكفالة صحية داعمة ومتابعة مستمرة لأطرافه الصناعية.",
      
      // Guardians relation
      guardians: {
        create: [
          {
            fullName:   "صالح أحمد علي اليوسفي",
            nationalId: "10234567890",
            relation:   "عم اليتيم",
            occupation: "معلم مدرسة",
            phone1:     "771112233",
            phone2:     "733332211",
            phone3:     "04221100",
            phone4:     "711223344",
            isPrimary:  true,
          },
          {
            fullName:   "منى حسن عبده الصبري",
            nationalId: "20345678901",
            relation:   "خالة اليتيم",
            occupation: "ربة منزل",
            phone1:     "772223344",
            isPrimary:  false,
          }
        ]
      },

      // Siblings relation
      siblings: {
        create: [
          {
            fullName:     "أنس محمد أحمد اليوسفي",
            gender:       "MALE",
            qualification: "طالب إعدادي",
            birthdate:    new Date("2011-02-10"),
            socialStatus:  "أعزب",
            siblingOrder:  1,
          },
          {
            fullName:     "مريم محمد أحمد اليوسفي",
            gender:       "FEMALE",
            qualification: "طالبة ابتدائي",
            birthdate:    new Date("2013-09-05"),
            socialStatus:  "عزباء",
            siblingOrder:  2,
          },
          {
            fullName:     "سارة محمد أحمد اليوسفي",
            gender:       "FEMALE",
            qualification: "دون سن الدراسة",
            birthdate:    new Date("2018-11-30"),
            socialStatus:  "عزباء",
            siblingOrder:  3,
          }
        ]
      }
    }
  })

  console.log(`Successfully created sample complete orphan: ${orphan.fullName} (${orphan.orphanCode})`)
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
