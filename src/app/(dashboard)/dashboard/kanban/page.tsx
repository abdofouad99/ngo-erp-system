"use client"

import { useState, useEffect } from "react"
import { getKanbanData, updateOrphanVerificationStatus } from "@/app/actions/kanban-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  User,
  Search,
  MapPin,
  HeartPulse,
  GraduationCap,
  Calendar,
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from "lucide-react"

export default function KanbanPage() {
  const [orphans, setOrphans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const result = await getKanbanData()
    if (result.success) {
      setOrphans(result.orphans || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStatusChange = async (id: string, newStatus: "PENDING" | "APPROVED" | "REJECTED") => {
    setUpdatingId(id)
    const result = await updateOrphanVerificationStatus(id, newStatus)
    if (result.success) {
      await fetchData()
    } else {
      alert("حدث خطأ أثناء تحديث حالة اليتيم")
    }
    setUpdatingId(null)
  }

  // Filter orphans by search query
  const filteredOrphans = orphans.filter((o) =>
    o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.orphanCode && o.orphanCode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Categorize orphans into Kanban columns
  const getColumns = () => {
    const pending: any[] = []
    const approvedWaiting: any[] = []
    const sponsoredActive: any[] = []
    const rejected: any[] = []

    filteredOrphans.forEach((o) => {
      // If has active sponsorships, put in sponsored
      if (o.sponsorships && o.sponsorships.length > 0) {
        sponsoredActive.push(o)
      } else if (o.verificationStatus === "PENDING") {
        pending.push(o)
      } else if (o.verificationStatus === "APPROVED") {
        approvedWaiting.push(o)
      } else if (o.verificationStatus === "REJECTED") {
        rejected.push(o)
      }
    })

    return { pending, approvedWaiting, sponsoredActive, rejected }
  }

  const columns = getColumns()

  const getAge = (birthdate: string) => {
    if (!birthdate) return "-"
    const diff = Date.now() - new Date(birthdate).getTime()
    const ageDate = new Date(diff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-emerald-500" />
            خط الإنتاج ومراحل كفالة الأيتام (Kanban Pipeline)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تابع وحدث حالة الأيتام من مرحلة التقييم والتحقق إلى مرحلة الكفالة النشطة بمرونة تامة.
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          variant="outline"
          className="border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-850/60 h-9 text-xs gap-1.5 self-start md:self-auto rounded-lg font-bold transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-500" : ""}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-xl p-3 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-450 block">قيد التحقق والمراجعة</span>
            <span className="text-lg font-extrabold text-white mt-0.5">{columns.pending.length}</span>
          </div>
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700/50 hover:bg-slate-800 font-extrabold">مراجعة</Badge>
        </div>

        <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-3 flex justify-between items-center shadow-sm backdrop-blur-md">
          <div>
            <span className="text-[10px] font-bold text-amber-400 block">معتمد بانتظار الكفالة</span>
            <span className="text-lg font-extrabold text-amber-300 mt-0.5">{columns.approvedWaiting.length}</span>
          </div>
          <Badge className="bg-amber-950/40 text-amber-400 border border-amber-900/50 hover:bg-amber-950/40 font-extrabold">انتظار</Badge>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-3 flex justify-between items-center shadow-sm backdrop-blur-md">
          <div>
            <span className="text-[10px] font-bold text-emerald-450 block">مكفول نشط</span>
            <span className="text-lg font-extrabold text-emerald-300 mt-0.5">{columns.sponsoredActive.length}</span>
          </div>
          <Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-950/40 font-extrabold">مكفول</Badge>
        </div>

        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-3 flex justify-between items-center shadow-sm backdrop-blur-md">
          <div>
            <span className="text-[10px] font-bold text-red-400 block">مرفوض / معلق</span>
            <span className="text-lg font-extrabold text-red-300 mt-0.5">{columns.rejected.length}</span>
          </div>
          <Badge className="bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-950/40 font-extrabold">معلق</Badge>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="ابحث عن يتيم بالاسم أو كود الملف للفرز السريع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 text-xs pr-9 rounded-xl bg-slate-900/60 border-slate-800/80 text-white placeholder-slate-500 focus-visible:ring-emerald-500 focus-visible:bg-slate-900/90 focus-visible:border-slate-700 transition-all shadow-sm"
        />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Kanban Board Layout */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-450 gap-2">
          <RefreshCw className="h-7 w-7 animate-spin text-emerald-500" />
          <span className="text-xs font-semibold">جاري تحميل لوحة الكانبان...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          
          {/* COLUMN 1: Pending */}
          <div className="bg-slate-900/25 border border-slate-850 rounded-2xl p-4 space-y-4 shadow-sm min-h-[500px] backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <h3 className="text-xs font-extrabold text-white">قيد التحقق والمراجعة</h3>
              </div>
              <Badge className="bg-slate-800 text-slate-350 border border-slate-700/50 font-extrabold text-[10px]">{columns.pending.length}</Badge>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {columns.pending.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">لا توجد حالات هنا.</div>
              ) : (
                columns.pending.map((orphan) => (
                  <OrphanKanbanCard
                    key={orphan.id}
                    orphan={orphan}
                    getAge={getAge}
                    onStatusChange={handleStatusChange}
                    updatingId={updatingId}
                    currentCol="PENDING"
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: Approved / Waiting */}
          <div className="bg-amber-950/5 border border-amber-900/30 rounded-2xl p-4 space-y-4 shadow-sm min-h-[500px] backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <h3 className="text-xs font-extrabold text-amber-400">معتمد بانتظار كفيل</h3>
              </div>
              <Badge className="bg-amber-950/40 text-amber-400 border border-amber-900/50 font-extrabold text-[10px]">{columns.approvedWaiting.length}</Badge>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {columns.approvedWaiting.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">لا توجد حالات هنا.</div>
              ) : (
                columns.approvedWaiting.map((orphan) => (
                  <OrphanKanbanCard
                    key={orphan.id}
                    orphan={orphan}
                    getAge={getAge}
                    onStatusChange={handleStatusChange}
                    updatingId={updatingId}
                    currentCol="APPROVED"
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: Active Sponsored */}
          <div className="bg-emerald-950/5 border border-emerald-900/30 rounded-2xl p-4 space-y-4 shadow-sm min-h-[500px] backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-extrabold text-emerald-450">مكفول نشط</h3>
              </div>
              <Badge className="bg-emerald-950/40 text-emerald-450 border border-emerald-900/50 font-extrabold text-[10px]">{columns.sponsoredActive.length}</Badge>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {columns.sponsoredActive.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">لا توجد حالات هنا.</div>
              ) : (
                columns.sponsoredActive.map((orphan) => (
                  <OrphanKanbanCard
                    key={orphan.id}
                    orphan={orphan}
                    getAge={getAge}
                    onStatusChange={handleStatusChange}
                    updatingId={updatingId}
                    currentCol="ACTIVE_SPONSORSHIP"
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 4: Rejected / Suspended */}
          <div className="bg-red-950/5 border border-red-900/30 rounded-2xl p-4 space-y-4 shadow-sm min-h-[500px] backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <h3 className="text-xs font-extrabold text-red-400">مرفوض / معلق</h3>
              </div>
              <Badge className="bg-red-950/40 text-red-400 border border-red-900/50 font-extrabold text-[10px]">{columns.rejected.length}</Badge>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {columns.rejected.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">لا توجد حالات هنا.</div>
              ) : (
                columns.rejected.map((orphan) => (
                  <OrphanKanbanCard
                    key={orphan.id}
                    orphan={orphan}
                    getAge={getAge}
                    onStatusChange={handleStatusChange}
                    updatingId={updatingId}
                    currentCol="REJECTED"
                  />
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

interface OrphanCardProps {
  orphan: any
  getAge: (d: string) => number | string
  onStatusChange: (id: string, s: "PENDING" | "APPROVED" | "REJECTED") => void
  updatingId: string | null
  currentCol: string
}

function OrphanKanbanCard({ orphan, getAge, onStatusChange, updatingId, currentCol }: OrphanCardProps) {
  const isUpdating = updatingId === orphan.id

  return (
    <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-700 transition-all rounded-xl overflow-hidden relative hover:scale-[1.02] duration-300">
      {isUpdating && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10 rounded-xl">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-500" />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        {/* Title and Code */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="space-y-0.5 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 block font-mono">
              {orphan.orphanCode || "بلا كود"}
            </span>
            <h4 className="text-xs font-bold text-white leading-tight">{orphan.fullName}</h4>
          </div>
          <Badge className="bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-800/60 text-[9px] font-bold py-0 px-1.5 h-5 rounded-md flex items-center gap-0.5">
            <Calendar className="h-3 w-3 text-slate-450" />
            {getAge(orphan.birthdate)} سنة
          </Badge>
        </div>

        {/* Family and Location */}
        <div className="text-[10px] text-slate-400 font-semibold space-y-1">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-slate-500" />
            <span className="truncate">الأسرة: {orphan.family?.headFullName}</span>
          </div>
          {orphan.family?.addressDetail && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-500 animate-pulse" />
              <span className="truncate">{orphan.family.addressDetail}</span>
            </div>
          )}
        </div>

        {/* Health / Education Quick Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {orphan.healthStatus && (
            <Badge className="bg-rose-950/40 text-rose-400 border border-rose-900/50 hover:bg-rose-950/40 text-[9px] font-bold py-0 px-1 h-5 rounded flex items-center gap-0.5">
              <HeartPulse className="h-2.5 w-2.5" />
              <span className="max-w-[70px] truncate">{orphan.healthStatus}</span>
            </Badge>
          )}
          {orphan.educationalStage && (
            <Badge className="bg-blue-950/40 text-blue-400 border border-blue-900/50 hover:bg-blue-950/40 text-[9px] font-bold py-0 px-1 h-5 rounded flex items-center gap-0.5">
              <GraduationCap className="h-2.5 w-2.5" />
              <span className="max-w-[70px] truncate">{orphan.educationalStage}</span>
            </Badge>
          )}
        </div>

        {/* Column Actions (Pipeline Transitions) */}
        {currentCol !== "ACTIVE_SPONSORSHIP" && (
          <div className="border-t border-slate-800/60 pt-2.5 mt-2">
            <label className="text-[9px] font-bold text-slate-450 block mb-1">نقل الحالة إلى:</label>
            <div className="flex gap-1.5">
              {currentCol !== "PENDING" && (
                <Button
                  onClick={() => onStatusChange(orphan.id, "PENDING")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white text-[9px] font-bold h-6 py-0 px-2 rounded-lg flex-1 border border-slate-700/50 transition-all"
                >
                  قيد المراجعة
                </Button>
              )}
              {currentCol !== "APPROVED" && (
                <Button
                  onClick={() => onStatusChange(orphan.id, "APPROVED")}
                  className="bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 text-[9px] font-bold h-6 py-0 px-2 rounded-lg flex-1 border border-amber-900/50 transition-all"
                >
                  معتمد
                </Button>
              )}
              {currentCol !== "REJECTED" && (
                <Button
                  onClick={() => onStatusChange(orphan.id, "REJECTED")}
                  className="bg-red-950/40 hover:bg-red-900/40 text-red-400 text-[9px] font-bold h-6 py-0 px-2 rounded-lg flex-1 border border-red-900/50 transition-all"
                >
                  مرفوض
                </Button>
              )}
            </div>
          </div>
        )}

        {/* If Active Sponsored, show sponsor name */}
        {currentCol === "ACTIVE_SPONSORSHIP" && orphan.sponsorships?.[0] && (
          <div className="border-t border-emerald-900/50 bg-emerald-950/30 p-2 rounded-lg mt-2 text-[9px] font-semibold text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              الكفيل: {orphan.sponsorships[0].sponsor.fullName}
            </span>
            <Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 font-bold text-[8px]">
              {orphan.sponsorships[0].amount} {orphan.sponsorships[0].currency}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
