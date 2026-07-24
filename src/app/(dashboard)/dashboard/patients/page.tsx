export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Stethoscope, AlertTriangle, Activity, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PatientsClient } from "./patients-client"
import { PatientFormSheet } from "@/components/patients/patient-form-sheet"
import { getCurrentUser } from "@/app/actions/auth-actions"

// =============================================================================
// DATA FETCHING
// =============================================================================


async function getPatients() {
  return await prisma.patient.findMany({
    where: { deletedAt: null },
    include: {
      subDistrict: {
        include: {
          district: {
            include: { governorate: true },
          },
        },
      },
      family: {
        select: {
          id: true,
          headFullName: true,
          headNationalId: true,
        },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

async function getGeography() {
  return await prisma.governorate.findMany({
    include: {
      districts: {
        include: {
          subDistricts: {
            select: { id: true, nameAr: true },
            orderBy: { nameAr: "asc" },
          },
        },
        orderBy: { nameAr: "asc" },
      },
    },
    orderBy: { nameAr: "asc" },
  })
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function PatientsPage() {
  const currentUser = await getCurrentUser()
  const [patients, geography] = await Promise.all([getPatients(), getGeography()])

  const totalCount = patients.length
  const criticalCount = patients.filter(p => p.severity === "CRITICAL" || p.severity === "SERIOUS").length
  const activeCount = patients.filter(p => p.status === "ACTIVE").length
  const totalMonthlyCost = patients.reduce((acc, p) => acc + (p.monthlyCost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">إدارة المرضى</h2>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            متابعة ملفات المرضى المستفيدين، سجلاتهم الطبية، ومستوى الدعم المقدم لهم.
          </p>
        </div>
        <PatientFormSheet geography={geography} />
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5 dark:from-rose-950/40 dark:to-rose-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">إجمالي المرضى</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {totalCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400">
                <Stethoscope className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-rose-700/70 dark:text-rose-300/70 font-medium">
              إجمالي الملفات الطبية المسجلة
            </div>
          </CardContent>
        </Card>

        <Card className="border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-950/40 dark:to-red-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">حالات حرجة وخطيرة</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {criticalCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-red-500/10 p-2.5 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-red-700/70 dark:text-red-300/70 font-medium">
              تستلزم أولوية المتابعة والدعم العاجل
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-950/40 dark:to-blue-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">قيد العلاج حالياً</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  {activeCount.toLocaleString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700/70 dark:text-blue-300/70 font-medium">
              يتلقى دعماً طبياً نشطاً من المنظمة
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-950/40 dark:to-emerald-900/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">التكلفة الشهرية الإجمالية</p>
                <p className="mt-2 text-2xl font-bold text-[#1C355E] dark:text-white tabular-nums">
                  ${totalMonthlyCost.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-emerald-700/70 dark:text-emerald-300/70 font-medium">
              إجمالي تكاليف الدعم الطبي الشهرية
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Table */}
      <PatientsClient
        initialPatients={patients}
        geography={geography}
        currentUserRole={currentUser?.role}
      />
    </div>
  )
}
