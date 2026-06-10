// =============================================================================
// NGO ERP System — Database Seed Script
// Run with: npm run db:seed  OR  npx prisma db seed
// =============================================================================

import {
  PrismaClient,
  Role,
  Gender,
  BeneficiaryCategory,
  ProjectCategory,
  ProjectStatus,
  Currency,
} from "@prisma/client";
import bcrypt from "bcryptjs";

// Use DIRECT_URL (Session pooler port 5432) for seeding
// Transaction pooler (6543) doesn't support all operations needed in seeds
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

// =============================================================================
// HELPERS
// =============================================================================

const log = {
  info: (msg: string) => console.log(`  ℹ️  ${msg}`),
  success: (msg: string) => console.log(`  ✅ ${msg}`),
  section: (msg: string) => console.log(`\n📦 ${msg}`),
};

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function main() {
  console.log("\n🌱 ===== بدء تشغيل Seed قاعدة البيانات =====\n");

  // ---------------------------------------------------------------------------
  // 1. ADMIN USER
  // Note: Password is hashed with bcrypt (cost=12).
  // In production, authentication will be handled via Supabase Auth.
  // This user record is for the system's internal role management.
  // ---------------------------------------------------------------------------
  log.section("إنشاء مستخدم المشرف (Admin User)");

  const hashedPassword = await bcrypt.hash("password123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ngo.com" },
    update: {},
    create: {
      email: "admin@ngo.com",
      name: "مشرف النظام",
      role: Role.ADMIN,
      isActive: true,
    },
  });
  log.success(`Admin User: ${adminUser.name} (${adminUser.email})`);
  log.info(`Hashed password (store separately): ${hashedPassword}`);

  // ---------------------------------------------------------------------------
  // 2. GEOGRAPHICAL DATA
  // Governorates → Districts → SubDistricts (hierarchical normalization)
  // ---------------------------------------------------------------------------
  log.section("إنشاء البيانات الجغرافية");

  // --- GOVERNORATE 1: تعز (Taiz) ---
  const taiz = await prisma.governorate.upsert({
    where: { nameAr: "تعز" },
    update: {},
    create: { nameAr: "تعز", nameEn: "Taiz" },
  });
  log.success(`محافظة: ${taiz.nameAr}`);

  // Districts of Taiz
  const alMudhaffar = await prisma.district.upsert({
    where: { nameAr_governorateId: { nameAr: "المظفر", governorateId: taiz.id } },
    update: {},
    create: { nameAr: "المظفر", nameEn: "Al Mudhaffar", governorateId: taiz.id },
  });

  const alQahirah = await prisma.district.upsert({
    where: { nameAr_governorateId: { nameAr: "القاهرة", governorateId: taiz.id } },
    update: {},
    create: { nameAr: "القاهرة", nameEn: "Al Qahirah", governorateId: taiz.id },
  });

  const salh = await prisma.district.upsert({
    where: { nameAr_governorateId: { nameAr: "صالة", governorateId: taiz.id } },
    update: {},
    create: { nameAr: "صالة", nameEn: "Salh", governorateId: taiz.id },
  });
  log.success(`مديريات تعز: ${alMudhaffar.nameAr}, ${alQahirah.nameAr}, ${salh.nameAr}`);

  // SubDistricts for Taiz districts (required for Family linking)
  const mudhaffarSub1 = await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "حي الحصب", districtId: alMudhaffar.id } },
    update: {},
    create: { nameAr: "حي الحصب", nameEn: "Al Hasab", districtId: alMudhaffar.id },
  });

  const mudhaffarSub2 = await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "حي جمال", districtId: alMudhaffar.id } },
    update: {},
    create: { nameAr: "حي جمال", nameEn: "Jamal", districtId: alMudhaffar.id },
  });

  const qahirahSub1 = await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "قلعة القاهرة", districtId: alQahirah.id } },
    update: {},
    create: { nameAr: "قلعة القاهرة", nameEn: "Al Qahirah Fort", districtId: alQahirah.id },
  });

  const salhSub1 = await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "مركز صالة", districtId: salh.id } },
    update: {},
    create: { nameAr: "مركز صالة", nameEn: "Salh Center", districtId: salh.id },
  });

  log.success(`أحياء فرعية لتعز: ${mudhaffarSub1.nameAr}, ${mudhaffarSub2.nameAr}, ${qahirahSub1.nameAr}, ${salhSub1.nameAr}`);

  // --- GOVERNORATE 2: إب (Ibb) ---
  const ibb = await prisma.governorate.upsert({
    where: { nameAr: "إب" },
    update: {},
    create: { nameAr: "إب", nameEn: "Ibb" },
  });
  log.success(`محافظة: ${ibb.nameAr}`);

  const arRadmah = await prisma.district.upsert({
    where: { nameAr_governorateId: { nameAr: "الرضمة", governorateId: ibb.id } },
    update: {},
    create: { nameAr: "الرضمة", nameEn: "Ar Radmah", governorateId: ibb.id },
  });

  const yarim = await prisma.district.upsert({
    where: { nameAr_governorateId: { nameAr: "يريم", governorateId: ibb.id } },
    update: {},
    create: { nameAr: "يريم", nameEn: "Yarim", governorateId: ibb.id },
  });
  log.success(`مديريات إب: ${arRadmah.nameAr}, ${yarim.nameAr}`);

  // SubDistricts for Ibb
  await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "مركز الرضمة", districtId: arRadmah.id } },
    update: {},
    create: { nameAr: "مركز الرضمة", nameEn: "Ar Radmah Center", districtId: arRadmah.id },
  });

  await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "مركز يريم", districtId: yarim.id } },
    update: {},
    create: { nameAr: "مركز يريم", nameEn: "Yarim Center", districtId: yarim.id },
  });

  // --- GOVERNORATE 3: صنعاء (Sanaa) ---
  const sanaa = await prisma.governorate.upsert({
    where: { nameAr: "صنعاء" },
    update: {},
    create: { nameAr: "صنعاء", nameEn: "Sanaa" },
  });
  log.success(`محافظة: ${sanaa.nameAr}`);

  const maain = await prisma.district.upsert({
    where: { nameAr_governorateId: { nameAr: "معين", governorateId: sanaa.id } },
    update: {},
    create: { nameAr: "معين", nameEn: "Ma'ain", governorateId: sanaa.id },
  });

  const alSabeen = await prisma.district.upsert({
    where: { nameAr_governorateId: { nameAr: "السبعين", governorateId: sanaa.id } },
    update: {},
    create: { nameAr: "السبعين", nameEn: "Al Sabeen", governorateId: sanaa.id },
  });
  log.success(`مديريات صنعاء: ${maain.nameAr}, ${alSabeen.nameAr}`);

  // SubDistricts for Sanaa
  await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "حي معين", districtId: maain.id } },
    update: {},
    create: { nameAr: "حي معين", nameEn: "Ma'ain District", districtId: maain.id },
  });

  await prisma.subDistrict.upsert({
    where: { nameAr_districtId: { nameAr: "حي السبعين", districtId: alSabeen.id } },
    update: {},
    create: { nameAr: "حي السبعين", nameEn: "Al Sabeen District", districtId: alSabeen.id },
  });

  // ---------------------------------------------------------------------------
  // 3. DUMMY FAMILY — أسرة محمد عبدالله
  // Linked to Al Mudhaffar district → حي الحصب sub-district in Taiz
  // ---------------------------------------------------------------------------
  log.section("إنشاء الأسرة التجريبية");

  const dummyFamily = await prisma.family.upsert({
    where: { headNationalId: "1234567890" },
    update: {},
    create: {
      headFullName: "محمد عبدالله أحمد السلمي",
      headNationalId: "1234567890",
      headGender: Gender.MALE,
      headPhoneNumber: "0771234567",
      headBirthdate: new Date("1975-03-15"),
      addressDetail: "شارع الجمهورية، بجانب المستشفى الجمهوري",
      subDistrictId: mudhaffarSub1.id,
      vulnerabilityScore: 75,
      notes: "أسرة في وضع هش — فقدت المعيل بسبب النزاع المسلح",
      isActive: true,
      createdById: adminUser.id,
    },
  });
  log.success(`الأسرة: ${dummyFamily.headFullName} (ID: ${dummyFamily.id})`);

  // ---------------------------------------------------------------------------
  // 4. DUMMY BENEFICIARIES
  // Beneficiary 1: Orphan (يتيم)
  // Beneficiary 2: Student (طالب)
  // ---------------------------------------------------------------------------
  log.section("إنشاء المستفيدين التجريبيين");

  const orphan = await prisma.beneficiary.upsert({
    where: {
      nationalId_familyId: {
        nationalId: "ORF-2015-001",
        familyId: dummyFamily.id,
      },
    },
    update: {},
    create: {
      fullName: "خالد محمد عبدالله السلمي",
      gender: Gender.MALE,
      birthdate: new Date("2015-06-10"),
      nationalId: "ORF-2015-001",
      category: BeneficiaryCategory.ORPHAN,
      fatherDeathDate: new Date("2021-02-14"),
      fatherDeathCause: "نزاع مسلح",
      isActive: true,
      notes: "يتيم — يحتاج لكفالة شهرية",
      familyId: dummyFamily.id,
    },
  });
  log.success(`مستفيد (يتيم): ${orphan.fullName}`);

  const student = await prisma.beneficiary.upsert({
    where: {
      nationalId_familyId: {
        nationalId: "STU-2012-002",
        familyId: dummyFamily.id,
      },
    },
    update: {},
    create: {
      fullName: "فاطمة محمد عبدالله السلمية",
      gender: Gender.FEMALE,
      birthdate: new Date("2012-09-22"),
      nationalId: "STU-2012-002",
      category: BeneficiaryCategory.STUDENT,
      educationLevel: "الصف الثامن الإعدادي",
      schoolName: "مدرسة النور للبنات",
      isActive: true,
      notes: "طالبة متفوقة — تحتاج دعماً في القرطاسية والمصاريف الدراسية",
      familyId: dummyFamily.id,
    },
  });
  log.success(`مستفيد (طالبة): ${student.fullName}`);

  // ---------------------------------------------------------------------------
  // 5. DUMMY PROJECT — كسوة العيد 2026
  // ---------------------------------------------------------------------------
  log.section("إنشاء المشروع التجريبي");

  const project = await prisma.project.upsert({
    where: { id: "seed-project-eid-2026" },
    update: {},
    create: {
      id: "seed-project-eid-2026",
      name: "كسوة العيد 2026",
      description:
        "توزيع كسوة العيد على الأسر الفقيرة والأيتام في محافظة تعز لموسم عيد الأضحى 2026",
      category: ProjectCategory.IN_KIND,
      status: ProjectStatus.ACTIVE,
      budget: 50000,
      currency: Currency.USD,
      targetCount: 500,
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-06-30"),
      createdById: adminUser.id,
    },
  });
  log.success(`المشروع: ${project.name} (الميزانية: ${project.budget} ${project.currency})`);

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("🎉 اكتمل الـ Seed بنجاح! ملخص البيانات المُدرجة:");
  console.log("=".repeat(60));

  // Sequential counts to avoid connection timeout after long seed
  const usersCount       = await prisma.user.count();
  const governoratesCount = await prisma.governorate.count();
  const districtsCount   = await prisma.district.count();
  const subDistrictsCount = await prisma.subDistrict.count();
  const familiesCount    = await prisma.family.count();
  const beneficiariesCount = await prisma.beneficiary.count();
  const projectsCount    = await prisma.project.count();

  console.log(`  👤 المستخدمون:          ${usersCount}`);
  console.log(`  🗺️  المحافظات:           ${governoratesCount}`);
  console.log(`  📍 المديريات:           ${districtsCount}`);
  console.log(`  🏘️  الأحياء الفرعية:     ${subDistrictsCount}`);
  console.log(`  🏠 الأسر:               ${familiesCount}`);
  console.log(`  👥 المستفيدون:          ${beneficiariesCount}`);
  console.log(`  📋 المشاريع:            ${projectsCount}`);
  console.log("=".repeat(60));
  console.log("\n  🔑 بيانات تسجيل الدخول:");
  console.log("     Email:    admin@ngo.com");
  console.log("     Password: password123");
  console.log("=".repeat(60) + "\n");
}

// =============================================================================
// ENTRY POINT
// =============================================================================

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("\n❌ خطأ في تشغيل الـ Seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
