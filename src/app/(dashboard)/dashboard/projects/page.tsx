export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Folder, CheckCircle, Target, Percent } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectsClient } from "./projects-client"
import { ProjectFormSheet } from "@/components/projects/project-form-sheet"
import { DistributionFormSheet } from "@/components/projects/distribution-form-sheet"

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getProjects() {
  return await prisma.project.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      beneficiaryLinks: {
        where: {
          deletedAt: null,
        },
        include: {
          beneficiary: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

async function getDistributions() {
  return await prisma.projectBeneficiary.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      project: true,
      beneficiary: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

async function getActiveBeneficiaries() {
  return await prisma.beneficiary.findMany({
    where: {
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

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function ProjectsPage() {
  const [projects, distributions, beneficiaries] = await Promise.all([
    getProjects(),
    getDistributions(),
    getActiveBeneficiaries(),
  ])

  // KPI Calculations
  const activeProjectsCount = projects.filter((p) => p.status === "ACTIVE").length
  
  const totalTarget = projects.reduce((acc, p) => acc + (p.targetCount || 0), 0)
  const deliveredCount = distributions.filter((d) => d.isDelivered).length
  
  const deliveryProgress = totalTarget > 0 ? Math.round((deliveredCount / totalTarget) * 100) : 0

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">إدارة المشاريع والتوزيعات</h2>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            تخطيط المشاريع التنموية والإغاثية للمنظمة وتسجيل وتوثيق التوزيعات وتسليم الحصص للمستفيدين.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ProjectFormSheet />
          <DistributionFormSheet projects={projects} beneficiaries={beneficiaries} />
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Projects */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">المشاريع النشطة</p>
                <p className="mt-2 text-2xl font-bold text-blue-900 tabular-nums">
                  {activeProjectsCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
                <Folder className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700/70 font-medium">
              المشاريع الجاري تنفيذها ميدانياً
            </div>
          </CardContent>
        </Card>

        {/* Total Target Beneficiaries */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-600">المستهدفون الإجمالي</p>
                <p className="mt-2 text-2xl font-bold text-amber-900 tabular-nums">
                  {totalTarget.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-amber-700/70 font-medium">
              إجمالي عدد المستهدفين في المشاريع
            </div>
          </CardContent>
        </Card>

        {/* Delivered Count */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-600">التسليمات الميدانية</p>
                <p className="mt-2 text-2xl font-bold text-emerald-900 tabular-nums">
                  {deliveredCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-emerald-700/70 font-medium">
              عمليات التوزيع المسلمة فعلياً للأفراد
            </div>
          </CardContent>
        </Card>

        {/* Total Progress */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-600">نسبة الإنجاز الإجمالية</p>
                <p className="mt-2 text-2xl font-bold text-purple-900 tabular-nums">
                  {deliveryProgress.toLocaleString("ar-SA-u-nu-latn")}%
                </p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-purple-700/70 font-medium">
              مؤشر تسليم المساعدات العام
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Interactive Unified Client Component ────────────────── */}
      <ProjectsClient
        initialProjects={projects}
        initialDistributions={distributions}
        activeBeneficiaries={beneficiaries}
      />
    </div>
  )
}
