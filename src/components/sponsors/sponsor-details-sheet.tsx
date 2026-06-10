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
  User,
  Building,
  Mail,
  Phone,
  Globe,
  FileText,
  HeartHandshake,
  Calendar,
  Layers,
  Coins,
} from "lucide-react"
import { ReceiptVoucherSheet } from "./receipt-voucher-sheet"

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(date: Date | string | null): string {
  if (!date) return "مستمر"
  return new Date(date).toLocaleDateString("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-450 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold px-2 py-0.5">
          فعّالة
        </Badge>
      )
    case "PAUSED":
      return (
        <Badge className="bg-amber-500/15 text-amber-450 hover:bg-amber-500/20 border border-amber-500/30 font-bold px-2 py-0.5">
          موقوفة مؤقتاً
        </Badge>
      )
    case "STOPPED":
      return (
        <Badge className="bg-rose-500/15 text-rose-450 hover:bg-rose-500/20 border border-rose-500/30 font-bold px-2 py-0.5">
          ملغاة / منتهية
        </Badge>
      )
    default:
      return <Badge className="bg-slate-805 text-slate-350 border border-slate-700">{status}</Badge>
  }
}

function translatePaymentCycle(cycle: string) {
  switch (cycle) {
    case "MONTHLY":
      return "شهري"
    case "QUARTERLY":
      return "ربع سنوي"
    case "SEMI_ANNUAL":
      return "نصف سنوي"
    case "ANNUAL":
      return "سنوي"
    case "ONE_TIME":
      return "مرة واحدة"
    default:
      return cycle
  }
}

interface SponsorDetailsSheetProps {
  sponsor: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SponsorDetailsSheet({ sponsor, open, onOpenChange }: SponsorDetailsSheetProps) {
  if (!sponsor) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-slate-900 shadow-2xl text-white"
      >
        {/* --- Header Decoration --- */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-950/80 to-slate-950 p-6 text-white flex-shrink-0 border-b border-slate-900">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-emerald-500/5" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800">
                <HeartHandshake className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  ملف الكفيل
                </span>
                <SheetTitle className="text-white text-lg font-bold md:text-xl mt-1">
                  {sponsor.fullName}
                </SheetTitle>
              </div>
            </div>
            {sponsor.organization && (
              <SheetDescription className="text-slate-400 text-xs mt-2 font-medium">
                المنظمة/الجهة: {sponsor.organization}
              </SheetDescription>
            )}
          </div>
        </div>

        {/* --- Tabs & Content --- */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="profile" className="w-full flex flex-col h-full">
            <TabsList className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-1 mb-6 flex-shrink-0 gap-1 w-full justify-between text-slate-300">
              <TabsTrigger 
                value="profile" 
                className="text-xs py-2 px-3 flex-1 transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
              >
                <User className="h-3.5 w-3.5 ml-1.5" />
                الملف والاتصال
              </TabsTrigger>
              <TabsTrigger 
                value="sponsorships" 
                className="text-xs py-2 px-3 flex-1 transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold"
              >
                <HeartHandshake className="h-3.5 w-3.5 ml-1.5" />
                كفالات الكفيل ({sponsor.sponsorships?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* === TAB 1: SPONSOR PROFILE === */}
            <TabsContent value="profile" className="space-y-6 outline-none">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <User className="h-4.5 w-4.5 text-emerald-400" />
                  بيانات الكفيل التعريفية
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                  <div className="col-span-2">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">الاسم الكامل</span>
                    <span className="text-sm font-bold text-white">{sponsor.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">المنظمة / الجهة الراعية</span>
                    <span className="text-sm font-bold text-slate-200">
                      {sponsor.organization || <span className="text-slate-500 text-xs italic">كفيل فردي</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">الهوية الوطنية / السجل</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {sponsor.nationalId || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">دولة الإقامة</span>
                    <span className="text-sm font-bold text-slate-200">
                      {sponsor.country || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">رقم الهاتف</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {sponsor.phone || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">البريد الإلكتروني</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {sponsor.email || <span className="text-slate-500 text-xs italic">غير مدخل</span>}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-900 my-2" />

              {/* Financial Operations */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Coins className="h-4.5 w-4.5 text-emerald-400" />
                  العمليات والمدفوعات المالية
                </h4>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs text-slate-300 font-medium text-right sm:text-right">
                    يمكنك تسجيل دفعات الكفالة الصادرة من هذا الكافل، وتوليد وتنزيل سندات القبض الرسمية.
                  </div>
                  <ReceiptVoucherSheet sponsor={sponsor} />
                </div>
              </div>

              <Separator className="bg-slate-900 my-4" />

              {/* Research Notes */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-emerald-400" />
                  ملاحظات وتوجيهات الكفيل
                </h4>
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {sponsor.notes || "لا توجد ملاحظات أو شروط خاصة مسجلة لهذا الكفيل."}
                </div>
              </div>
            </TabsContent>

            {/* === TAB 2: SPONSORSHIPS LIST === */}
            <TabsContent value="sponsorships" className="space-y-4 outline-none">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <HeartHandshake className="h-4.5 w-4.5 text-emerald-400" />
                  كشوفات الكفالات المسجلة
                </h4>
                <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-1 rounded-lg">
                  إجمالي الرعايات: {sponsor.sponsorships?.length || 0}
                </span>
              </div>

              {sponsor.sponsorships && sponsor.sponsorships.length > 0 ? (
                <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950/40">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">نوع الكفالة</th>
                        <th className="p-3">المستفيد المستهدف</th>
                        <th className="p-3">المبلغ والعملة</th>
                        <th className="p-3">دورة الدفع</th>
                        <th className="p-3">تاريخ البدء</th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {sponsor.sponsorships.map((s: any) => {
                        const isOrphan = !!s.beneficiaryId
                        const targetName = isOrphan
                          ? s.beneficiary?.fullName
                          : s.family?.headFullName
                        return (
                          <tr key={s.id} className="hover:bg-slate-900/30 transition-all duration-150">
                            <td className="p-3 font-semibold">
                              {isOrphan ? (
                                <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/20 bg-blue-500/10 font-medium">يتيم فردي</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/20 bg-purple-500/10 font-medium">أسرة معيشية</Badge>
                              )}
                            </td>
                            <td className="p-3 font-bold text-white">{targetName || "-"}</td>
                            <td className="p-3 font-mono font-bold text-emerald-400 tabular-nums">
                              {s.amount.toLocaleString()} {s.currency}
                            </td>
                            <td className="p-3 font-semibold">{translatePaymentCycle(s.paymentCycle)}</td>
                            <td className="p-3 font-mono text-slate-400">{new Date(s.startDate).toLocaleDateString("ar-YE")}</td>
                            <td className="p-3 text-center">{getStatusBadge(s.status)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                  <HeartHandshake className="h-8 w-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                  <p className="text-slate-400 text-xs">لا توجد كفالات أو التزامات مالية جارية لهذا الكفيل حالياً.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* --- Footer Panel --- */}
        <div className="p-4 border-t border-slate-900 flex-shrink-0 flex items-center justify-between bg-slate-950">
          <div className="text-[10px] text-slate-500 font-medium">
            تاريخ التسجيل: {formatDate(sponsor.createdAt)}
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
