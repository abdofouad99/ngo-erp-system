import { PrismaClient, PaymentCycle, Role } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log("⚡ جاري توثيق الكفالات المباشرة في جدول Sponsorships بنظام الربط السريع...")

  let admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } })
  if (!admin) {
    admin = await prisma.user.create({
      data: { email: "admin@ngo.com", name: "مشرف النظام", role: Role.ADMIN, isActive: true }
    })
  }

  const zakatSponsor = await prisma.sponsor.findFirst({ where: { fullName: { contains: "بيت الزكاة" } } })
  const tanmiyaSponsor = await prisma.sponsor.findFirst({ where: { fullName: { contains: "تنمية" } } })
  const safaSponsor = await prisma.sponsor.findFirst({ where: { fullName: { contains: "الصفا" } } })
  const najahSponsor = await prisma.sponsor.findFirst({ where: { fullName: { contains: "النجاة" } } })

  const beneficiaries = await prisma.beneficiary.findMany({
    select: { id: true, notes: true, orphanCode: true }
  })

  // Get existing sponsorships beneficiary ids
  const existingSponsorships = await prisma.sponsorship.findMany({
    select: { beneficiaryId: true }
  })
  const existingBeneficiaryIds = new Set(existingSponsorships.map(s => s.beneficiaryId))

  const sponsorshipsToInsert: any[] = []

  for (const b of beneficiaries) {
    if (existingBeneficiaryIds.has(b.id)) continue

    const notes = b.notes || ""
    const code = b.orphanCode || ""
    
    let targetSponsorId = zakatSponsor?.id

    if (notes.includes("النجاة") || code.includes("NAJAH")) {
      targetSponsorId = najahSponsor?.id
    } else if (notes.includes("الصفا") || code.includes("SAFA")) {
      targetSponsorId = safaSponsor?.id
    } else if (notes.includes("تنمية") || code.includes("TANMIYA")) {
      targetSponsorId = tanmiyaSponsor?.id
    }

    if (targetSponsorId) {
      sponsorshipsToInsert.push({
        beneficiaryId: b.id,
        sponsorId: targetSponsorId,
        createdById: admin.id,
        amount: 100,
        currency: "SAR",
        paymentCycle: PaymentCycle.MONTHLY,
        startDate: new Date("2025-01-01"),
        status: "ACTIVE",
        notes: "كفالة رسمية موثقة",
      })
    }
  }

  if (sponsorshipsToInsert.length > 0) {
    await prisma.sponsorship.createMany({
      data: sponsorshipsToInsert,
      skipDuplicates: true,
    })
  }

  const finalSponsorships = await prisma.sponsorship.count()
  console.log(`🎉 تم توثيق وإنشاء ${sponsorshipsToInsert.length} عقد كفالة رسمية. إجمالي الكفالات الموثقة الآن: ${finalSponsorships}`)
}

main().finally(() => prisma.$disconnect())
