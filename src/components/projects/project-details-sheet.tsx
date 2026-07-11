"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Folder,
  Layers,
  ShoppingBag,
  DollarSign,
  Calendar,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(date: Date | string | null): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("ar-YE-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-bold px-2 py-0.5">مسودة</Badge>
    case "ACTIVE":
      return <Badge className="bg-emerald-500/15 text-emerald-450 border border-emerald-500/30 font-bold px-2 py-0.5">نشط</Badge>
    case "COMPLETED":
      return <Badge className="bg-blue-500/15 text-blue-450 border border-blue-500/30 font-bold px-2 py-0.5">مكتمل</Badge>
    case "SUSPENDED":
      return <Badge className="bg-amber-500/15 text-amber-450 border border-amber-500/30 font-bold px-2 py-0.5">موقوف مؤقتاً</Badge>
    case "CANCELLED":
      return <Badge className="bg-rose-500/15 text-rose-450 border border-rose-500/30 font-bold px-2 py-0.5">ملغى</Badge>
    default:
      return <Badge className="bg-slate-800 text-slate-350 border border-slate-700">{status}</Badge>
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case "IN_KIND":
      return "عيني (مواد عينية)"
    case "CASH":
      return "نقدي (حوالات)"
    case "MEDICAL":
      return "طبي (علاج/عمليات)"
    case "TRAINING":
      return "تمكين وتأهيل"
    default:
      return category
  }
}

interface ProjectDetailsSheetProps {
  project: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectDetailsSheet({ project, open, onOpenChange }: ProjectDetailsSheetProps) {
  if (!project) return null

  // Calculations
  const totalDeliveries = project.beneficiaryLinks?.length || 0
  const deliveredCount = project.beneficiaryLinks?.filter((link: any) => link.isDelivered).length || 0
  
  const targetCount = project.targetCount || 0
  const progressPercent = targetCount > 0 ? Math.min(Math.round((deliveredCount / targetCount) * 100), 100) : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-slate-900 shadow-2xl text-white"
      >
        {/* --- Header decoration --- */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-950/80 to-slate-950 p-6 text-white flex-shrink-0 border-b border-slate-900">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-emerald-500/5" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800">
                <Folder className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  ملف المشروع الإغاثي
                </span>
                <SheetTitle className="text-white text-lg font-bold md:text-xl mt-1">
                  {project.name}
                </SheetTitle>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800">
                {getCategoryLabel(project.category)}
              </Badge>
              {getStatusBadge(project.status)}
            </div>
          </div>
        </div>

        {/* --- Tab Contents --- */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="project" className="w-full flex flex-col h-full">
            <TabsList className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-1 mb-6 flex-shrink-0 gap-1 w-full justify-between text-slate-300">
              <TabsTrigger 
                value="project" 
                className="text-xs py-2 px-3 flex-1 transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
              >
                <Folder className="h-3.5 w-3.5 ml-1.5" />
                بيانات وجدولة المشروع
              </TabsTrigger>
              <TabsTrigger 
                value="deliveries" 
                className="text-xs py-2 px-3 flex-1 transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
              >
                <CheckCircle2 className="h-3.5 w-3.5 ml-1.5" />
                كشف المستفيدين والتسليمات ({totalDeliveries})
              </TabsTrigger>
            </TabsList>

            {/* === TAB 1: PROJECT DATA === */}
            <TabsContent value="project" className="space-y-6 outline-none">
              {/* Progress Card */}
              {targetCount > 0 && (
                <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 relative overflow-hidden shadow-lg">
                  <div className="absolute -left-5 -top-5 h-20 w-20 rounded-full bg-white/5" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400">نسبة إنجاز مستهدف المستفيدين</span>
                      <span className="text-sm font-bold text-emerald-400 tabular-nums">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>تم تسليم: {deliveredCount} مستفيد</span>
                      <span>المستهدف: {targetCount} مستفيد</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Financials & Target Grid */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
                  البيانات المالية والجدول الزمني
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">ميزانية المشروع</span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {project.budget !== null ? (
                        `${project.budget.toLocaleString("en-US")} ${project.currency}`
                      ) : (
                        <span className="text-slate-500 text-xs italic">غير مدخل</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">العدد المستهدف</span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {project.targetCount !== null ? (
                        `${project.targetCount} مستفيد`
                      ) : (
                        <span className="text-slate-500 text-xs italic">غير محدد</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">تاريخ البدء</span>
                    <span className="text-sm font-bold text-slate-200">{formatDate(project.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">تاريخ الانتهاء</span>
                    <span className="text-sm font-bold text-slate-200">{formatDate(project.endDate)}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-900 my-2" />

              {/* Description */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-emerald-400" />
                  وصف المشروع والعمل الميداني
                </h4>
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 text-slate-350 text-xs leading-relaxed whitespace-pre-wrap">
                  {project.description || "لا يوجد وصف مسجل لهذا المشروع."}
                </div>
              </div>
            </TabsContent>

            {/* === TAB 2: DELIVERIES LOG === */}
            <TabsContent value="deliveries" className="space-y-4 outline-none">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                  سجل الاستلام الميداني للمستفيدين
                </h4>
                <div className="flex gap-2">
                  <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-1 rounded-lg">
                    تم التسليم: {deliveredCount}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 font-bold px-2 py-1 rounded-lg">
                    الانتظار: {totalDeliveries - deliveredCount}
                  </span>
                </div>
              </div>

              {project.beneficiaryLinks && project.beneficiaryLinks.length > 0 ? (
                <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950/40">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">المستفيد</th>
                        <th className="p-3">الدفعة</th>
                        <th className="p-3">المادة المسلمة</th>
                        <th className="p-3">الكمية</th>
                        <th className="p-3">تاريخ التسليم</th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {project.beneficiaryLinks.map((link: any) => (
                        <tr key={link.id} className="hover:bg-slate-900/30 transition-all duration-150">
                          <td className="p-3 font-bold text-white">{link.beneficiary?.fullName || "-"}</td>
                          <td className="p-3 font-semibold text-slate-400 tabular-nums">دفعة {link.batchNumber}</td>
                          <td className="p-3">{link.deliveredItem}</td>
                          <td className="p-3 font-bold text-slate-200 tabular-nums">{link.quantity}</td>
                          <td className="p-3 font-mono text-slate-400">
                            {link.isDelivered ? formatDate(link.deliveryDate) : "-"}
                          </td>
                          <td className="p-3 text-center">
                            {link.isDelivered ? (
                              <Badge className="bg-emerald-500/15 text-emerald-450 border border-emerald-500/30 font-bold">
                                تم الاستلام
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/15 text-amber-450 border border-amber-500/30 font-bold">
                                قيد الانتظار
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                  <ShoppingBag className="h-8 w-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                  <p className="text-slate-450 text-xs">لا توجد عمليات توزيع أو تسليمات مسجلة لهذا المشروع بعد.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* --- Footer Panel --- */}
        <div className="p-4 border-t border-slate-900 flex-shrink-0 flex items-center justify-between bg-slate-950">
          <div className="text-[10px] text-slate-500 font-medium">
            تاريخ الإضافة: {formatDate(project.createdAt)}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl px-5 py-2 text-xs font-bold shadow-sm transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
          >
            إغلاق النافذة
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
