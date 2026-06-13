"use client"

import { useState, useEffect } from "react"

import {
  Baby,
  Heart,
  User,
  Users,
  GraduationCap,
  Home as HomeIcon,
  CreditCard,
  Phone,
  FileText,
  Activity,
  AlertCircle,
  Globe,
  Calendar,
  MapPin,
} from "lucide-react"
import { AuditTimeline } from "@/components/dashboard/audit-timeline"
import { CaseActivityTab } from "@/components/shared/case-activity-tab"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

// =============================================================================
// TYPES
// =============================================================================

type Sponsor = {
  fullName: string
  country: string | null
  notes: string | null
}

type Sponsorship = {
  id: string
  amount: any
  currency: string
  paymentCycle: string
  status: string
  sponsorCountry: string | null
  sponsorshipNotes: string | null
  sponsor: Sponsor
}

type Family = {
  headFullName: string
  headNationalId: string
  headGender: string
  headPhoneNumber: string | null
  headAltPhone: string | null
  headBirthdate: Date | null
  addressDetail: string | null
  vulnerabilityScore: number | null
  notes: string | null
  isActive: boolean
  guardianName: string | null
  guardianRelation: string | null
  guardianPhone: string | null
  familyMembersCount: number | null
  monthlyIncome: number | null
  housingType: string | null
  housingCondition: string | null
  povertyLevel: string | null
}

type Orphan = {
  id: string
  fullName: string
  shortName: string | null
  gender: string
  birthdate: Date
  nationalId: string | null
  religion: string | null
  category: string
  // حسابات
  orphanCode: string | null
  kuraimiAccount: string | null
  kuraimiAccountOld: string | null
  mumaiyo: string | null
  baitZakatNumber: string | null
  // تعليم
  educationLevel: string | null
  schoolName: string | null
  educationalStage: string | null
  averageGrade: number | null
  educationalNeeds: string | null
  quranMemorization: string | null
  // صحة
  healthStatus: string | null
  disabilityType: string | null
  disability: boolean
  disabilityDetails: string | null
  // معيشة
  nutritionStatus: string | null
  housingStatus: string | null
  // تيتم
  orphanType: string | null
  fatherFullName: string | null
  fatherDeathDate: Date | null
  fatherDeathCause: string | null
  motherDeathDate: Date | null
  motherName: string | null
  // مكان الميلاد
  birthGovernorate: string | null
  birthDistrict: string | null
  birthVillage: string | null
  birthArea: string | null
  // معرِّف
  referrerName: string | null
  referrerPhone1: string | null
  referrerPhone2: string | null
  // تسويق
  marketedToOrg: string | null
  // تحقق
  verificationStatus: string
  verifiedBy: string | null
  rejectionReason: string | null
  createdById: string | null
  isActive: boolean
  notes: string | null
  // علاقات
  family: Family
  sponsorships: Sponsorship[]
  guardians?: { id: string; fullName: string; nationalId: string | null; relation: string | null; occupation: string | null; phone1: string | null; phone2: string | null; phone3: string | null; phone4: string | null; isPrimary: boolean }[]
  siblings?: { id: string; fullName: string; qualification: string | null; birthdate: Date | null; socialStatus: string | null; gender: string | null; siblingOrder: number }[]
}

interface OrphanDetailsSheetProps {
  orphan: Orphan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove?: (id: string) => Promise<any>
  onReject?: (id: string, reason: string) => Promise<any>
}

// =============================================================================
// HELPERS
// =============================================================================

