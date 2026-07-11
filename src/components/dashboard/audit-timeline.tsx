"use client"

import { useState, useEffect } from "react"
import { getAuditLogsForEntity } from "@/app/actions/audit-actions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, Clock, RefreshCw, FileEdit, Plus, Trash2 } from "lucide-react"

interface AuditTimelineProps {
  entityType: string
  entityId: string
}

// Arabic translation map for system fields
const FIELD_TRANSLATIONS: Record<string, string> = {
  headFullName: "اسم رب الأسرة",
  headNationalId: "الرقم الوطني لرب الأسرة",
  headGender: "جنس رب الأسرة",
  headPhoneNumber: "رقم الهاتف الأساسي",
  headAltPhone: "رقم الهاتف البديل",
  headBirthdate: "تاريخ ميلاد رب الأسرة",
  addressDetail: "العنوان بالتفصيل",
  subDistrictId: "الحي/القرية",
  vulnerabilityScore: "درجة الهشاشة الميدانية",
  notes: "ملاحظات عامة",
  guardianName: "اسم الوصي",
  guardianRelation: "صلة قرابة الوصي",
  guardianPhone: "هاتف الوصي",
  familyMembersCount: "عدد أفراد الأسرة",
  monthlyIncome: "الدخل الشهري",
  housingType: "نوع السكن",
  housingCondition: "حالة السكن",
  povertyLevel: "مستوى الفقر",
  fullName: "الاسم الكامل",
  gender: "الجنس",
  birthdate: "تاريخ الميلاد",
  nationalId: "الرقم الوطني",
  category: "الفئة",
  orphanCode: "كود ملف اليتيم",
  kuraimiAccount: "حساب الكريمي",
  educationLevel: "المستوى التعليمي",
  schoolName: "اسم المدرسة",
  educationalStage: "المرحلة الدراسية",
  averageGrade: "معدل الدرجات",
  educationalNeeds: "الاحتياجات التعليمية",
  healthStatus: "الوضع الصحي",
  disabilityType: "نوع الإعاقة",
  disability: "حالة الإعاقة",
  disabilityDetails: "تفاصيل الإعاقة",
  orphanType: "نوع اليتم",
  fatherDeathDate: "تاريخ وفاة الأب",
  fatherDeathCause: "سبب وفاة الأب",
  motherDeathDate: "تاريخ وفاة الأم",
  motherName: "اسم الأم",
  verificationStatus: "حالة التحقق",
  isActive: "حالة النشاط",
  amount: "المبلغ",
  currency: "العملة",
  paymentCycle: "دورة الدفع",
  status: "حالة الكفالة",
  startDate: "تاريخ بدء الكفالة",
  endDate: "تاريخ انتهاء الكفالة",
  sponsorshipNotes: "ملاحظات الكفالة",
  name: "اسم المشروع",
  description: "وصف المشروع",
  budget: "الميزانية",
  targetCount: "العدد المستهدف",
}

const ACTION_STYLES = {
  CREATE: { label: "إضافة", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Plus },
  UPDATE: { label: "تعديل", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: FileEdit },
  DELETE: { label: "حذف مؤقت", bg: "bg-red-500/10 text-red-400 border-red-500/20", icon: Trash2 },
  RESTORE: { label: "استعادة", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: RefreshCw },
}

export function AuditTimeline({ entityType, entityId }: AuditTimelineProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    const result = await getAuditLogsForEntity(entityType, entityId)
    if (result.success) {
      setLogs(result.logs)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [entityType, entityId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-emerald-500" />
        <span>جاري تحميل سجل التغييرات...</span>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-500 font-medium border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
        لا توجد أي تعديلات أو حركات مسجلة لهذا الملف حتى الآن.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
      <div className="relative border-r border-slate-850 mr-4 space-y-6">
        {logs.map((log) => {
          const actionStyle = ACTION_STYLES[log.action as keyof typeof ACTION_STYLES] || {
            label: log.action,
            bg: "bg-slate-800/40 text-slate-400 border-slate-700/30",
            icon: Clock,
          }
          const IconComponent = actionStyle.icon

          return (
            <div key={log.id} className="relative pr-6">
              {/* Dot on timeline */}
              <div className={`absolute -right-3 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-slate-950 shadow-sm ${actionStyle.bg}`}>
                <IconComponent className="h-3 w-3" />
              </div>

              {/* Log Card */}
              <Card className="border-0 shadow-sm bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${actionStyle.bg} border font-bold text-xs`}>
                        {actionStyle.label}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-350 flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-500" />
                        {log.userName || "مجهول"} ({log.userEmail || ""})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString("ar-YE-u-nu-latn")}
                    </span>
                  </div>

                  {/* Changes detail */}
                  {Object.keys(log.changes).length > 0 ? (
                    <div className="text-xs space-y-2">
                      <div className="font-bold text-slate-450 mb-1">تفاصيل الحقول المتأثرة:</div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {Object.entries(log.changes).map(([field, val]) => {
                          const valTyped = val as any
                          const fieldName = FIELD_TRANSLATIONS[field] || field
                          return (
                            <div key={field} className="border border-slate-850 p-2 rounded-lg bg-slate-950/40 space-y-1">
                              <span className="font-bold text-slate-200 block">{fieldName}:</span>
                              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                                {log.action === "CREATE" ? (
                                  <>
                                    <span className="text-emerald-400 font-semibold">القيمة:</span>
                                    <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-350 font-bold max-w-full truncate">
                                      {valTyped.new === true ? "نعم" : valTyped.new === false ? "لا" : String(valTyped.new ?? "-")}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-slate-500 line-through">
                                      {valTyped.old === true ? "نعم" : valTyped.old === false ? "لا" : String(valTyped.old ?? "-")}
                                    </span>
                                    <span className="text-slate-650">←</span>
                                    <span className="bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-350 font-bold max-w-full truncate">
                                      {valTyped.new === true ? "نعم" : valTyped.new === false ? "لا" : String(valTyped.new ?? "-")}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">لا توجد تفاصيل حقول معدلة (تغيير الحالة فقط).</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
