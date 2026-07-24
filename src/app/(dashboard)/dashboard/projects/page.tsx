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
        <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-950/40 dark:to-blue-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">المشاريع النشطة</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {activeProjectsCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
                <Folder className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700/70 dark:text-blue-300/70 font-medium">
              المشاريع الجاري تنفيذها ميدانياً
            </div>
          </CardContent>
        </Card>

        {/* Total Target Beneficiaries */}
        <Card className="border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-950/40 dark:to-amber-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">المستهدفون الإجمالي</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {totalTarget.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-amber-700/70 dark:text-amber-300/70 font-medium">
              إجمالي عدد المستهدفين في المشاريع
            </div>
          </CardContent>
        </Card>

        {/* Delivered Count */}
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
