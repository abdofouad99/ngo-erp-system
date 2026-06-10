"use client"

import {
  Baby,
  Heart,
  User,
  GraduationCap,
  Home as HomeIcon,
  CreditCard,
  Phone,
  FileText,
  Activity,
  AlertCircle,
  Globe,
  Calendar,
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
  gender: string
  birthdate: Date
  nationalId: string | null
  category: string
  orphanCode: string | null
  kuraimiAccount: string | null
  educationLevel: string | null
  schoolName: string | null
  educationalStage: string | null
  averageGrade: number | null
  educationalNeeds: string | null
  healthStatus: string | null
  disabilityType: string | null
  disability: boolean
  disabilityDetails: string | null
  orphanType: string | null
  fatherDeathDate: Date | null
  fatherDeathCause: string | null
  motherDeathDate: Date | null
  motherName: string | null
  verificationStatus: string
  verifiedBy: string | null
  isActive: boolean
  notes: string | null
  family: Family
  sponsorships: Sponsorship[]
}

interface OrphanDetailsSheetProps {
  orphan: Orphan | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function OrphanDetailsSheet({ orphan, open, onOpenChange }: OrphanDetailsSheetProps) {
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
        className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-white text-right border-r border-gray-100 shadow-2xl"
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
            <TabsList className="bg-gray-100/80 rounded-xl p-1 mb-4 flex-shrink-0 gap-1 flex-wrap h-auto">
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
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الرقم الوطني / شهادة الميلاد</p>
                    <p className="text-sm font-mono tabular-nums">{renderValue(orphan.nationalId)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الجنس</p>
                    <p className="text-sm font-semibold">
                      {orphan.gender === "MALE" ? "ذكر" : "أنثى"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ الميلاد</p>
                    <p className="text-sm tabular-nums">{formatDate(orphan.birthdate)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">العمر الحالي</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      {calculateAge(orphan.birthdate).toLocaleString("ar-SA")} سنة
                    </p>
                  </div>
                </div>

                <Separator className="my-2 bg-gray-100" />
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                  <GraduationCap className="h-4 w-4 text-emerald-500" />
                  المسار التعليمي والتحصيل الدراسي
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">المرحلة الدراسية</p>
                    <p className="text-sm">{renderValue(orphan.educationalStage)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">اسم المدرسة</p>
                    <p className="text-sm">{renderValue(orphan.schoolName)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">المعدل الدراسي (الدرجة)</p>
                    <p className="text-sm font-semibold text-blue-600 tabular-nums">
                      {orphan.averageGrade !== null ? `${orphan.averageGrade.toLocaleString("ar-SA")}%` : renderValue(null)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الاحتياجات والمستلزمات التعليمية</p>
                    <p className="text-sm">{renderValue(orphan.educationalNeeds)}</p>
                  </div>
                </div>

                <Separator className="my-2 bg-gray-100" />
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                  <Activity className="h-4 w-4 text-rose-500" />
                  الحالة الصحية والاحتياجات الخاصة
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الحالة الصحية العامة</p>
                    <p className="text-sm">{renderValue(orphan.healthStatus, "سليم / طبيعي")}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
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
                    <div className="col-span-2 rounded-xl border border-red-50 bg-red-50/10 p-3.5">
                      <p className="text-xs text-red-600 font-semibold mb-1">تفاصيل الإعاقة والاحتياج</p>
                      <p className="text-sm text-red-950 font-semibold">{orphan.disabilityDetails}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: Family & Guardian */}
              <TabsContent value="family" className="space-y-4 outline-none">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                  <User className="h-4 w-4 text-emerald-500" />
                  بيانات الوصي والمسؤول القانوني
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">اسم الوصي</p>
                    <p className="text-sm font-bold">{renderValue(orphan.family.guardianName)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">صلة القرابة</p>
                    <p className="text-sm">{renderValue(orphan.family.guardianRelation)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">رقم هاتف الوصي</p>
                    <p className="text-sm font-mono tabular-nums">{renderValue(orphan.family.guardianPhone)}</p>
                  </div>
                </div>

                <Separator className="my-2 bg-gray-100" />
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                  <HomeIcon className="h-4 w-4 text-emerald-500" />
                  حالة الأسرة والظروف المعيشية
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">رب الأسرة</p>
                    <p className="text-sm">{renderValue(orphan.family.headFullName)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">عدد أفراد الأسرة</p>
                    <p className="text-sm tabular-nums font-semibold">
                      {orphan.family.familyMembersCount !== null ? `${orphan.family.familyMembersCount.toLocaleString("ar-SA")} أفراد` : renderValue(null)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
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
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">الدخل الشهري للأسرة</p>
                    <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                      {orphan.family.monthlyIncome !== null ? formatCurrency(orphan.family.monthlyIncome) : renderValue(null)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">نوع السكن</p>
                    <p className="text-sm">{renderValue(orphan.family.housingType)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">حالة السكن الحالية</p>
                    <p className="text-sm">{renderValue(orphan.family.housingCondition)}</p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">تفاصيل عنوان السكن والحي</p>
                    <p className="text-sm">{renderValue(orphan.family.addressDetail)}</p>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: Death details */}
              <TabsContent value="orphanhood" className="space-y-4 outline-none">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                  <AlertCircle className="h-4 w-4 text-emerald-500" />
                  بيانات الوفاة وتصنيف اليتم
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">تصنيف اليتم</p>
                    <p className="text-sm font-bold text-emerald-700">
                      {translateOrphanType(orphan.orphanType)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">اسم الأم بالكامل</p>
                    <p className="text-sm font-bold">{renderValue(orphan.motherName)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ وفاة الأب</p>
                    <p className="text-sm tabular-nums">{orphan.fatherDeathDate ? formatDate(orphan.fatherDeathDate) : renderValue(null)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                    <p className="text-xs text-gray-400 font-semibold mb-1">سبب وفاة الأب</p>
                    <p className="text-sm">{renderValue(orphan.fatherDeathCause)}</p>
                  </div>
                  {(orphan.orphanType === "MOTHER" || orphan.orphanType === "BOTH") && (
                    <div className="col-span-2 rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                      <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ وفاة الأم</p>
                      <p className="text-sm tabular-nums">{orphan.motherDeathDate ? formatDate(orphan.motherDeathDate) : renderValue(null)}</p>
                    </div>
                  )}
                </div>

                <Separator className="my-2 bg-gray-100" />
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  ملاحظات وتفاصيل إضافية
                </h4>

                <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
                  <p className="text-xs text-gray-400 font-semibold mb-1">ملاحظات البحث الاجتماعي الميداني</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{renderValue(orphan.notes, "لا توجد ملاحظات إضافية")}</p>
                </div>
              </TabsContent>

              {/* TAB 4: Financial & Verification */}
              <TabsContent value="financial" className="space-y-4 outline-none">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  الحساب المالي وحالة المراجعة
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-50 bg-emerald-50/10 p-3.5">
                    <p className="text-xs text-emerald-600 font-semibold mb-1">حساب الكريمي (Kuraimi Account)</p>
                    <p className="text-sm font-mono font-bold text-emerald-950 tabular-nums">{renderValue(orphan.kuraimiAccount)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-50 bg-gray-50/30 p-3.5">
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
                </div>

                <Separator className="my-2 bg-gray-100" />
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
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
                    <div key={spons.id} className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">اسم الكافل (المتبرع)</p>
                          <p className="text-sm font-bold text-gray-900">{spons.sponsor.fullName}</p>
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
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                  <FileText className="h-4.5 w-4.5 text-emerald-600" />
                  سجل التغييرات وتدقيق البيانات التاريخي
                </h4>
                <AuditTimeline entityType="BENEFICIARY" entityId={orphan.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
