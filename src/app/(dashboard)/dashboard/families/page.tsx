export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Users, ShieldAlert, Award, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { FamiliesClient } from "./families-client"
import { FamilyFormSheet } from "@/components/families/family-form-sheet"
import { getCurrentUser } from "@/app/actions/auth-actions"

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getFamilies() {
  return await prisma.family.findMany({
    where: {
      deletedAt: null,
    },
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
      members: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

async function getGeography() {
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

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function FamiliesPage() {
  const currentUser = await getCurrentUser()
  const [families, geography] = await Promise.all([
    getFamilies(),
    getGeography(),
  ])

  // Stats Calculations
  const totalCount = families.length
  const activeCount = families.filter((f) => f.isActive).length
  const severePovertyCount = families.filter((f) => f.povertyLevel === "SEVERE").length
  
  const totalVulnerability = families.reduce((acc, f) => acc + (f.vulnerabilityScore || 0), 0)
  const avgVulnerability = totalCount > 0 ? Math.round(totalVulnerability / totalCount) : 0

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">إدارة الأسر المستفيدة</h2>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            استعراض ملفات الأسر، والتقييمات الاجتماعية، والتوزيع الجغرافي، وإضافة وتعديل بيانات الأسر.
          </p>
        </div>
        <FamilyFormSheet geography={geography} userRole={currentUser?.role} />
      </div>

      {/* ── Stats Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Families */}
        <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-950/40 dark:to-blue-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">إجمالي الأسر</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {totalCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700/70 dark:text-blue-300/70 font-medium">
              العدد الإجمالي للملفات المسجلة
            </div>
          </CardContent>
        </Card>

        {/* Active Families */}
        <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-950/40 dark:to-emerald-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">الأسر النشطة</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {activeCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-emerald-700/70 dark:text-emerald-300/70 font-medium">
              تستقبل المساعدات والتوزيعات حالياً
            </div>
          </CardContent>
        </Card>

        {/* Severe Poverty */}
        <Card className="border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-950/40 dark:to-red-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">تحت خط الفقر الشديد</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {severePovertyCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-red-500/10 p-2.5 text-red-600 dark:text-red-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-red-700/70 dark:text-red-300/70 font-medium">
              الأسر الأكثر احتياجاً للمساعدات العاجلة
            </div>
          </CardContent>
        </Card>

        {/* Average Vulnerability Score */}
        <Card className="border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-950/40 dark:to-amber-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">متوسط الهشاشة</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {avgVulnerability.toLocaleString("ar-SA-u-nu-latn")}%
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-amber-700/70 dark:text-amber-300/70 font-medium">
              مؤشر الاحتياج الميداني العام
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Interactive Families Table & Filters ────────────────── */}
      <FamiliesClient initialFamilies={families} geography={geography} currentUserRole={currentUser?.role} />
    </div>
  )
}
