import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log("⚡ جاري توثيق وإضافة المشاريع الخمسة في صفحة المشاريع والتوزيعات...")

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    console.error("❌ لم يتم العثور على حساب مدير للنظام")
    return
  }

  // 1. Project 1: مشروع كفالة الأسر المتعففة - ناصر الدبوس (جمعية تنمية الخيرية)
  await prisma.project.upsert({
    where: { id: "proj-tanmiya-dabbous-2025" },
    update: {
      name: "مشروع كفالة الأسر المتعففة 2025 - ناصر الدبوس (تنمية)",
      description: "مشروع كفالة الأسر المتعففة بتمويل جمعية تنمية الخيرية - الكويت (متبرع: ناصر الدبوس)",
      category: "CASH",
      currency: "KWD",
      budget: 25000,
      status: "ACTIVE",
    },
    create: {
      id: "proj-tanmiya-dabbous-2025",
      name: "مشروع كفالة الأسر المتعففة 2025 - ناصر الدبوس (تنمية)",
      description: "مشروع كفالة الأسر المتعففة بتمويل جمعية تنمية الخيرية - الكويت (متبرع: ناصر الدبوس)",
      category: "CASH",
      currency: "KWD",
      budget: 25000,
      status: "ACTIVE",
      createdById: admin.id,
    }
  })

  // 2. Project 2: مشروع كفالات أيتام اليمن 2026 - بيت الزكاة الكويتي
  await prisma.project.upsert({
    where: { id: "proj-zakat-house-2026" },
    update: {
      name: "مشروع كفالة الأيتام 2026 - بيت الزكاة الكويتي",
      description: "مشروع كفالة رعاية وتأهيل الأيتام بتمويل بيت الزكاة الكويتي (770 كفالة)",
      category: "CASH",
      currency: "KWD",
      budget: 150000,
      status: "ACTIVE",
    },
    create: {
      id: "proj-zakat-house-2026",
      name: "مشروع كفالة الأيتام 2026 - بيت الزكاة الكويتي",
      description: "مشروع كفالة رعاية وتأهيل الأيتام بتمويل بيت الزكاة الكويتي (770 كفالة)",
      category: "CASH",
      currency: "KWD",
      budget: 150000,
      status: "ACTIVE",
      createdById: admin.id,
    }
  })

  // 3. Project 3: مشروع برنامج القرآن الكريم والدعاة - جمعية الصفا الخيرية
  await prisma.project.upsert({
    where: { id: "proj-safa-quran-2026" },
    update: {
      name: "مشروع برنامج القرآن الكريم والدعاة - جمعية الصفا الخيرية",
      description: "مشروع رعاية وتكريم حُفّاظ القرآن الكريم والمحفظين والدعاة بتمويل جمعية الصفا الإنسانية (105 مستفيد)",
      category: "OTHER",
      currency: "USD",
      budget: 35000,
      status: "ACTIVE",
    },
    create: {
      id: "proj-safa-quran-2026",
      name: "مشروع برنامج القرآن الكريم والدعاة - جمعية الصفا الخيرية",
      description: "مشروع رعاية وتكريم حُفّاظ القرآن الكريم والمحفظين والدعاة بتمويل جمعية الصفا الإنسانية (105 مستفيد)",
      category: "OTHER",
      currency: "USD",
      budget: 35000,
      status: "ACTIVE",
      createdById: admin.id,
    }
  })

  // 4. Project 4: مشروع كفالة الأيتام - جمعية النجاة الخيرية
  await prisma.project.upsert({
    where: { id: "proj-najah-orphans-2025" },
    update: {
      name: "مشروع كفالة الأيتام المحدثة - جمعية النجاة الخيرية",
      description: "مشروع كفالة ورعاية الأيتام بتمويل جمعية النجاة الخيرية - الكويت (228 يتيم)",
      category: "CASH",
      currency: "KWD",
      budget: 68000,
      status: "ACTIVE",
    },
    create: {
      id: "proj-najah-orphans-2025",
      name: "مشروع كفالة الأيتام المحدثة - جمعية النجاة الخيرية",
      description: "مشروع كفالة ورعاية الأيتام بتمويل جمعية النجاة الخيرية - الكويت (228 يتيم)",
      category: "CASH",
      currency: "KWD",
      budget: 68000,
      status: "ACTIVE",
      createdById: admin.id,
    }
  })

  // 5. Project 5: مشروع كفالة الأسر المتعففة - مؤسسة الحياة الخيرية
  await prisma.project.upsert({
    where: { id: "proj-alhayah-families-2026" },
    update: {
      name: "مشروع كفالة الأسر المتعففة - مؤسسة الحياة الخيرية",
      description: "مشروع الدعم والرعاية الاجتماعية للأسر المتعففة بتمويل مؤسسة الحياة الخيرية - تعز",
      category: "IN_KIND",
      currency: "YER",
      budget: 1500000,
      status: "ACTIVE",
    },
    create: {
      id: "proj-alhayah-families-2026",
      name: "مشروع كفالة الأسر المتعففة - مؤسسة الحياة الخيرية",
      description: "مشروع الدعم والرعاية الاجتماعية للأسر المتعففة بتمويل مؤسسة الحياة الخيرية - تعز",
      category: "IN_KIND",
      currency: "YER",
      budget: 1500000,
      status: "ACTIVE",
      createdById: admin.id,
    }
  })

  console.log("🎉 تم توثيق وإنشاء المشاريع الخمسة بنجاح!")
  
  const totalProjects = await prisma.project.count()
  console.log(`إجمالي المشاريع في قاعدة البيانات الآن: ${totalProjects}`)
}

main().finally(() => prisma.$disconnect())
