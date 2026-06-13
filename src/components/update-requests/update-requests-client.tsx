"use client"

import { useState } from "react"
import { approveUpdateRequest, rejectUpdateRequest } from "@/app/actions/update-request-actions"
import { CheckCircle, XCircle, Eye, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react"

interface Props {
  requests: any[]
  reviewerId: string
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: "قيد المراجعة", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  APPROVED: { label: "مقبول",        cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  REJECTED: { label: "مرفوض",        cls: "bg-red-500/20 text-red-300 border-red-500/30" },
}

export function UpdateRequestsClient({ requests, reviewerId }: Props) {
  const [openId, setOpenId]           = useState<string | null>(null)
  const [rejectId, setRejectId]       = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [loading, setLoading]         = useState<string | null>(null)
  const [localRequests, setLocal]     = useState(requests)
  const [filter, setFilter]           = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING")

  const displayed = localRequests.filter(r => filter === "ALL" || r.status === filter)

  const handleApprove = async (id: string) => {
    setLoading(id + "_approve")
    const res = await approveUpdateRequest(id, reviewerId)
    if (res.success) setLocal(prev => prev.map(r => r.id === id ? { ...r, status: "APPROVED" } : r))
    setLoading(null)
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return
    setLoading(id + "_reject")
    const res = await rejectUpdateRequest(id, rejectReason, reviewerId)
    if (res.success) {
      setLocal(prev => prev.map(r => r.id === id ? { ...r, status: "REJECTED", rejectionReason: rejectReason } : r))
      setRejectId(null)
      setRejectReason("")
    }
    setLoading(null)
  }

  const counts = {
    PENDING:  localRequests.filter(r => r.status === "PENDING").length,
    APPROVED: localRequests.filter(r => r.status === "APPROVED").length,
    REJECTED: localRequests.filter(r => r.status === "REJECTED").length,
  }

  const CompareRow = ({ label, oldVal, newVal }: { label: string; oldVal: any; newVal: any }) => {
    const changed = String(oldVal || "") !== String(newVal || "") && newVal != null && newVal !== ""
    return (
      <div className={`grid grid-cols-3 text-xs gap-2 py-1.5 border-b border-white/5 ${changed ? "bg-emerald-950/30 rounded px-2" : ""}`}>
        <span className="text-slate-400 font-bold">{label}</span>
        <span className="text-slate-300">{oldVal || <span className="text-slate-600 italic">—</span>}</span>
        <span className={changed ? "text-emerald-300 font-bold" : "text-slate-300"}>
          {newVal || <span className="text-slate-600 italic">—</span>}
          {changed && <span className="text-emerald-500 mr-1">✱</span>}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
              filter === f
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
            }`}
          >
            {f === "ALL" ? "الكل" : statusLabel[f].label}
            {f !== "ALL" && counts[f] > 0 && (
              <span className="mr-1.5 bg-white/20 rounded-full px-1.5 py-0.5">{counts[f]}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          <Clock className="h-10 w-10 mx-auto mb-3 text-slate-700" />
          لا توجد طلبات {filter !== "ALL" ? statusLabel[filter].label : ""}
        </div>
      )}

      {displayed.map(req => {
        const b    = req.beneficiary
        const data = req.submittedData as any || {}
        const pGuardian = b.guardians?.[0] || {}
        const isOpen = openId === req.id

        return (
          <div key={req.id} className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-bold text-white text-sm">{b.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    أرسل بواسطة: <span className="text-slate-300">{req.submitterName || "—"}</span>
                    {" · "}
                    {new Date(req.createdAt).toLocaleDateString("ar-YE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {req.status === "REJECTED" && req.rejectionReason && (
                    <p className="text-xs text-red-400 mt-1">سبب الرفض: {req.rejectionReason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusLabel[req.status].cls}`}>
                  {statusLabel[req.status].label}
                </span>
                <button
                  onClick={() => setOpenId(isOpen ? null : req.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Details — comparison */}
            {isOpen && (
              <div className="border-t border-white/10 px-4 py-4 space-y-4">
                {/* Column headers */}
                <div className="grid grid-cols-3 text-xs font-extrabold text-slate-400 mb-2 gap-2">
                  <span>الحقل</span>
                  <span>القيمة الحالية</span>
                  <span className="text-emerald-400">القيمة الجديدة ✱</span>
                </div>

                {/* التعليم */}
                <p className="text-xs font-extrabold text-emerald-400 mt-1">📚 التعليم</p>
                <CompareRow label="المرحلة الدراسية" oldVal={b.educationalStage} newVal={data.educationalStage} />
                <CompareRow label="الصف الدراسي" oldVal={b.educationLevel} newVal={data.educationLevel} />
                <CompareRow label="المدرسة" oldVal={b.schoolName} newVal={data.schoolName} />
                <CompareRow label="حفظ القرآن" oldVal={b.quranMemorization} newVal={data.quranMemorization} />

                {/* الصحة */}
                <p className="text-xs font-extrabold text-emerald-400 mt-2">💊 الصحة</p>
                <CompareRow label="الحالة الصحية" oldVal={b.healthStatus} newVal={data.healthStatus} />

                {/* السكن */}
                <p className="text-xs font-extrabold text-emerald-400 mt-2">🏠 السكن</p>
                <CompareRow label="المحافظة" oldVal={b.birthGovernorate} newVal={data.birthGovernorate} />
                <CompareRow label="المديرية" oldVal={b.birthDistrict} newVal={data.birthDistrict} />
                <CompareRow label="المنطقة" oldVal={b.birthArea} newVal={data.birthArea} />
                <CompareRow label="نوع السكن" oldVal={b.housingStatus} newVal={data.housingStatus} />

                {/* المالي */}
                <p className="text-xs font-extrabold text-emerald-400 mt-2">💰 المالي</p>
                <CompareRow label="رقم الكريمي" oldVal={b.kuraimiAccount} newVal={data.kuraimiAccount} />

                {/* المعيل */}
                <p className="text-xs font-extrabold text-emerald-400 mt-2">👤 المعيل</p>
                <CompareRow label="اسم المعيل" oldVal={pGuardian.fullName} newVal={data.guardian?.fullName} />
                <CompareRow label="صلة القرابة" oldVal={pGuardian.relation} newVal={data.guardian?.relation} />
                <CompareRow label="المهنة" oldVal={pGuardian.occupation} newVal={data.guardian?.occupation} />
                <CompareRow label="هاتف 1" oldVal={pGuardian.phone1} newVal={data.guardian?.phone1} />
                <CompareRow label="هاتف 2" oldVal={pGuardian.phone2} newVal={data.guardian?.phone2} />
                <CompareRow label="هاتف 3" oldVal={pGuardian.phone3} newVal={data.guardian?.phone3} />
                <CompareRow label="هاتف 4" oldVal={pGuardian.phone4} newVal={data.guardian?.phone4} />

                {/* الإخوة */}
                {(data.siblings?.length > 0) && (
                  <>
                    <p className="text-xs font-extrabold text-emerald-400 mt-2">👨‍👩‍👧 الإخوة</p>
                    {b.siblings?.map((sib: any, idx: number) => {
                      const newSib = data.siblings?.find((s: any) => s.id === sib.id)
                      return (
                        <div key={sib.id} className="rounded-xl border border-white/10 p-2 space-y-1">
                          <p className="text-xs text-slate-500 font-bold">الأخ/الأخت {idx + 1}: {sib.fullName}</p>
                          <CompareRow label="المؤهل" oldVal={sib.qualification} newVal={newSib?.qualification} />
                          <CompareRow label="الحالة الاجتماعية" oldVal={sib.socialStatus} newVal={newSib?.socialStatus} />
                        </div>
                      )
                    })}
                  </>
                )}

                {/* أزرار الإجراء */}
                {req.status === "PENDING" && (
                  <div className="flex gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-white font-bold text-xs transition-all disabled:opacity-50"
                    >
                      {loading === req.id + "_approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      قبول وتطبيق التغييرات
                    </button>
                    <button
                      onClick={() => setRejectId(req.id)}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600/80 hover:bg-red-600 py-2.5 text-white font-bold text-xs transition-all disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" /> رفض
                    </button>
                  </div>
                )}

                {/* نموذج سبب الرفض */}
                {rejectId === req.id && (
                  <div className="space-y-2 pt-2">
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="اكتب سبب الرفض ليظهر للمعيل..."
                      rows={3}
                      className="w-full rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-right resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={!rejectReason.trim() || !!loading}
                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2 text-white font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {loading === req.id + "_reject" ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "تأكيد الرفض"}
                      </button>
                      <button
                        onClick={() => { setRejectId(null); setRejectReason("") }}
                        className="px-4 rounded-xl bg-white/10 text-white text-xs font-bold"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