function calculateAge(birthdate: Date | string): number {
  if (!birthdate) return 0
  const today = new Date()
  const birthDate = new Date(birthdate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

function formatDate(date: Date | string | null): string {
  if (!date) return "غير محدد"
  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "غير محدد"
  return new Intl.NumberFormat("ar-YE", {
    style: "currency",
    currency: "YER",
    maximumFractionDigits: 0,
  }).format(amount)
}

function renderValue(value: any, placeholder = "-") {
  if (value === null || value === undefined || value === "" || value === false) {
    return <span className="text-slate-500 font-normal">{placeholder}</span>
  }
  if (value === true) return "نعم"
  return <span className="font-semibold text-white">{value}</span>
}

export function OrphanDetailsSheet({
  orphan,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: OrphanDetailsSheetProps) {
  const [rejectionReasonInput, setRejectionReasonInput] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  // Reset rejection state when orphan changes
  useEffect(() => {
    setIsRejecting(false)
    setRejectionReasonInput("")
  }, [orphan?.id])

  if (!orphan) return null

  // Helper translations
  const translateOrphanType = (type: string | null) => {
    if (type === "FATHER") return "يتيم الأب"
    if (type === "MOTHER") return "يتيم الأم"
    if (type === "BOTH") return "يتيم الأبوين"
    return "غير محدد"
  }

  const translatePovertyLevel = (level: string | null) => {
    if (level === "SEVERE") return "شديد الفقر"
    if (level === "MEDIUM") return "متوسط الفقر"
    if (level === "LOW") return "منخفض الفقر"
    return "غير محدد"
  }

  const translateVerificationStatus = (status: string) => {
    if (status === "APPROVED") return "مكتمل ومعتمد"
    if (status === "REJECTED") return "مرفوض"
    return "قيد المراجعة والتحقق"
  }

  const translatePaymentCycle = (cycle: string) => {
    if (cycle === "MONTHLY") return "شهري"
    if (cycle === "QUARTERLY") return "ربع سنوي"
    if (cycle === "ANNUAL") return "سنوي"
    if (cycle === "SEMI_ANNUAL") return "نصف سنوي"
    if (cycle === "ONE_TIME") return "مرة واحدة"
    return cycle
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl"
      >
        {/* Header Panel */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-500 to-teal-600 p-6 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-sm">
                <Baby className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold md:text-xl">
                  {orphan.fullName}
                </h3>
                <p className="text-xs text-emerald-100 mt-1 flex items-center gap-2">
                  <span>رقم ملف اليتيم:</span>
                  <span className="font-mono bg-white/15 px-2 py-0.5 rounded-md">
                    {orphan.orphanCode || "غير محدد"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="personal" className="w-full flex flex-col h-full">
            <TabsList className="bg-slate-900/60 rounded-xl p-1 mb-4 flex-shrink-0 gap-1 flex-wrap h-auto">
              <TabsTrigger value="personal" className="text-xs py-1.5 flex-1">
                <User className="h-3.5 w-3.5 ml-1.5" />
                الشخصية والدراسية
              </TabsTrigger>
              <TabsTrigger value="family" className="text-xs py-1.5 flex-1">
                <HomeIcon className="h-3.5 w-3.5 ml-1.5" />
                الأسرة والوصي
              </TabsTrigger>
              <TabsTrigger value="orphanhood" className="text-xs py-1.5 flex-1">
                <FileText className="h-3.5 w-3.5 ml-1.5" />
                بيانات الوفاة
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs py-1.5 flex-1">
                <CreditCard className="h-3.5 w-3.5 ml-1.5" />
                المالية والكفالة
              </TabsTrigger>
              <TabsTrigger value="activities" className="text-xs py-1.5 flex-1">
                <Calendar className="h-3.5 w-3.5 ml-1.5" />
                الزيارات والمتابعة
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs py-1.5 flex-1">
                <FileText className="h-3.5 w-3.5 ml-1.5" />
                سجل الحركة
              </TabsTrigger>
            </TabsList>

            <div className="flex-1">
              {/* TAB 1: Personal & Educational */}
              <TabsContent value="personal" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الرقم الوطني / شهادة الميلاد</p>
                    <p className="text-sm font-mono tabular-nums">{renderValue(orphan.nationalId)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الجنس</p>
                    <p className="text-sm font-semibold">{orphan.gender === "MALE" ? "ذكر" : "أنثى"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ الميلاد</p>
                    <p className="text-sm tabular-nums">{formatDate(orphan.birthdate)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">العمر الحالي</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      {calculateAge(orphan.birthdate).toLocaleString("ar-SA")} سنة
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الاسم المختصر للكشوفات</p>
                    <p className="text-sm">{renderValue(orphan.shortName)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الديانة</p>
                    <p className="text-sm">{renderValue(orphan.religion)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">اسم الوالد رباعياً</p>
                    <p className="text-sm">{renderValue(orphan.fatherFullName)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">اسم الأم</p>
                    <p className="text-sm">{renderValue(orphan.motherName)}</p>
                  </div>
                </div>

                <Separator className="my-2 bg-slate-800" />
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  مكان الميلاد
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[["المحافظة", orphan.birthGovernorate],["المديرية", orphan.birthDistrict],["العزلة", orphan.birthVillage],["المنطقة", orphan.birthArea]].map(([label, val]) => (
                    <div key={label as string} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                      <p className="text-xs text-gray-400 font-semibold mb-1">{label as string}</p>
                      <p className="text-sm">{renderValue(val)}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-2 bg-slate-800" />
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  أرقام الحسابات والتعريف
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[["رقم ملف اليتيم", orphan.orphanCode],["رقم بيت الزكاة", orphan.baitZakatNumber],["رقم المميو كريمي", orphan.mumaiyo],["رقم الكريمي الجديد", orphan.kuraimiAccount],["رقم الكريمي القديم", orphan.kuraimiAccountOld]].map(([label, val]) => (
                    <div key={label as string} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                      <p className="text-xs text-gray-400 font-semibold mb-1">{label as string}</p>
                      <p className="text-sm font-mono">{renderValue(val)}</p>
                    </div>
                  ))}
                </div>



                <Separator className="my-2 bg-slate-800" />
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <GraduationCap className="h-4 w-4 text-emerald-500" />
                  المسار التعليمي والتحصيل الدراسي
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">المرحلة الدراسية</p>
                    <p className="text-sm">{renderValue(orphan.educationalStage)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الصف الدراسي</p>
                    <p className="text-sm">{renderValue(orphan.educationLevel)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">اسم المدرسة</p>
                    <p className="text-sm">{renderValue(orphan.schoolName)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">مقدار الحفظ من القرآن</p>
                    <p className="text-sm">{renderValue(orphan.quranMemorization)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">التغذية</p>
                    <p className="text-sm">{renderValue(orphan.nutritionStatus)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">وضع السكن</p>
                    <p className="text-sm">{renderValue(orphan.housingStatus)}</p>
                  </div>
                </div>

                <Separator className="my-2 bg-slate-800" />
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <Activity className="h-4 w-4 text-rose-500" />
                  الحالة الصحية والاحتياجات الخاصة
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الحالة الصحية العامة</p>
                    <p className="text-sm">{renderValue(orphan.healthStatus, "سليم / طبيعي")}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">هل يعاني من إعاقة؟</p>
                    <p className="text-sm font-semibold">
                      {orphan.disability ? (
                        <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-0">نعم</Badge>
                      ) : (
                        <span className="text-gray-500">لا</span>
                      )}
                    </p>
                  </div>
                  {orphan.disability && (
                    <div className="col-span-2 rounded-xl border border-red-500/20 bg-red-950/20 p-3.5">
                      <p className="text-xs text-red-600 font-semibold mb-1">تفاصيل الإعاقة والاحتياج</p>
                      <p className="text-sm text-red-200 font-semibold">{orphan.disabilityDetails}</p>
                    </div>
                  )}
                </div>

                {/* المعيلون */}
                {orphan.guardians && orphan.guardians.length > 0 && (
                  <>
                    <Separator className="my-2 bg-slate-800" />
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                      <User className="h-4 w-4 text-amber-500" />
                      بيانات المعيل
                    </h4>
                    {orphan.guardians.map((g, i) => (
                      <div key={g.id} className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5 mb-2">
                        <p className="text-xs font-bold text-amber-600 mb-2">{g.isPrimary ? "المعيل الأساسي" : `معيل ${i + 1}`}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {[["الاسم", g.fullName],["رقم الهوية", g.nationalId],["العلاقة", g.relation],["المهنة", g.occupation],["هاتف 1", g.phone1],["هاتف 2", g.phone2],["هاتف 3", g.phone3],["هاتف 4", g.phone4]].filter(([,v]) => v).map(([label, val]) => (
                            <div key={label as string}>
                              <p className="text-xs text-gray-400 mb-0.5">{label as string}</p>
                              <p className="text-xs font-semibold font-mono">{val as string}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* الإخوة */}
                {orphan.siblings && orphan.siblings.length > 0 && (
                  <>
                    <Separator className="my-2 bg-slate-800" />
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                      <Users className="h-4 w-4 text-blue-500" />
                      بيانات الإخوة ({orphan.siblings.length})
                    </h4>
                    <div className="space-y-2">
                      {orphan.siblings.sort((a, b) => a.siblingOrder - b.siblingOrder).map((s) => (
                        <div key={s.id} className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3 flex items-center gap-4">
                          <span className="text-xs font-bold text-blue-500 w-5">{s.siblingOrder}</span>
                          <div className="flex-1 grid grid-cols-2 gap-1 sm:grid-cols-4">
                            <div><p className="text-xs text-gray-400">الاسم</p><p className="text-xs font-semibold">{s.fullName}</p></div>
                            <div><p className="text-xs text-gray-400">الجنس</p><p className="text-xs">{s.gender === "MALE" ? "ذكر" : s.gender === "FEMALE" ? "أنثى" : "-"}</p></div>
                            <div><p className="text-xs text-gray-400">المؤهل</p><p className="text-xs">{s.qualification || "-"}</p></div>
                            <div><p className="text-xs text-gray-400">الحالة</p><p className="text-xs">{s.socialStatus || "-"}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* المعرِّف والتسويق */}
                {(orphan.referrerName || orphan.marketedToOrg) && (
                  <>
                    <Separator className="my-2 bg-slate-800" />
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      المعرِّف والتسويق
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5"><p className="text-xs text-gray-400 font-semibold mb-1">اسم المعرِّف</p><p className="text-sm">{renderValue(orphan.referrerName)}</p></div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5"><p className="text-xs text-gray-400 font-semibold mb-1">هاتف المعرِّف 1</p><p className="text-sm font-mono">{renderValue(orphan.referrerPhone1)}</p></div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5"><p className="text-xs text-gray-400 font-semibold mb-1">الجهة المسوَّق لها</p><p className="text-sm">{renderValue(orphan.marketedToOrg)}</p></div>
                    </div>
                  </>
                )}
              </TabsContent>


              {/* TAB 2: Family & Guardian */}
              <TabsContent value="family" className="space-y-4 outline-none">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <User className="h-4 w-4 text-emerald-500" />
                  بيانات الوصي والمسؤول القانوني
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">اسم الوصي</p>
                    <p className="text-sm font-bold">{renderValue(orphan.family.guardianName)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">صلة القرابة</p>
                    <p className="text-sm">{renderValue(orphan.family.guardianRelation)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">رقم هاتف الوصي</p>
                    <p className="text-sm font-mono tabular-nums">{renderValue(orphan.family.guardianPhone)}</p>
                  </div>
                </div>

                <Separator className="my-2 bg-slate-800" />
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <HomeIcon className="h-4 w-4 text-emerald-500" />
                  حالة الأسرة والظروف المعيشية
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">رب الأسرة</p>
                    <p className="text-sm">{renderValue(orphan.family.headFullName)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">عدد أفراد الأسرة</p>
                    <p className="text-sm tabular-nums font-semibold">
                      {orphan.family.familyMembersCount !== null ? `${orphan.family.familyMembersCount.toLocaleString("ar-SA")} أفراد` : renderValue(null)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">مستوى فقر الأسرة</p>
                    <p className="text-sm font-semibold">
                      {orphan.family.povertyLevel ? (
                        orphan.family.povertyLevel === "SEVERE" ? (
                          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-0">شديد الفقر</Badge>
                        ) : orphan.family.povertyLevel === "MEDIUM" ? (
                          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-0">فقر متوسط</Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0">فقر منخفض</Badge>
                        )
                      ) : (
                        renderValue(null)
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الدخل الشهري للأسرة</p>
                    <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                      {orphan.family.monthlyIncome !== null ? formatCurrency(orphan.family.monthlyIncome) : renderValue(null)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">نوع السكن</p>
                    <p className="text-sm">{renderValue(orphan.family.housingType)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">حالة السكن الحالية</p>
                    <p className="text-sm">{renderValue(orphan.family.housingCondition)}</p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">تفاصيل عنوان السكن والحي</p>
                    <p className="text-sm">{renderValue(orphan.family.addressDetail)}</p>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: Death details */}
              <TabsContent value="orphanhood" className="space-y-4 outline-none">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <AlertCircle className="h-4 w-4 text-emerald-500" />
                  بيانات الوفاة وتصنيف اليتم
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">تصنيف اليتم</p>
                    <p className="text-sm font-bold text-emerald-700">
                      {translateOrphanType(orphan.orphanType)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">اسم الأم بالكامل</p>
                    <p className="text-sm font-bold">{renderValue(orphan.motherName)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ وفاة الأب</p>
                    <p className="text-sm tabular-nums">{orphan.fatherDeathDate ? formatDate(orphan.fatherDeathDate) : renderValue(null)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">سبب وفاة الأب</p>
                    <p className="text-sm">{renderValue(orphan.fatherDeathCause)}</p>
                  </div>
                  {(orphan.orphanType === "MOTHER" || orphan.orphanType === "BOTH") && (
                    <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                      <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ وفاة الأم</p>
                      <p className="text-sm tabular-nums">{orphan.motherDeathDate ? formatDate(orphan.motherDeathDate) : renderValue(null)}</p>
                    </div>
                  )}
                </div>

                <Separator className="my-2 bg-slate-800" />
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  ملاحظات وتفاصيل إضافية
                </h4>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                  <p className="text-xs text-gray-400 font-semibold mb-1">ملاحظات البحث الاجتماعي الميداني</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{renderValue(orphan.notes, "لا توجد ملاحظات إضافية")}</p>
                </div>
              </TabsContent>

              {/* TAB 4: Financial & Verification */}
              <TabsContent value="financial" className="space-y-4 outline-none">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  الحساب المالي وحالة المراجعة
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
                    <p className="text-xs text-emerald-600 font-semibold mb-1">حساب الكريمي (Kuraimi Account)</p>
                    <p className="text-sm font-mono font-bold text-emerald-100 tabular-nums">{renderValue(orphan.kuraimiAccount)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">حالة مراجعة الملف وتدقيقه</p>
                    <p className="text-sm">
                      {orphan.verificationStatus === "APPROVED" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0">معتمد ومقبول</Badge>
                      ) : orphan.verificationStatus === "REJECTED" ? (
                        <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-0">مرفوض</Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-0">قيد التحقق</Badge>
                      )}
                    </p>
                  </div>
                  {orphan.verificationStatus === "REJECTED" && orphan.rejectionReason && (
                    <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 col-span-1 sm:col-span-2">
                      <p className="text-xs text-red-400 font-semibold mb-1">سبب الرفض والإرجاع</p>
                      <p className="text-sm font-semibold text-red-200">{orphan.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <Separator className="my-2 bg-slate-800" />
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />
                  بيانات الكفالة والمانحين
                </h4>

                {orphan.sponsorships.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-400 space-y-1">
                    <p className="text-sm font-semibold">هذا اليتيم غير مكفول حالياً</p>
                    <p className="text-xs text-gray-400">الملف جاهز للربط مع الكفلاء.</p>
                  </div>
                ) : (
                  orphan.sponsorships.map((spons) => (
                    <div key={spons.id} className="rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">اسم الكافل (المتبرع)</p>
                          <p className="text-sm font-bold text-slate-100">{spons.sponsor.fullName}</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0">نشطة</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">قيمة الكفالة</p>
                          <p className="text-sm font-bold text-emerald-600 tabular-nums">
                            {Number(spons.amount).toLocaleString("ar-SA")} {spons.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">دورة الدفع</p>
                          <p className="text-sm">{translatePaymentCycle(spons.paymentCycle)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">بلد الكافل</p>
                          <p className="text-sm flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5 text-gray-400" />
                            {renderValue(spons.sponsorCountry || spons.sponsor.country)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* === TAB 5: CASE ACTIVITIES === */}
              <TabsContent value="activities" className="space-y-4 outline-none">
                <CaseActivityTab beneficiaryId={orphan.id} />
              </TabsContent>

              {/* === TAB 6: AUDIT LOGS === */}
              <TabsContent value="audit" className="space-y-4 outline-none">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                  <FileText className="h-4.5 w-4.5 text-emerald-600" />
                  سجل التغييرات وتدقيق البيانات التاريخي
                </h4>
                <AuditTimeline entityType="BENEFICIARY" entityId={orphan.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Review Action Panel for Admin */}
        {orphan.verificationStatus === "PENDING" && onApprove && onReject && (
          <div className="border-t border-slate-800 bg-slate-950/90 backdrop-blur-md p-4 flex-shrink-0 flex flex-col gap-3 text-right" dir="rtl">
            {!isRejecting ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={async () => {
                    setIsSubmittingAction(true)
                    try {
                      const res = await onApprove(orphan.id)
                      if (res?.success) {
                        onOpenChange(false)
                      }
                    } catch (err) {
                      console.error(err)
                    } finally {
                      setIsSubmittingAction(false)
                    }
                  }}
                  disabled={isSubmittingAction}
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all duration-300 py-5 active:scale-[0.98]"
                >
                  {isSubmittingAction ? "جاري الاعتماد..." : "اعتماد وقبول الطلب"}
                </Button>
                <Button
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmittingAction}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-all duration-300 px-6 py-5 active:scale-[0.98]"
                >
                  رفض وإرجاع
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-red-400">الرجاء إدخال سبب الرفض/الإرجاع للمسوق:</p>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="مثال: يرجى رفع صورة واضحة لشهادة الميلاد..."
                  className="w-full h-20 rounded-xl bg-slate-900/60 border border-red-500/20 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 p-3 text-xs text-white text-right resize-none placeholder-slate-500"
                />
                <div className="flex items-center gap-3">
                  <Button
                    onClick={async () => {
                      if (!rejectionReasonInput.trim()) return
                      setIsSubmittingAction(true)
                      try {
                        const res = await onReject(orphan.id, rejectionReasonInput)
                        if (res?.success) {
                          onOpenChange(false)
                          setIsRejecting(false)
                          setRejectionReasonInput("")
                        }
                      } catch (err) {
                        console.error(err)
                      } finally {
                        setIsSubmittingAction(false)
                      }
                    }}
                    disabled={isSubmittingAction || !rejectionReasonInput.trim()}
                    className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all duration-300 py-5 active:scale-[0.98]"
                  >
                    {isSubmittingAction ? "جاري الحفظ..." : "تأكيد الرفض والإرجاع"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsRejecting(false)
                      setRejectionReasonInput("")
                    }}
                    disabled={isSubmittingAction}
                    className="rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 px-6 py-5"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
