"use client"

import { useState } from "react"
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
  Stethoscope,
  Heart,
  DollarSign,
  Phone,
  Calendar,
  Users,
  Building2,
  Link2,
} from "lucide-react"

function formatDate(date: Date | string | null): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-GB")
}

function getSeverityBadge(severity: string) {
  const map: Record<string, { label: string; cls: string }> = {
    CRITICAL: { label: "🔴 حرج", cls: "bg-red-900/40 text-red-300 border-red-700/40" },
    SERIOUS: { label: "🟠 خطير", cls: "bg-orange-900/40 text-orange-300 border-orange-700/40" },
    MODERATE: { label: "🟡 متوسط", cls: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40" },
    STABLE: { label: "🟢 مستقر", cls: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40" },
  }
  const s = map[severity] || { label: severity, cls: "" }
  return <Badge className={`border text-[11px] ${s.cls}`}>{s.label}</Badge>
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "🩺 قيد العلاج", cls: "bg-blue-900/40 text-blue-300 border-blue-700/40" },
    RECOVERED: { label: "✅ تعافى", cls: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40" },
    DECEASED: { label: "⬛ متوفى", cls: "bg-slate-700/40 text-slate-400 border-slate-600/40" },
    SUSPENDED: { label: "⏸ معلق", cls: "bg-slate-700/40 text-slate-400 border-slate-600/40" },
  }
  const s = map[status] || { label: status, cls: "" }
  return <Badge className={`border text-[11px] ${s.cls}`}>{s.label}</Badge>
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">{label}</span>
      <span className="text-sm font-semibold text-slate-100">{value || "—"}</span>
    </div>
  )
}

interface PatientDetailsSheetProps {
  patient: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientDetailsSheet({ patient, open, onOpenChange }: PatientDetailsSheetProps) {
  if (!patient) return null

  const gov = patient.subDistrict?.district?.governorate?.nameAr
  const dist = patient.subDistrict?.district?.nameAr
  const sub = patient.subDistrict?.nameAr

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl"
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-l from-rose-700 to-pink-800 p-5 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-rose-100 bg-white/10 px-2 py-0.5 rounded">
                  الملف الطبي الشامل
                </span>
                <SheetTitle className="text-white text-base font-bold md:text-lg mt-1">
                  {patient.fullName}
                </SheetTitle>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {getSeverityBadge(patient.severity)}
              {getStatusBadge(patient.status)}
            </div>
            <SheetDescription className="text-rose-100 text-xs mt-2 font-medium">
              التشخيص: {patient.diagnosis}
            </SheetDescription>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-slate-900/60 border border-border/60 rounded-xl p-1 mb-6 grid grid-cols-3 gap-1 w-full h-auto">
              <TabsTrigger value="personal" className="text-[11px] py-2 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 text-slate-300">
                البيانات الشخصية
              </TabsTrigger>
              <TabsTrigger value="medical" className="text-[11px] py-2 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 text-slate-300">
                الملف الطبي
              </TabsTrigger>
              <TabsTrigger value="support" className="text-[11px] py-2 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 text-slate-300">
                الدعم والتمويل
              </TabsTrigger>
            </TabsList>

            {/* === TAB 1: PERSONAL === */}
            <TabsContent value="personal" className="space-y-5 outline-none">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <User className="h-4 w-4 text-rose-400" /> البيانات الشخصية والتواصل
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                  <InfoRow label="الاسم الرباعي" value={patient.fullName} />
                  <InfoRow label="الرقم الوطني" value={patient.nationalId} />
                  <InfoRow label="الجنس" value={patient.gender === "MALE" ? "ذكر" : "أنثى"} />
                  <InfoRow label="العمر" value={patient.age ? `${patient.age} سنة` : null} />
                  <InfoRow label="تاريخ الميلاد" value={formatDate(patient.birthdate)} />
                  <InfoRow label="رقم الهاتف" value={patient.phoneNumber} />
                  <InfoRow label="هاتف بديل" value={patient.altPhone} />
                  <InfoRow label="عدد أفراد الأسرة" value={patient.familyMembersCount ? `${patient.familyMembersCount} فرد` : null} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <MapPin className="h-4 w-4 text-rose-400" /> بيانات الموقع الجغرافي
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                  <InfoRow label="المحافظة" value={gov} />
                  <InfoRow label="المديرية" value={dist} />
                  <InfoRow label="العزلة / الناحية" value={sub} />
                  <InfoRow label="القرية / المنطقة" value={patient.village} />
                  <div className="col-span-2">
                    <InfoRow label="العنوان التفصيلي" value={patient.addressDetail} />
                  </div>
                </div>
              </div>

              {patient.family && (
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                    <Link2 className="h-4 w-4 text-rose-400" /> مرتبط بأسرة مستفيدة
                  </h4>
                  <div className="bg-emerald-900/20 border border-emerald-700/30 p-4 rounded-xl">
                    <p className="text-sm font-bold text-emerald-300">{patient.family.headFullName}</p>
                    <p className="text-[11px] text-emerald-500 mt-0.5">رقم وطني: {patient.family.headNationalId}</p>
                  </div>
                </div>
              )}

              {patient.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-200 mb-2">ملاحظات عامة</h4>
                  <p className="text-sm text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-border/60 leading-relaxed">
                    {patient.notes}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* === TAB 2: MEDICAL === */}
            <TabsContent value="medical" className="space-y-5 outline-none">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <Stethoscope className="h-4 w-4 text-rose-400" /> بيانات الحالة الطبية
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                  <div className="col-span-2">
                    <InfoRow label="التشخيص / المرض" value={patient.diagnosis} />
                  </div>
                  <InfoRow label="نوع المرض" value={patient.diseaseType} />
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">درجة الخطورة</span>
                    {getSeverityBadge(patient.severity)}
                  </div>
                  <InfoRow label="المستشفى / المركز" value={patient.hospital} />
                  <InfoRow label="الطبيب المعالج" value={patient.doctor} />
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">حالة الملف</span>
                    {getStatusBadge(patient.status)}
                  </div>
                  <InfoRow label="تاريخ التسجيل" value={formatDate(patient.createdAt)} />
                </div>
              </div>

              {patient.medicalNotes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-200 mb-2">الملاحظات الطبية التفصيلية</h4>
                  <p className="text-sm text-slate-300 bg-slate-900/40 p-4 rounded-xl border border-border/60 leading-relaxed whitespace-pre-wrap">
                    {patient.medicalNotes}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* === TAB 3: SUPPORT === */}
            <TabsContent value="support" className="space-y-5 outline-none">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
                  <Heart className="h-4 w-4 text-rose-400" /> بيانات الدعم والتمويل
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-900/40 p-4 rounded-xl border border-border/60">
                  <div className="col-span-2">
                    <InfoRow label="نوع الدعم المطلوب" value={patient.supportType} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">التكلفة الشهرية</span>
                    <span className="text-lg font-black text-emerald-400">
                      {patient.monthlyCost ? `$${patient.monthlyCost.toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">إجمالي ما صُرف</span>
                    <span className="text-lg font-black text-rose-400">
                      {patient.totalSpent ? `$${patient.totalSpent.toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <InfoRow label="جهة التمويل" value={patient.fundingSource} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex-shrink-0 flex items-center justify-between bg-slate-950/80">
          <div className="text-[10px] text-slate-400 font-medium">
            تاريخ التسجيل: {formatDate(patient.createdAt)}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-xs font-semibold border border-border/60 transition-all"
          >
            إغلاق
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
