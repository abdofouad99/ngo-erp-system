import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting full demo data seed...")

  // 1. Fetch Admin User & SubDistricts
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  })

  if (!adminUser) {
    console.error("No Admin user found!")
    return
  }

  const subDistricts = await prisma.subDistrict.findMany({
    take: 20,
    include: { district: { include: { governorate: true } } },
  })

  if (subDistricts.length === 0) {
    console.error("No SubDistricts found in DB! Please make sure geography is seeded.")
    return
  }

  // 2. Create Sponsors
  console.log("📦 Creating Sponsors...")
  const sponsorNames = [
    { name: "فهد بن عبدالمحسن الصباح", org: "جمعية العون المباشر", country: "الكويت", email: "fahad.alsabah@kwait.org", phone: "+96599887761" },
    { name: "عبدالله بن علي الراجحي", org: "مؤسسة الراجحي الخيرية", country: "السعودية", email: "rajhi.a@rajhifoundation.sa", phone: "+966501234567" },
    { name: "د. عبدالكريم يحيى الإرياني", org: "مؤسسة التنمية الإنسانية", country: "اليمن", email: "eryani@humanyemen.org", phone: "+967771234567" },
    { name: "سعود ناصر الحجبان", org: "جمعية النجاة الخيرية", country: "الكويت", email: "najah@alnajah.org.kw", phone: "+96566778899" },
    { name: "خالد محمد القاسمي", org: "هيئة الأعمال الخيرية", country: "الإمارات", email: "k.qasimi@charity.ae", phone: "+971509876543" },
    { name: "علي بن سلطان الكواري", org: "قطر الخيرية", country: "قطر", email: "alkwari@qcharity.org", phone: "+97455443322" },
    { name: "عمر سالم بامدحج", org: "مؤسسة صلة للتنمية", country: "اليمن", email: "selah@selah.org", phone: "+967770011223" },
    { name: "طارق بن زياد السويدان", org: "مركز الأمل الإنساني", country: "الكويت", email: "suwaidan@hope.org", phone: "+96590001122" },
    { name: "أحمد بن عيسى البلوشي", org: "جمعية دار البر", country: "عمان", email: "balushi@daralber.om", phone: "+96892345678" },
    { name: "منيرة بنت صالح العلي", org: "فردي - متبرعة", country: "السعودية", email: "munira.ali@gmail.com", phone: "+966554433221" }
  ]

  const createdSponsors = []
  for (const s of sponsorNames) {
    const sponsor = await prisma.sponsor.upsert({
      where: { email: s.email },
      update: {},
      create: {
        fullName: s.name,
        organization: s.org,
        email: s.email,
        phone: s.phone,
        country: s.country,
        notes: "كفيل دائم وموثوق للمؤسسة",
      },
    })
    createdSponsors.push(sponsor)
  }

  // 3. Create Projects
  console.log("🏗️ Creating Projects...")
  const projectsData = [
    { name: "مشروع السلة الغذائية الرمضانية 2026", category: "IN_KIND", budget: 25000, target: 500 },
    { name: "كفالة الأيتام الشاملة — الدورة الأولى", category: "CASH", budget: 40000, target: 200 },
    { name: "مشروع كسوة العيد للأسر الأشد فقراً", category: "IN_KIND", budget: 15000, target: 300 },
    { name: "برنامج الدعم الطبي والأدوية المزمنة", category: "MEDICAL", budget: 18000, target: 150 },
    { name: "مشروع التمكين الاقتصادي وسلال الخياطة", category: "TRAINING", budget: 12000, target: 40 },
    { name: "توزيع مياه الصالح للشرب للمخيمات", category: "IN_KIND", budget: 8000, target: 1000 },
    { name: "مشروع توزيع التمور والدقيق للنازحين", category: "IN_KIND", budget: 10000, target: 400 },
    { name: "منحة الحقيبة والمستلزمات المدرسية", category: "OTHER", budget: 9000, target: 250 },
  ]

  const createdProjects = []
  for (const p of projectsData) {
    const proj = await prisma.project.create({
      data: {
        name: p.name,
        description: `مشروع إغاثي وتنموي تستهدفه المؤسسة لخدمة الأسر والأيتام — ${p.name}`,
        category: p.category as any,
        status: "ACTIVE",
        budget: p.budget,
        currency: "USD",
        targetCount: p.target,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdById: adminUser.id,
      },
    })
    createdProjects.push(proj)
  }

  // 4. Create Families & Beneficiaries
  console.log("👨‍👩‍👧‍👦 Creating Families & Beneficiaries...")
  const familyHeads = [
    { name: "صالح بن أحمد الحكيمي", id: "1019882736", phone: "771234111", poverty: "SEVERE", dis: true, orphans: 3, housing: "إيجار" },
    { name: "فاطمة محمد الأهدل", id: "1028773645", phone: "772345222", poverty: "SEVERE", dis: true, orphans: 4, housing: "خيمة / مخيم", widow: true },
    { name: "عبدالرحمن علي السقاف", id: "1039887766", phone: "773456333", poverty: "MEDIUM", dis: false, orphans: 1, housing: "شعبي" },
    { name: "مريم عبدالله باوزير", id: "1048776655", phone: "774567444", poverty: "SEVERE", dis: true, orphans: 2, housing: "متهالك", widow: true },
    { name: "خالد حسين الذاري", id: "1057665544", phone: "775678555", poverty: "MEDIUM", dis: false, orphans: 0, housing: "إيجار" },
    { name: "يحيى محسن الكبسي", id: "1066554433", phone: "776789666", poverty: "SEVERE", dis: true, orphans: 3, housing: "نزوح" },
    { name: "زينب أحمد الموتوري", id: "1075443322", phone: "777890777", poverty: "MEDIUM", dis: false, orphans: 2, housing: "إيجار", widow: true },
    { name: "عادل محمد الشامي", id: "1084332211", phone: "778901888", poverty: "LOW", dis: false, orphans: 0, housing: "ملكي" },
    { name: "نورة حسن العواضي", id: "1093221100", phone: "779012999", poverty: "SEVERE", dis: true, orphans: 5, housing: "خيمة", widow: true },
    { name: "هشام علي المقالح", id: "1102110099", phone: "770123000", poverty: "MEDIUM", dis: false, orphans: 1, housing: "إيجار" },
  ]

  const createdBeneficiaries: any[] = []

  for (let idx = 0; idx < familyHeads.length; idx++) {
    const f = familyHeads[idx]
    const subDist = subDistricts[idx % subDistricts.length]

    const uniqueNatId = `${f.id.slice(0, 6)}${Math.floor(1000 + Math.random() * 9000)}`
    const family = await prisma.family.create({
      data: {
        headFullName: f.name,
        headNationalId: uniqueNatId,
        headPhoneNumber: f.phone,
        povertyLevel: f.poverty as any,
        isDisplaced: f.dis,
        hasOrphans: f.orphans > 0,
        orphansCount: f.orphans,
        hasWidow: !!f.widow,
        housingType: f.housing,
        monthlyIncome: f.poverty === "SEVERE" ? 15000 : f.poverty === "MEDIUM" ? 40000 : 75000,
        familyMembersCount: f.orphans + 2,
        manualMembersCount: f.orphans + 2,
        subDistrictId: subDist.id,
        createdById: adminUser.id,
        isActive: true,
      },
    })

    // Create Head Beneficiary
    const headBen = await prisma.beneficiary.create({
      data: {
        fullName: f.name,
        gender: f.widow ? "FEMALE" : "MALE",
        birthdate: new Date(1980, 5, 15),
        nationalId: uniqueNatId,
        relationshipToHead: "رب الأسرة",
        category: "GENERAL",
        familyId: family.id,
        createdById: adminUser.id,
      },
    })
    createdBeneficiaries.push(headBen)

    // Create Orphan Beneficiaries
    for (let o = 1; o <= f.orphans; o++) {
      const orphanBen = await prisma.beneficiary.create({
        data: {
          fullName: `طفل يتيم ${o} — ابن ${f.name.split(" ")[0]}`,
          gender: o % 2 === 0 ? "FEMALE" : "MALE",
          birthdate: new Date(2014 + o, 2, 10),
          orphanCode: `ORPH-${family.id.slice(-4)}-0${o}`,
          relationshipToHead: o % 2 === 0 ? "ابنة" : "ابن",
          category: "ORPHAN",
          kuraimiAccountYemeni: `770${Math.floor(100000 + Math.random() * 900000)}`,
          familyId: family.id,
          createdById: adminUser.id,
        },
      })
      createdBeneficiaries.push(orphanBen)
    }
  }

  // 5. Create Sponsorships for Orphans
  console.log("🤝 Creating Sponsorships...")
  const orphanBens = createdBeneficiaries.filter(b => b.category === "ORPHAN")

  for (let i = 0; i < Math.min(orphanBens.length, 12); i++) {
    const orphan = orphanBens[i]
    const sponsor = createdSponsors[i % createdSponsors.length]

    await prisma.sponsorship.create({
      data: {
        sponsorId: sponsor.id,
        beneficiaryId: orphan.id,
        amount: 50,
        currency: "USD",
        paymentCycle: "MONTHLY",
        status: "ACTIVE",
        startDate: new Date(2025, 0, 1),
        sponsorshipMonths: 12,
        shareOrphanKWD: 15,
        totalAmountKWD: 15,
        orphanShare: 50,
        sponsorCountry: sponsor.country,
        createdById: adminUser.id,
      },
    })
  }

  // 6. Create Distribution Deliveries (ProjectBeneficiary)
  console.log("📦 Creating Aid Distribution Deliveries...")
  const allProjects = createdProjects

  for (let i = 0; i < createdBeneficiaries.length; i++) {
    const ben = createdBeneficiaries[i]
    const proj = allProjects[i % allProjects.length]

    await prisma.projectBeneficiary.create({
      data: {
        projectId: proj.id,
        beneficiaryId: ben.id,
        batchNumber: 1,
        deliveredItem: proj.category === "CASH" ? "مساعدة نقدية $50" : "سلة غذائية مكثفة 25 كجم",
        deliveryDate: new Date(Date.now() - (i * 2 * 24 * 60 * 60 * 1000)),
        quantity: 1,
        unitValue: 50,
        currency: "USD",
        isDelivered: true,
        deliveryNotes: "تم التسليم يداً ببد بموجب كشف التوقيع البصمي",
      },
    })
  }

  // 7. Create Patients
  console.log("🏥 Creating Patients...")
  const familyRecords = await prisma.family.findMany({ take: 5 })
  const diagnoses = [
    "فشل كليوي مزمن يحتاج غسيل أسبوعي",
    "ثلاسيميا وتكسر دم وراثي",
    "سرطان الثدي - جلسات كيماوي",
    "أمراض القلب والتاجية - عملية قسطرة",
    "إعاقة حركية شلل أطفال"
  ]

  for (let i = 0; i < familyRecords.length; i++) {
    const fam = familyRecords[i]
    await prisma.patient.create({
      data: {
        fullName: `مريض حالة ${i + 1} — أسرة ${fam.headFullName.split(" ")[0]}`,
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        nationalId: `10998877${i}0`,
        diagnosis: diagnoses[i % diagnoses.length],
        notes: "حالة حرجة تتطلب تدخلاً علاجياً عاجلاً",
        familyId: fam.id,
        subDistrictId: fam.subDistrictId,
        createdById: adminUser.id,
      },
    })
  }

  console.log("✅ Seed completed successfully! All demo data is populated!")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
