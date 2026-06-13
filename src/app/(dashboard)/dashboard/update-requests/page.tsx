import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions/auth-actions"
import { redirect } from "next/navigation"
import { UpdateRequestsClient } from "@/components/update-requests/update-requests-client"
import { ClipboardEdit } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function UpdateRequestsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role === "MARKETER") redirect("/dashboard/marketer")

  const requests = await prisma.orphanUpdateRequest.findMany({
    include: {
      beneficiary: {
        select: {
          id: true, fullName: true, orphanCode: true,
          guardians: { where: { isPrimary: true }, take: 1 },
          siblings: {
            select: { id: true, fullName: true, qualification: true, socialStatus: true },
            orderBy: { siblingOrder: "asc" },
          },
          // البيانات الحالية للمقارنة
          educationLevel: true, educationalStage: true, schoolName: true, quranMemorization: true,
          healthStatus: true, birthGovernorate: true, birthDistrict: true,
          birthVillage: true, birthArea: true, housingStatus: true, kuraimiAccount: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },  // PENDING أولاً
      { createdAt: "desc" },
    ],
  })

  const pendingCount = requests.filter(r => r.status === "PENDING").length

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ClipboardEdit className="h-6 w-6 text-emerald-500" />
            طلبات تحديث البيانات
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount} جديد
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            مراجعة البيانات المُرسَلة من المعيلين والموافقة عليها أو رفضها
          </p>
        </div>
      </div>

      <UpdateRequestsClient requests={requests as any} reviewerId={user.id} />
    </div>
  )
}
