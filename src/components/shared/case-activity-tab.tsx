"use client"

import { useState, useEffect } from "react"
import { createCaseActivity, getCaseActivitiesForEntity, deleteCaseActivity } from "@/app/actions/activity-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, User, Trash2, Phone, Home, HeartPulse, GraduationCap, Coins, Info } from "lucide-react"

interface CaseActivityTabProps {
  familyId?: string | null
  beneficiaryId?: string | null
}

const ACTIVITY_TYPES = [
  { value: "VISIT", label: "زيارة ميدانية", icon: Home, color: "text-blue-450 bg-blue-500/10 border-blue-500/20" },
  { value: "CALL", label: "اتصال هاتفي", icon: Phone, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "HEALTH_CHECK", label: "فحص طبي/صحي", icon: HeartPulse, color: "text-rose-450 bg-rose-500/10 border-rose-500/20" },
  { value: "EDUCATION_CHECK", label: "متابعة دراسية وتعليمية", icon: GraduationCap, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { value: "FINANCIAL_ASSISTANCE", label: "متابعة دعم مالي", icon: Coins, color: "text-emerald-450 bg-emerald-500/10 border-emerald-500/20" },
  { value: "OTHER", label: "أخرى / ملاحظة حالة", icon: Info, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
]

export function CaseActivityTab({ familyId, beneficiaryId }: CaseActivityTabProps) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [type, setType] = useState("VISIT")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fetchActivities = async () => {
    setLoading(true)
    const result = await getCaseActivitiesForEntity({ familyId, beneficiaryId })
    if (result.success) {
      setActivities(result.activities)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchActivities()
  }, [familyId, beneficiaryId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة.")
      return
    }

    setSubmitting(true)
    setError("")

    const result = await createCaseActivity({
      type,
      title,
      description,
      familyId,
      beneficiaryId,
    })

    if (result.success) {
      setTitle("")
      setDescription("")
      fetchActivities()
    } else {
      setError(result.error || "فشل تسجيل النشاط الميداني.")
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف سجل هذه الحركة الميدانية؟")) return
    const result = await deleteCaseActivity(id)
    if (result.success) {
      fetchActivities()
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Add New Activity Form ── */}
      <form onSubmit={handleSubmit} className="border border-slate-850 rounded-xl p-4 bg-slate-900/40 space-y-4">
        <h4 className="text-xs font-bold text-slate-350 border-b border-slate-850 pb-2">تسجيل حركة متابعة / زيارة ميدانية جديدة</h4>
        
        {error && (
          <div className="text-xs font-semibold text-red-400 bg-red-950/20 p-2 rounded-lg border border-red-900/30">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Type Select */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">نوع الحركة</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-white"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-950 text-white">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-400">العنوان / ملخص موضوع الزيارة</label>
            <Input
              placeholder="مثال: زيارة لتسليم الكفالة السنوية وتفقد أحوال المنزل..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs placeholder-slate-500 bg-slate-950 border-slate-800 text-white text-right focus-visible:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400">التفاصيل وتقرير الزيارة</label>
          <Textarea
            placeholder="اكتب التقرير الميداني المفصل للزيارة أو المكالمة، بما في ذلك أي احتياجات طارئة..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs placeholder-slate-500 bg-slate-950 border-slate-800 text-white text-right min-h-[80px] focus-visible:ring-emerald-500"
            required
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg px-4 h-9 shadow-md transition-all hover:shadow-emerald-900/30"
          >
            {submitting ? "جاري الحفظ..." : "تسجيل التقرير الميداني"}
          </Button>
        </div>
      </form>

      {/* ── Activities Timeline List ── */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-350 border-b border-slate-850 pb-2">سجل المتابعات الميدانية السابقة ({activities.length})</h4>
        
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">جاري تحميل السجل الميداني...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
            لا توجد أي زيارات ميدانية أو تقارير متابعة مسجلة بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => {
              const config = ACTIVITY_TYPES.find((t) => t.value === act.type) || ACTIVITY_TYPES[5]
              const IconComp = config.icon

              return (
                <div key={act.id} className="border border-slate-850 rounded-xl p-4 bg-slate-900/40 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-3 hover:border-slate-700 transition-colors">
                  <div className="space-y-2 text-right">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${config.color} border font-bold text-[10px]`}>
                        <IconComp className="h-3 w-3 inline ml-1" />
                        {config.label}
                      </Badge>
                      <h5 className="font-bold text-white text-xs">{act.title}</h5>
                    </div>
                    
                    <p className="text-xs text-slate-350 leading-relaxed font-medium whitespace-pre-wrap">{act.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-semibold mt-2 pt-1 border-t border-slate-850">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-650" />
                        بواسطة: {act.recordedByName || "الباحث الميداني"}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-slate-650" />
                        تاريخ الحركة: {new Date(act.createdAt).toLocaleDateString("ar-YE")}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end items-center md:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(act.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
