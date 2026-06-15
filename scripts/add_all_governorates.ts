import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const govs = [
  { nameAr: "أمانة العاصمة", nameEn: "Amanat Al-Asimah" },
  { nameAr: "صنعاء", nameEn: "Sanaa" },
  { nameAr: "عدن", nameEn: "Aden" },
  { nameAr: "تعز", nameEn: "Taiz" },
  { nameAr: "الحديدة", nameEn: "Al Hudaydah" },
  { nameAr: "حضرموت", nameEn: "Hadhramaut" },
  { nameAr: "إب", nameEn: "Ibb" },
  { nameAr: "ذمار", nameEn: "Dhamar" },
  { nameAr: "عمران", nameEn: "Amran" },
  { nameAr: "حجة", nameEn: "Hajjah" },
  { nameAr: "صعدة", nameEn: "Sa'dah" },
  { nameAr: "البيضاء", nameEn: "Al Bayda" },
  { nameAr: "أبين", nameEn: "Abyan" },
  { nameAr: "شبوة", nameEn: "Shabwah" },
  { nameAr: "لحج", nameEn: "Lahij" },
  { nameAr: "الضالع", nameEn: "Al Dhale'e" },
  { nameAr: "مأرب", nameEn: "Marib" },
  { nameAr: "الجوف", nameEn: "Al Jawf" },
  { nameAr: "المحويت", nameEn: "Al Mahwit" },
  { nameAr: "ريمة", nameEn: "Raymah" },
  { nameAr: "المهرة", nameEn: "Al Mahrah" },
  { nameAr: "سقطرى", nameEn: "Socotra" }
]

async function main() {
  console.log("⏳ البدء في إضافة المحافظات...")
  
  for (const gov of govs) {
    const res = await prisma.governorate.upsert({
      where: { nameAr: gov.nameAr },
      update: { nameEn: gov.nameEn },
      create: { nameAr: gov.nameAr, nameEn: gov.nameEn }
    })
    console.log(`✅ تم الحفظ: ${res.nameAr} (${res.nameEn})`)
  }

  console.log("🎉 تم الانتهاء من إضافة جميع المحافظات الـ 22 بنجاح!")
}

main()
  .catch((e) => {
    console.error("❌ حدث خطأ أثناء إضافة المحافظات:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
