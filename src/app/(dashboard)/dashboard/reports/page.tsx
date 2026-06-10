import { prisma } from "@/lib/prisma"
import { ReportsClient } from "./reports-client"

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getBeneficiariesForReports() {
  return await prisma.beneficiary.findMany({
    include: {
      family: {
        include: {
          subDistrict: {
            include: {
              district: {
                include: {
                  governorate: true,
                },
              },
            },
          },
        },
      },
      sponsorships: {
        where: {
          status: "ACTIVE",
        },
        include: {
          sponsor: true,
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  })
}

async function getGeographyForReports() {
  return await prisma.governorate.findMany({
    include: {
      districts: {
        include: {
          subDistricts: {
            select: {
              id: true,
              nameAr: true,
            },
            orderBy: {
              nameAr: "asc",
            },
          },
        },
        orderBy: {
          nameAr: "asc",
        },
      },
    },
    orderBy: {
      nameAr: "asc",
    },
  })
}

async function getSponsorsForReports() {
  return await prisma.sponsor.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: {
      fullName: "asc",
    },
  })
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function ReportsPage() {
  const [beneficiaries, geography, sponsors] = await Promise.all([
    getBeneficiariesForReports(),
    getGeographyForReports(),
    getSponsorsForReports(),
  ])

  return (
    <div className="space-y-6">
      {/* ── Page Header (Hidden on Print) ── */}
      <div className="print:hidden">
        <h2 className="text-xl font-bold text-white md:text-2xl">توليد التقارير والإحصائيات</h2>
        <p className="mt-1 text-sm text-slate-400 font-medium">
          قم بتصفية قاعدة بيانات المستفيدين بناءً على الموقع الجغرافي، تصنيفات الهشاشة، مستويات الفقر، حالة الكفالة، أو المراحل التعليمية مع إمكانية التصدير أو الطباعة كملف PDF.
        </p>
      </div>

      {/* ── Reports Engine Client ── */}
      <ReportsClient
        initialBeneficiaries={beneficiaries}
        geography={geography}
        sponsors={sponsors}
      />
    </div>
  )
}
