export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { HeartHandshake, Users, DollarSign, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SponsorsClient } from "./sponsors-client"
import { SponsorFormSheet } from "@/components/sponsors/sponsor-form-sheet"
import { SponsorshipFormSheet } from "@/components/sponsors/sponsorship-form-sheet"

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getSponsors() {
  return await prisma.sponsor.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      sponsorships: {
        where: {
          deletedAt: null,
        },
        include: {
          beneficiary: true,
          family: true,
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  })
}

async function getSponsorships() {
  return await prisma.sponsorship.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      sponsor: true,
      beneficiary: true,
      family: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

async function getActiveOrphans() {
  return await prisma.beneficiary.findMany({
    where: {
      category: "ORPHAN",
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: {
      fullName: "asc",
    },
  })
}

async function getActiveFamilies() {
  return await prisma.family.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      headFullName: true,
    },
    orderBy: {
      headFullName: "asc",
    },
  })
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function SponsorsPage() {
  const [sponsors, sponsorships, orphans, families] = await Promise.all([
    getSponsors(),
    getSponsorships(),
    getActiveOrphans(),
    getActiveFamilies(),
  ])

  // KPI Calculations
  const totalSponsors = sponsors.length
  const activeSponsorships = sponsorships.filter((s) => s.status === "ACTIVE")
  const activeSponsorshipsCount = activeSponsorships.length

  // Calculate Monthly Equivalent Commitment by Currency
  const monthlySums = activeSponsorships.reduce((acc, s) => {
    let monthlyVal = Number(s.amount)
    if (s.paymentCycle === "QUARTERLY") monthlyVal = Number(s.amount) / 3
    else if (s.paymentCycle === "SEMI_ANNUAL") monthlyVal = Number(s.amount) / 6
    else if (s.paymentCycle === "ANNUAL") monthlyVal = Number(s.amount) / 12
    else if (s.paymentCycle === "ONE_TIME") monthlyVal = 0 // Ignore one-time payments for recurring calculations

    acc[s.currency] = (acc[s.currency] || 0) + monthlyVal
    return acc
  }, {} as Record<string, number>)

  const usdMonthly = Math.round(monthlySums["USD"] || 0)
  const sarMonthly = Math.round(monthlySums["SAR"] || 0)
  const yerMonthly = Math.round(monthlySums["YER"] || 0)

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">إدارة الكفلاء والكفالات</h2>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            تسجيل الكفلاء ومتابعة التزاماتهم المالية، وربط الكفالات الفردية بالأيتام أو الكفالات المعيشية بالأسر.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <SponsorFormSheet />
          <SponsorshipFormSheet sponsors={sponsors} orphans={orphans} families={families} />
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sponsors */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">إجمالي الكفلاء</p>
                <p className="mt-2 text-2xl font-bold text-blue-900 tabular-nums">
                  {totalSponsors.toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700/70 font-medium">
              الداعمون المسجلون بالنظام
            </div>
          </CardContent>
        </Card>

        {/* Active Sponsorships */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-600">الكفالات الفعّالة</p>
                <p className="mt-2 text-2xl font-bold text-emerald-900 tabular-nums">
                  {activeSponsorshipsCount.toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
                <HeartHandshake className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-emerald-700/70 font-medium">
              كفالات مستمرة للأيتام والأسر
            </div>
          </CardContent>
        </Card>

        {/* USD Monthly Sum */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-rose-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-600">التزامات الدولار (USD)</p>
                <p className="mt-2 text-2xl font-bold text-rose-900 tabular-nums">
                  ${usdMonthly.toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-rose-700/70 font-medium">
              مجموع الاستحقاقات الشهرية بالدولار
            </div>
          </CardContent>
        </Card>

        {/* SAR & YER Monthly Sums */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-600">الريال السعودي واليمني</p>
                <div className="mt-2 text-sm font-bold text-amber-900 flex flex-col gap-0.5 leading-none">
                  <span>{sarMonthly.toLocaleString("ar-SA")} ر.س</span>
                  <span className="text-[10px] text-amber-600 font-semibold">{yerMonthly.toLocaleString("ar-SA")} ر.ي</span>
                </div>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-amber-700/70 font-medium">
              الالتزامات الشهرية بالعملات الإقليمية
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Interactive Unified Client Component ────────────────── */}
      <SponsorsClient
        initialSponsors={sponsors}
        initialSponsorships={sponsorships}
        activeOrphans={orphans}
        activeFamilies={families}
      />
    </div>
  )
}
