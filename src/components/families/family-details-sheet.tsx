"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  Heart,
} from "lucide-react"
import { AuditTimeline } from "@/components/dashboard/audit-timeline"
import { CaseActivityTab } from "@/components/shared/case-activity-tab"

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
  return new Date(date).toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
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
  if (!family) return null

  const headAge = calculateAge(family.headBirthdate)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl"
      >
        {/* --- Top Decorative Header --- */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 to-teal-700 p-6 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100 bg-white/10 px-2 py-0.5 rounded">
                  ملف الأسرة
                </span>
                <SheetTitle className="text-white text-lg font-bold md:text-xl mt-1">
                  {family.headFullName}
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
            <TabsList className="bg-slate-900/60 border border-border/60 rounded-xl p-1 mb-6 flex-shrink-0 gap-1 w-full justify-between flex-wrap h-auto">
              <TabsTrigger value="head" className="text-xs py-1.5 px-2.5 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                <User className="h-3.5 w-3.5 ml-1.5" />
                رب الأسرة والعنوان
              </TabsTrigger>
              <TabsTrigger value="assessment" className="text-xs py-1.5 px-2.5 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                <HomeIcon className="h-3.5 w-3.5 ml-1.5" />
                التقييم المعيشي
              </TabsTrigger>
              <TabsTrigger value="guardian" className="text-xs py-1.5 px-2.5 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                <ShieldAlert className="h-3.5 w-3.5 ml-1.5" />
                الوصي وملاحظات
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs py-1.5 px-2.5 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                <Users className="h-3.5 w-3.5 ml-1.5" />
                الأفراد ({family.members?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="activities" className="text-xs py-1.5 px-2.5 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                <Calendar className="h-3.5 w-3.5 ml-1.5" />
                الزيارات الميدانية
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs py-1.5 px-2.5 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                <FileText className="h-3.5 w-3.5 ml-1.5" />
                سجل الحركة
              </TabsTrigger>
            </TabsList>

            <div className="flex-1">
              {/* === TAB 1: HEAD OF HOUSEHOLD & ADDRESS === */}
              <TabsContent value="head" className="space-y-6 outline-none">
                {/* Personal Info Grid */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="h-4.5 w-4.5 text-emerald-400" />
                    بيانات الهوية والاتصال
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">اسم رب الأسرة</span>
                      <span className="text-sm font-bold text-white">{family.headFullName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">الرقم الوطني للرب</span>
                      <span className="text-sm font-bold text-white font-mono">{family.headNationalId}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">الجنس</span>
                      <span className="text-sm font-bold text-white">
                        {family.headGender === "MALE" ? "ذكر" : "أنثى"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">العمر</span>
                      <span className="text-sm font-bold text-white">
                        {headAge !== null ? `${headAge} سنة` : <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">تاريخ الميلاد</span>
                      <span className="text-sm font-bold text-white">{formatDate(family.headBirthdate)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">رقم الهاتف</span>
                      <span className="text-sm font-bold text-white font-mono">
                        {family.headPhoneNumber || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">رقم هاتف بديل</span>
                      <span className="text-sm font-bold text-white font-mono">
                        {family.headAltPhone || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-2 border-border/40" />

                {/* Address Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="h-4.5 w-4.5 text-emerald-400" />
                    العنوان الجغرافي بالتفصيل
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">المحافظة</span>
                      <span className="text-sm font-bold text-white">
                        {family.subDistrict?.district?.governorate?.nameAr || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">المديرية</span>
                      <span className="text-sm font-bold text-white">
                        {family.subDistrict?.district?.nameAr || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">العزلة / الحي السكني</span>
                      <span className="text-sm font-bold text-white">
                        {family.subDistrict?.nameAr || "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">تفاصيل العنوان (القرية/الشارع)</span>
                      <span className="text-sm font-bold text-white">
                        {family.addressDetail || <span className="text-slate-500 text-xs italic">لا توجد تفاصيل إضافية</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 2: LIVING ASSESSMENT === */}
              <TabsContent value="assessment" className="space-y-6 outline-none">
                {/* Vulnerability Score Card */}
                <div className="bg-slate-900 text-white rounded-xl p-5 relative overflow-hidden shadow-md border border-border/60">
                  <div className="absolute -left-5 -top-5 h-20 w-20 rounded-full bg-white/5" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-300">درجة الهشاشة المعيشية</span>
                      <p className="text-3xl font-extrabold text-white mt-1 tabular-nums">
                        {family.vulnerabilityScore !== null ? `${family.vulnerabilityScore}/100` : "-"}
                      </p>
                    </div>
                    <div className="w-24">
                      {/* Radial progress simulator or simply standard visualization */}
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${family.vulnerabilityScore || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block text-left mt-1">
                        تقييم الباحث الميداني
                      </span>
                    </div>
                  </div>
                </div>

                {/* Living details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <HomeIcon className="h-4.5 w-4.5 text-emerald-400" />
                    تفاصيل الحالة المعيشية
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">مستوى الفقر المعيشي</span>
                      <div className="mt-1">{getPovertyBadge(family.povertyLevel)}</div>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">الدخل الشهري التقريبي</span>
                      <span className="text-sm font-bold text-white tabular-nums">
                        {family.monthlyIncome !== null ? (
                          `${family.monthlyIncome.toLocaleString("ar-YE")} ريال`
                        ) : (
                          <span className="text-slate-500 text-xs italic">غير مدخل</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">نوع السكن</span>
                      <span className="text-sm font-bold text-white">
                        {family.housingType || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">حالة السكن البنائية</span>
                      <span className="text-sm font-bold text-white">
                        {family.housingCondition || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">عدد أفراد الأسرة</span>
                      <span className="text-sm font-bold text-white tabular-nums">
                        {family.familyMembersCount !== null ? (
                          `${family.familyMembersCount} أفراد`
                        ) : (
                          <span className="text-slate-500 text-xs italic">غير مدخل</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 3: GUARDIAN & SOCIAL NOTES === */}
              <TabsContent value="guardian" className="space-y-6 outline-none">
                {/* Guardian Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-emerald-400" />
                    بيانات الوصي (في حال تعذر تواصل رب الأسرة)
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                    <div className="col-span-2">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">اسم الوصي الكامل</span>
                      <span className="text-sm font-bold text-white">
                        {family.guardianName || <span className="text-slate-500 text-xs italic">لا يوجد وصي مضاف</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">صلة القرابة برب الأسرة</span>
                      <span className="text-sm font-bold text-white">
                        {family.guardianRelation || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">رقم هاتف الوصي</span>
                      <span className="text-sm font-bold text-white font-mono">
                        {family.guardianPhone || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-2 border-border/40" />

                {/* Research Notes */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-emerald-400" />
                    ملاحظات البحث الاجتماعي الميداني
                  </h4>
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-border/60 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                    {family.notes || "لا توجد أي ملاحظات اجتماعية مسجلة لهذه الأسرة حتى الآن."}
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 4: FAMILY MEMBERS LIST === */}
              <TabsContent value="members" className="space-y-4 outline-none">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="h-4.5 w-4.5 text-emerald-400" />
                    أفراد الأسرة المسجلين كمستفيدين
                  </h4>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    إجمالي الأفراد: {family.members?.length || 0}
                  </Badge>
                </div>

                {family.members && family.members.length > 0 ? (
                  <div className="overflow-hidden border border-border/60 rounded-xl bg-slate-900/20">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900/40 text-slate-300 font-bold border-b border-border/60">
                        <tr>
                          <th className="p-3">الاسم الكامل</th>
                          <th className="p-3">الجنس</th>
                          <th className="p-3">العمر</th>
                          <th className="p-3">الفئة والتصنيف</th>
                          <th className="p-3 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-slate-300">
                        {family.members.map((member: any) => {
                          const age = calculateAge(member.birthdate)
                          return (
                            <tr key={member.id} className="hover:bg-slate-800/30">
                              <td className="p-3 font-semibold text-white">{member.fullName}</td>
                              <td className="p-3">{member.gender === "MALE" ? "ذكر" : "أنثى"}</td>
                              <td className="p-3 tabular-nums">{age !== null ? `${age} سنة` : "-"}</td>
                              <td className="p-3">{getCategoryBadge(member.category)}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`inline-flex h-2 w-2 rounded-full ${
                                    member.isActive ? "bg-emerald-500" : "bg-red-400"
                                  }`}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-border/60">
                    <Users className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs">لا يوجد مستفيدين (أيتام أو طلاب) مرتبطين بملف الأسرة حالياً.</p>
                  </div>
                )}
              </TabsContent>

              {/* === TAB 5: CASE ACTIVITIES === */}
              <TabsContent value="activities" className="space-y-4 outline-none">
                <CaseActivityTab familyId={family.id} />
              </TabsContent>

              {/* === TAB 6: AUDIT LOGS === */}
              <TabsContent value="audit" className="space-y-4 outline-none">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                  <FileText className="h-4.5 w-4.5 text-emerald-400" />
                  سجل التغييرات وتدقيق البيانات التاريخي
                </h4>
                <AuditTimeline entityType="FAMILY" entityId={family.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* --- Footer Panel --- */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between bg-gray-50/50">
          <div className="text-[10px] text-gray-400 font-medium">
            تاريخ التسجيل: {formatDate(family.createdAt)}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 hover:bg-gray-900 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-sm transition-all"
          >
            إغلاق النافذة
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
