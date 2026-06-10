"use client"

import { useState, useEffect } from "react"
import { createCaseActivity, getCaseActivitiesForEntity, deleteCaseActivity } from "@/app/actions/activity-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, User, Trash2, ShieldAlert, Phone, Home, HeartPulse, GraduationCap, Coins, Info } from "lucide-react"

interface CaseActivityTabProps {
  familyId?: string | null
  beneficiaryId?: string | null
}

const ACTIVITY_TYPES = [
  { value: "VISIT", label: "زيارة ميدانية", icon: Home, color: "text-blue-600 bg-blue-50 border-blue-100" },
  { value: "CALL", label: "اتصال هاتفي", icon: Phone, color: "text-amber-600 bg-amber-50 border-amber-100" },
  { value: "HEALTH_CHECK", label: "فحص طبي/صحي", icon: HeartPulse, color: "text-rose-600 bg-rose-50 border-rose-100" },
  { value: "EDUCATION_CHECK", label: "متابعة دراسية وتعليمية", icon: GraduationCap, color: "text-purple-600 bg-purple-50 border-purple-100" },
  { value: "FINANCIAL_ASSISTANCE", label: "متابعة دعم مالي", icon: Coins, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { value: "OTHER", label: "أخرى / ملاحظة حالة", icon: Info, color: "text-slate-600 bg-slate-50 border-slate-100" },
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
      <form onSubmit={handleSubmit} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30 space-y-4">
        <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2">تسجيل حركة متابعة / زيارة ميدانية جديدة</h4>
        
        {error && (
          <div className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Type Select */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">نوع الحركة</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-gray-700"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-600">العنوان / ملخص موضوع الزيارة</label>
            <Input
              placeholder="مثال: زيارة لتسليم الكفالة السنوية وتفقد أحوال المنزل..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs placeholder-gray-400 bg-white border-gray-200 text-right"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600">التفاصيل وتقرير الزيارة</label>
          <Textarea
            placeholder="اكتب التقرير الميداني المفصل للزيارة أو المكالمة، بما في ذلك أي احتياجات طارئة..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs placeholder-gray-400 bg-white border-gray-200 text-right min-h-[80px]"
            required
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg px-4 h-9 shadow-sm"
          >
            {submitting ? "جاري الحفظ..." : "تسجيل التقرير الميداني"}
          </Button>
        </div>
      </form>

      {/* ── Activities Timeline List ── */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2">سجل المتابعات الميدانية السابقة ({activities.length})</h4>
        
        {loading ? (
          <div className="text-center py-6 text-xs text-gray-400">جاري تحميل السجل الميداني...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 italic border border-dashed border-gray-100 rounded-xl">
            لا توجد أي زيارات ميدانية أو تقارير متابعة مسجلة بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => {
              const config = ACTIVITY_TYPES.find((t) => t.value === act.type) || ACTIVITY_TYPES[5]
              const IconComp = config.icon

              return (
                <div key={act.id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-3 hover:border-emerald-100 transition-colors">
                  <div className="space-y-2 text-right">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${config.color} border font-bold text-[10px]`}>
                        <IconComp className="h-3 w-3 inline ml-1" />
                        {config.label}
                      </Badge>
                      <h5 className="font-bold text-gray-800 text-xs">{act.title}</h5>
                    </div>
                    
                    <p className="text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{act.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-semibold mt-2 pt-1 border-t border-gray-50">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-300" />
                        بواسطة: {act.recordedByName || "الباحث الميداني"}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-gray-300" />
                        تاريخ الحركة: {new Date(act.createdAt).toLocaleDateString("ar-YE")}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end items-center md:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(act.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
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
