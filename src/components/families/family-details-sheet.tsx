"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  User,
  MapPin,
  Home as HomeIcon,
  ShieldAlert,
  Calendar,
  Phone,
  FileText,
  Users,
  CreditCard,
  Briefcase,
  DollarSign,
  Info,
  Paperclip,
  Eye,
  Download,
} from "lucide-react"
import { AuditTimeline } from "@/components/dashboard/audit-timeline"
import { CaseActivityTab } from "@/components/shared/case-activity-tab"
import { getFamilyAttachments } from "@/app/actions/attachment-actions"

// =============================================================================
// HELPERS
// =============================================================================

function calculateAge(birthdate: Date | string | null): number | null {
  if (!birthdate) return null
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("en-GB")
}

function getPovertyBadge(level: string | null) {
  switch (level) {
    case "SEVERE":
      return <Badge className="badge-premium-rose">فقر شديد</Badge>
    case "MEDIUM":
      return <Badge className="badge-premium-orange">فقر متوسط</Badge>
    case "LOW":
      return <Badge className="badge-premium-emerald">فقر منخفض</Badge>
    default:
      return <span className="text-slate-400 text-xs italic">غير محدد</span>
  }
}

function getCategoryBadge(category: string) {
  switch (category) {
    case "ORPHAN":
      return <Badge className="badge-premium-blue">يتيم</Badge>
    case "STUDENT":
      return <Badge className="badge-premium-emerald">طالب علم</Badge>
    case "PATIENT":
      return <Badge className="badge-premium-rose">مريض</Badge>
    default:
      return <Badge className="badge-premium-orange">عام</Badge>
  }
}

