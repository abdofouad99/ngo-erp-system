import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions/auth-actions"
import { redirect } from "next/navigation"
import { AddOrphanSheet } from "@/components/orphans/add-orphan-sheet"
import { OrphanDetailsSheet } from "@/components/orphans/orphan-details-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Baby,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Clock,
  LogOut,
  Eye,
  Settings,
  Pencil
} from "lucide-react"
import Link from "next/link"
import { logoutAction } from "@/app/actions/auth-actions"

// Revalidate on load
export const dynamic = "force-dynamic"

export default async function MarketerDashboard() {
  const user = await getCurrentUser()

  // Guard: Must be logged in and must be a MARKETER
  if (!user) {
    redirect("/login")
  }

  if (user.role !== "MARKETER") {
    redirect("/dashboard")
  }

  // Fetch all families for the AddOrphanSheet
  const families = await prisma.family.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, headFullName: true },
    orderBy: { headFullName: "asc" }
  })

  // Fetch orphans created by this marketer
  const myOrphans = await prisma.beneficiary.findMany({
    where: {
      createdById: user.id,
      category: "ORPHAN",
      deletedAt: null
    },
    include: {
      family: true,
      guardians: { orderBy: { isPrimary: "desc" } },
      siblings: { orderBy: { siblingOrder: "asc" } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Stats
  const totalCount = myOrphans.length
  const approvedCount = myOrphans.filter(o => o.verificationStatus === "APPROVED").length
  const pendingCount = myOrphans.filter(o => o.verificationStatus === "PENDING").length
  const rejectedCount = myOrphans.filter(o => o.verificationStatus === "REJECTED").length

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-500" />
            بوابة المسوق الميداني: {user.name}
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            مرحباً بك. يمكنك تسجيل أيتام جدد وتتبع طلبات القبول الخاصة بك.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddOrphanSheet families={families} createdById={user.id} isMarketer />
          
          <form action={async () => {
            "use server"
            await logoutAction()
          }}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-4 text-xs font-bold border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 gap-1.5 transition-all duration-300 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              <span>خروج</span>
            </Button>
          </form>
        </div>
      </div>

      {/* ── Stats Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Total Submitted */}
        <Card className="glass-card border-slate-800 shadow-[0_0_20px_rgba(255,255,255,0.01)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-450">إجمالي طلباتي</p>
              <p className="mt-2 text-xl font-extrabold text-white tabular-nums">{totalCount}</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-2.5 text-slate-300">
              <Baby className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Card className="glass-card border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.02)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-400">قيد المراجعة</p>
              <p className="mt-2 text-xl font-extrabold text-amber-300 tabular-nums">{pendingCount}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="glass-card border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.02)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-400">المقبولة والمعتمدة</p>
              <p className="mt-2 text-xl font-extrabold text-emerald-300 tabular-nums">{approvedCount}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Rejected / Correction needed */}
        <Card className="glass-card border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.02)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-400">مرفوضة (بحاجة لتعديل)</p>
              <p className="mt-2 text-xl font-extrabold text-rose-300 tabular-nums">{rejectedCount}</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Table of Submitted Orphans ───────────────────────────── */}
      <Card className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-extrabold text-white">جدول تتبع الطلبات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/20">
                <th className="py-3 px-4">كود الطلب</th>
                <th className="py-3 px-4">اسم اليتيم</th>
                <th className="py-3 px-4">اسم رب الأسرة</th>
                <th className="py-3 px-4">الجنس</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">ملاحظة التدقيق والرفض</th>
                <th className="py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {myOrphans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-550 font-bold">
                    لم تقم بتسجيل أي أيتام بعد. اضغط على "إضافة يتيم جديد" للبدء.
                  </td>
                </tr>
              ) : (
                myOrphans.map((orphan) => (
                  <tr key={orphan.id} className="hover:bg-slate-850/10 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {orphan.orphanCode || `REQ-${orphan.id.substring(0, 6).toUpperCase()}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{orphan.fullName}</td>
                    <td className="py-3 px-4 text-slate-300">{orphan.family.headFullName}</td>
                    <td className="py-3 px-4">
                      {orphan.gender === "MALE" ? (
                        <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10">ذكر</Badge>
                      ) : (
                        <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10">أنثى</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {orphan.verificationStatus === "APPROVED" && (
                        <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 hover:bg-emerald-500/10">معتمد ومقبول</Badge>
                      )}
                      {orphan.verificationStatus === "PENDING" && (
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/10">قيد المراجعة</Badge>
                      )}
                      {orphan.verificationStatus === "REJECTED" && (
                        <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/10">مرفوض ومُرجع</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {orphan.verificationStatus === "REJECTED" && orphan.rejectionReason ? (
                        <span className="text-red-450 font-bold flex items-center gap-1.5 bg-red-950/20 p-2 rounded-lg border border-red-900/30 text-[11px] max-w-sm">
                          <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                          <span>{orphan.rejectionReason}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    {/* عمود الإجراءات */}
                    <td className="py-3 px-4">
                      {orphan.verificationStatus === "REJECTED" && (
                        <AddOrphanSheet
                          isMarketer
                          orphan={orphan}
                          createdById={user.id}
                          families={families}
                          trigger={
                            <button className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 hover:border-amber-500 transition-all duration-200 active:scale-[0.97]">
                              <Pencil className="h-3 w-3" />
                              تعديل وإعادة إرسال
                            </button>
                          }
                        />
                      )}
                      {orphan.verificationStatus !== "REJECTED" && (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