interface FamilyDetailsSheetProps {
  family: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FamilyDetailsSheet({ family, open, onOpenChange }: FamilyDetailsSheetProps) {
  const [attachments, setAttachments] = useState<any[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)

  useEffect(() => {
    if (family && open) {
      setLoadingAttachments(true)
      getFamilyAttachments(family.id).then(res => {
        if (res.success && res.attachments) {
          setAttachments(res.attachments)
        }
        setLoadingAttachments(false)
      })
    } else {
      setAttachments([])
    }
  }, [family, open])

  if (!family) return null

  const headAge = family.headAge || calculateAge(family.headBirthdate)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-3xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl"
      >
        {/* --- Top Decorative Header --- */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 to-teal-700 p-5 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100 bg-white/10 px-2 py-0.5 rounded">
                  ملف الأسرة المستفيدة الشامل
                </span>
                <SheetTitle className="text-white text-base font-bold md:text-lg mt-1">
                  {family.headFullName} {family.headLastName || ""}
                </SheetTitle>
              </div>
            </div>
            <SheetDescription className="text-emerald-100 text-xs mt-2 font-medium">
              الرقم الوطني للأسرة: {family.headNationalId}
            </SheetDescription>
          </div>
        </div>

        {/* --- Tab Contents (Scrollable Container) --- */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="head" className="w-full flex flex-col h-full">
            <TabsList className="bg-slate-900/60 border border-border/60 rounded-xl p-1 mb-6 flex-shrink-0 grid grid-cols-7 gap-1 w-full justify-between h-auto">
              <TabsTrigger value="head" className="text-[10px] py-1.5 px-2 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                رب الأسرة
              </TabsTrigger>
              <TabsTrigger value="spouse" className="text-[10px] py-1.5 px-2 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                الزوجة والأفراد
              </TabsTrigger>
              <TabsTrigger value="housing" className="text-[10px] py-1.5 px-2 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                السكن والنزوح
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-[10px] py-1.5 px-2 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                المالية والمعيشة
              </TabsTrigger>
              <TabsTrigger value="referrer" className="text-[10px] py-1.5 px-2 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                المعرف والوصي
              </TabsTrigger>
              <TabsTrigger value="attachments" className="text-[10px] py-1.5 px-2 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                المرفقات والوثائق
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-[10px] py-1.5 px-2 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                الزيارات والحركة
              </TabsTrigger>
            </TabsList>

            <div className="flex-1">
              
              {/* === TAB 1: HEAD OF HOUSEHOLD === */}
              <TabsContent value="head" className="space-y-6 outline-none">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-400" />
                    بيانات الهوية والاتصال الشخصية
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">اسم رب الأسرة الكامل</span>
                      <span className="text-xs font-bold text-white">{family.headFullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">اللقب</span>
                      <span className="text-xs font-bold text-white">{family.headLastName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">رقم الهوية / الجواز</span>
                      <span className="text-xs font-bold text-white font-mono">{family.headNationalId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">نوع الهوية</span>
                      <span className="text-xs font-bold text-white">{family.headIdType || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">مكان الإصدار</span>
                      <span className="text-xs font-bold text-white">{family.headIdIssuePlace || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">تاريخ الإصدار</span>
                      <span className="text-xs font-bold text-white">{family.headIdIssueDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">تاريخ الميلاد</span>
                      <span className="text-xs font-bold text-white">{formatDate(family.headBirthdate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">العمر</span>
                      <span className="text-xs font-bold text-white">{headAge ? `${headAge} سنة` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">الجنس</span>
                      <span className="text-xs font-bold text-white">{family.headGender === "MALE" ? "ذكر" : "أنثى"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">الحالة الاجتماعية</span>
                      <span className="text-xs font-bold text-white">{family.socialStatus || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">المستوى التعليمي</span>
                      <span className="text-xs font-bold text-white">{family.headEducationLevel || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">المهنة الحالية</span>
                      <span className="text-xs font-bold text-white">{family.headOccupation || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">رقم الجوال الأساسي</span>
                      <span className="text-xs font-bold text-white font-mono">{family.headPhoneNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">رقم الجوال البديل</span>
                      <span className="text-xs font-bold text-white font-mono">{family.headAltPhone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">رقم الواتساب</span>
                      <span className="text-xs font-bold text-white font-mono">{family.headWhatsApp || "—"}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 2: SPOUSE AND MEMBERS === */}
              <TabsContent value="spouse" className="space-y-6 outline-none">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-400" />
                    بيانات الزوجة الرئيسية
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">اسم الزوجة الرباعي</span>
                      <span className="text-xs font-bold text-white">{family.spouseName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">رقم هوية الزوجة</span>
                      <span className="text-xs font-bold text-white font-mono">{family.spouseIdNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">نوع هوية الزوجة</span>
                      <span className="text-xs font-bold text-white">{family.spouseIdType || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">تاريخ ميلاد الزوجة</span>
                      <span className="text-xs font-bold text-white">{formatDate(family.spouseBirthdate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">عمر الزوجة</span>
                      <span className="text-xs font-bold text-white">{family.spouseAge ? `${family.spouseAge} سنة` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">المستوى التعليمي للزوجة</span>
                      <span className="text-xs font-bold text-white">{family.spouseEducationLevel || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">هل توجد زوجة أخرى؟</span>
                      <span className="text-xs font-bold text-white">{family.hasAnotherSpouse ? "نعم" : "لا"}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-2 border-border/40" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-emerald-400" />
                    بيانات وإحصائيات أفراد الأسرة
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">إجمالي الأفراد (مع الزوجين)</span>
                      <span className="text-xs font-bold text-white">{family.manualMembersCount || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">عدد الذكور</span>
                      <span className="text-xs font-bold text-white">{family.manualMalesCount || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">عدد الإناث</span>
                      <span className="text-xs font-bold text-white">{family.manualFemalesCount || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">أطفال (أقل من 5 سنوات)</span>
                      <span className="text-xs font-bold text-white">{family.kidsUnder5Count || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">أطفال (5 - 17 سنة)</span>
                      <span className="text-xs font-bold text-white">{family.kids5To17Count || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">بالغين (18 - 59 سنة)</span>
                      <span className="text-xs font-bold text-white">{family.adults18To59Count || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">كبار السن (60 سنة فما فوق)</span>
                      <span className="text-xs font-bold text-white">{family.elderlyAbove60Count || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">عدد ذوي الاحتياجات الخاصة</span>
                      <span className="text-xs font-bold text-white">{family.specialNeedsCount || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">نوع الإعاقة / الأمراض المزمنة للأسرة</span>
                      <span className="text-xs font-bold text-white">{family.disabilityType || "—"}</span>
                    </div>
                  </div>
                </div>

                {family.members && family.members.length > 0 && (
                  <>
                    <Separator className="my-2 border-border/40" />
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-emerald-400" />
                        قائمة التابعين المسجلين كأعضاء للأسرة ({family.members.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {family.members.map((m: any) => (
                          <div key={m.id} className="grid grid-cols-4 gap-4 rounded-xl border border-border/60 bg-slate-900/40 p-3 text-right text-xs">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">اسم العضو الكامل</span>
                              <span className="text-xs font-bold text-white block truncate">{m.fullName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">تاريخ الميلاد</span>
                              <span className="text-xs font-bold text-white block">{formatDate(m.birthdate)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">الجنس</span>
                              <span className="text-xs font-bold text-white block">{m.gender === "MALE" ? "ذكر" : "أنثى"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">صلة القرابة برب الأسرة</span>
                              <span className="text-xs font-bold text-white block">{m.relationshipToHead || "—"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* === TAB 3: HOUSING & DISPLACEMENT === */}
              <TabsContent value="housing" className="space-y-6 outline-none">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    تفاصيل السكن والخدمات
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">المحافظة</span>
                      <span className="text-xs font-bold text-white">{family.subDistrict?.district?.governorate?.nameAr || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">المديرية</span>
                      <span className="text-xs font-bold text-white">{family.subDistrict?.district?.nameAr || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">العزلة / المنطقة</span>
                      <span className="text-xs font-bold text-white">{family.subDistrict?.nameAr || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">القرية / الحارة</span>
                      <span className="text-xs font-bold text-white">{family.addressDetail || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">أقرب معلم بارز للعنوان</span>
                      <span className="text-xs font-bold text-white">{family.nearestLandmark || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">نوع السكن</span>
                      <span className="text-xs font-bold text-white">{family.housingType || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">حالة السكن</span>
                      <span className="text-xs font-bold text-white">{family.housingCondition || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">الإيجار الشهري</span>
                      <span className="text-xs font-bold text-white font-mono">{family.rentAmount ? `${family.rentAmount} ريال` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">مصدر المياه الرئيسي</span>
                      <span className="text-xs font-bold text-white">{family.waterSource || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">مصدر الإضاءة الرئيسي</span>
                      <span className="text-xs font-bold text-white">{family.electricitySource || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">ملاحظات سكنية</span>
                      <span className="text-xs font-bold text-white">{family.housingNotes || "—"}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-2 border-border/40" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-emerald-400" />
                    بيانات النزوح
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">هل الأسرة نازحة؟</span>
                      <span className="text-xs font-bold text-white">{family.isDisplaced ? "نعم" : "لا"}</span>
                    </div>
                    {family.isDisplaced && (
                      <>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">محافظة النزوح الأصلية</span>
                          <span className="text-xs font-bold text-white">{family.displacementGov || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">مديرية النزوح الأصلية</span>
                          <span className="text-xs font-bold text-white">{family.displacementDist || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">تاريخ النزوح</span>
                          <span className="text-xs font-bold text-white">{family.displacementDate || "—"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">سبب النزوح الرئيسي</span>
                          <span className="text-xs font-bold text-white">{family.displacementReason || "—"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 4: FINANCIAL === */}
              <TabsContent value="financial" className="space-y-6 outline-none">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-emerald-400" />
                    الوضع الاقتصادي ومستوى الفقر
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">تصنيف فقر الأسرة</span>
                      <div>{getPovertyBadge(family.povertyLevel)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">درجة الهشاشة (التقييم التلقائي)</span>
                      <span className="text-xs font-bold text-white font-mono">{family.vulnerabilityScore}/100</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">مصدر الدخل الرئيسي</span>
                      <span className="text-xs font-bold text-white">{family.notes || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">متوسط الدخل الشهري للأسرة</span>
                      <span className="text-xs font-bold text-white font-mono">{family.monthlyIncome ? `${family.monthlyIncome.toLocaleString()} ريال` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">هل الأسرة تعول أيتام؟</span>
                      <span className="text-xs font-bold text-white">{family.hasOrphans ? `نعم (${family.orphansCount} أيتام)` : "لا"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">هل تعول الأسرة أرملة؟</span>
                      <span className="text-xs font-bold text-white">{family.hasWidow ? "نعم" : "لا"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">هل يوجد بالأسرة شخص بلا عمل؟</span>
                      <span className="text-xs font-bold text-white">{family.hasUnemployed ? "نعم" : "لا"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">أهم الاحتياجات العاجلة حالياً</span>
                      <span className="text-xs font-bold text-white text-emerald-400">{family.urgentNeeds || "—"}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-2 border-border/40" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    بيانات الاستلام المالي والصرافين
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">طريقة الاستلام المفضلة</span>
                      <span className="text-xs font-bold text-white">{family.deliveryMethod || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">رقم حساب الكريمي (يمني)</span>
                      <span className="text-xs font-bold text-white font-mono">{family.kuraimiAccountYemeni || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">رقم حساب الكريمي (سعودي)</span>
                      <span className="text-xs font-bold text-white font-mono">{family.kuraimiAccountSaudi || "—"}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-2 border-border/40" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-emerald-400" />
                    المساعدات السابقة
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">هل استلمت مساعدات سابقاً؟</span>
                      <span className="text-xs font-bold text-white">{family.receivedAidBefore ? "نعم" : "لا"}</span>
                    </div>
                    {family.receivedAidBefore && (
                      <>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">الجهة المانحة</span>
                          <span className="text-xs font-bold text-white">{family.aidDonor || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">نوع المساعدة</span>
                          <span className="text-xs font-bold text-white">{family.aidType || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">تاريخ آخر مساعدة</span>
                          <span className="text-xs font-bold text-white">{family.lastAidDate || "—"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 5: REFERRER AND GUARDIAN === */}
              <TabsContent value="referrer" className="space-y-6 outline-none">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-emerald-400" />
                    بيانات المعرّف الاجتماعي
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">اسم المعرّف الرباعي</span>
                      <span className="text-xs font-bold text-white">{family.referrerName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">صلة القرابة / العلاقة</span>
                      <span className="text-xs font-bold text-white">{family.referrerRelation || "—"}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-2 border-border/40" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-emerald-400" />
                    بيانات الوصي الاجتماعي للأسرة (البديل)
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">اسم الوصي الكامل</span>
                      <span className="text-xs font-bold text-white">{family.guardianName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">صلة القرابة برب الأسرة</span>
                      <span className="text-xs font-bold text-white">{family.guardianRelation || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">رقم هاتف الوصي</span>
                      <span className="text-xs font-bold text-white font-mono">{family.guardianPhone || "—"}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 6: ATTACHMENTS & DOCUMENTS === */}
              <TabsContent value="attachments" className="space-y-6 outline-none animate-in fade-in duration-300">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-emerald-400" />
                    المستندات والوثائق المرفقة الرسمية للأسرة
                  </h4>

                  {loadingAttachments ? (
                    <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
                      جاري تحميل الملفات...
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-border rounded-xl">
                      لا توجد أية وثائق أو مرفقات رسمية مسجلة لهذه الأسرة حالياً.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-900/40 p-4 transition-all hover:bg-slate-900/60">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 border border-border">
                              <FileText className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="text-right font-medium">
                              <span className="text-xs font-bold text-white block truncate max-w-[280px]">
                                {att.fileName}
                              </span>
                              <span className="text-[10px] text-emerald-400 block mt-0.5 font-semibold">
                                {att.documentType === "NATIONAL_ID" ? "صورة الهوية للزوج والزوجة" : att.documentType === "MEDICAL_REPORT" ? "تقارير طبية" : "كرت العائلة / أخرى"}
                              </span>
                              {att.description && (
                                <span className="text-[10px] text-slate-500 block truncate max-w-[280px] mt-0.5">
                                  {att.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-800 text-slate-300 border border-border/40 text-[10px] font-mono font-normal">
                              {(att.sizeBytes ? (att.sizeBytes / 1024).toFixed(1) : 0)} KB
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80"
                            >
                              <a href={att.fileUrl} target="_blank" rel="noreferrer" download>
                                <Download className="h-4.5 w-4.5" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80"
                            >
                              <a href={att.fileUrl} target="_blank" rel="noreferrer">
                                <Eye className="h-4.5 w-4.5" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* === TAB 7: TIMELINE & AUDITS === */}
              <TabsContent value="timeline" className="space-y-6 outline-none">
                <Tabs defaultValue="actions-log" className="w-full">
                  <TabsList className="bg-slate-900/40 p-1 mb-4 flex gap-1 rounded-lg w-fit border border-border/40">
                    <TabsTrigger value="actions-log" className="text-[11px] py-1 px-3 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-400">
                      الزيارات الميدانية
                    </TabsTrigger>
                    <TabsTrigger value="audit-log" className="text-[11px] py-1 px-3 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-400">
                      سجل الحركة والتغييرات
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="actions-log">
                    <CaseActivityTab familyId={family.id} />
                  </TabsContent>
                  <TabsContent value="audit-log">
                    <AuditTimeline entityType="FAMILY" entityId={family.id} />
                  </TabsContent>
                </Tabs>
              </TabsContent>

            </div>
          </Tabs>
        </div>

        {/* --- Footer Panel --- */}
        <div className="p-4 border-t border-border flex-shrink-0 flex items-center justify-between bg-slate-950/80">
          <div className="text-[10px] text-slate-400 font-medium">
            تاريخ التسجيل: {formatDate(family.createdAt)}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-xs font-semibold border border-border/60 transition-all"
          >
            إغلاق النافذة
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
