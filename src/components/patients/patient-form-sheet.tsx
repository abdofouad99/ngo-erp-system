"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Stethoscope,
  User,
  MapPin,
  Heart,
  Loader2,
  Plus,
  Save,
} from "lucide-react"
import { createPatient, updatePatient } from "@/app/actions/patient-actions"

// Simple label helper
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-bold text-slate-300 block mb-1">
      {children}{required && <span className="text-rose-400 mr-1">*</span>}
    </label>
  )
}

// Native select with consistent styling
function NativeSelect({
  name,
  value,
  onChange,
  defaultValue,
  disabled,
  children,
  required,
}: {
  name?: string
  value?: string
  onChange?: (v: string) => void
  defaultValue?: string
  disabled?: boolean
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <select
      name={name}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      required={required}
      onChange={e => onChange?.(e.target.value)}
      className="w-full bg-slate-900/60 border border-border text-slate-100 text-right rounded-md px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-rose-500"
    >
      {children}
    </select>
  )
}

interface PatientFormSheetProps {
  geography: any[]
  patient?: any | null
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function PatientFormSheet({
  geography,
  patient,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: PatientFormSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Geography cascade
  const [selectedGov, setSelectedGov] = useState("")
  const [selectedDist, setSelectedDist] = useState("")
  const [selectedSubDist, setSelectedSubDist] = useState("")

  const districts = geography.find((g: any) => g.id.toString() === selectedGov)?.districts || []
  const subDistricts = districts.find((d: any) => d.id.toString() === selectedDist)?.subDistricts || []

  // Prefill when editing
  useEffect(() => {
    if (patient && open) {
      const sub = patient.subDistrict
      const dist = sub?.district
      const gov = dist?.governorate
      if (gov) setSelectedGov(gov.id.toString())
      if (dist) setSelectedDist(dist.id.toString())
      if (sub) setSelectedSubDist(sub.id.toString())
    } else if (!open) {
      setSelectedGov("")
      setSelectedDist("")
      setSelectedSubDist("")
      setError(null)
    }
  }, [patient, open])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSubDist) {
      setError("يجب اختيار المنطقة الجغرافية (المحافظة / المديرية / العزلة)")
      return
    }
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("subDistrictId", selectedSubDist)

    startTransition(async () => {
      const result = patient
        ? await updatePatient(patient.id, formData)
        : await createPatient(formData)

      if (result.success) {
        alert(patient ? "تم تحديث بيانات المريض بنجاح ✅" : "تم تسجيل المريض بنجاح ✅")
        setOpen(false)
        onSuccess?.()
      } else {
        setError(result.error || "حدث خطأ غير متوقع")
      }
    })
  }

  return (
    <>
      {trigger && (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      )}
      {!trigger && !controlledOpen && (
        <Button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg shadow-rose-900/20 flex items-center gap-2 transition-all"
        >
          <Plus className="h-4 w-4" />
          تسجيل مريض جديد
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
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
                    {patient ? "تعديل الملف الطبي" : "تسجيل مريض جديد"}
                  </span>
                  <SheetTitle className="text-white text-base font-bold md:text-lg mt-1">
                    {patient ? patient.fullName : "ملف مريض جديد"}
                  </SheetTitle>
                </div>
              </div>
              <SheetDescription className="text-rose-100 text-xs mt-2 font-medium">
                أدخل جميع البيانات المطلوبة بدقة لضمان متابعة الحالة بشكل صحيح
              </SheetDescription>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-4 bg-red-900/30 border border-red-700/40 text-red-300 text-xs font-semibold rounded-xl px-4 py-3">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="bg-slate-900/60 border border-border/60 rounded-xl p-1 mb-6 grid grid-cols-4 gap-1 w-full h-auto">
                  <TabsTrigger value="personal" className="text-[11px] py-2 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 text-slate-300 flex items-center gap-1.5">
                    <User className="h-3 w-3" /> الشخصية
                  </TabsTrigger>
                  <TabsTrigger value="location" className="text-[11px] py-2 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> السكن
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="text-[11px] py-2 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 text-slate-300 flex items-center gap-1.5">
                    <Stethoscope className="h-3 w-3" /> الطبي
                  </TabsTrigger>
                  <TabsTrigger value="support" className="text-[11px] py-2 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 text-slate-300 flex items-center gap-1.5">
                    <Heart className="h-3 w-3" /> الدعم
                  </TabsTrigger>
                </TabsList>

                {/* === TAB 1: PERSONAL === */}
                <TabsContent value="personal" className="space-y-4 outline-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <FieldLabel required>اسم المريض الرباعي</FieldLabel>
                      <Input name="fullName" defaultValue={patient?.fullName || ""} required
                        placeholder="الاسم الأول، الثاني، اسم الأب، اسم الجد"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel>الرقم الوطني</FieldLabel>
                      <Input name="nationalId" defaultValue={patient?.nationalId || ""}
                        placeholder="رقم البطاقة الشخصية"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel required>الجنس</FieldLabel>
                      <NativeSelect name="gender" defaultValue={patient?.gender || "MALE"} required>
                        <option value="MALE">ذكر</option>
                        <option value="FEMALE">أنثى</option>
                      </NativeSelect>
                    </div>
                    <div>
                      <FieldLabel>تاريخ الميلاد</FieldLabel>
                      <Input name="birthdate" type="date"
                        defaultValue={patient?.birthdate ? new Date(patient.birthdate).toISOString().split("T")[0] : ""}
                        className="bg-slate-900/60 border-border text-slate-100 text-right" />
                    </div>
                    <div>
                      <FieldLabel>العمر (سنة)</FieldLabel>
                      <Input name="age" type="number" min={0} max={120}
                        defaultValue={patient?.age || ""}
                        placeholder="العمر"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel>رقم الهاتف</FieldLabel>
                      <Input name="phoneNumber" defaultValue={patient?.phoneNumber || ""}
                        placeholder="07xxxxxxxx"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel>هاتف بديل</FieldLabel>
                      <Input name="altPhone" defaultValue={patient?.altPhone || ""}
                        placeholder="هاتف إضافي"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel>عدد أفراد الأسرة</FieldLabel>
                      <Input name="familyMembersCount" type="number" min={1}
                        defaultValue={patient?.familyMembersCount || ""}
                        placeholder="عدد الأفراد"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>ملاحظات عامة</FieldLabel>
                      <Textarea name="notes" defaultValue={patient?.notes || ""}
                        placeholder="أي ملاحظات إضافية..."
                        rows={3}
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right resize-none" />
                    </div>
                  </div>
                </TabsContent>

                {/* === TAB 2: LOCATION === */}
                <TabsContent value="location" className="space-y-4 outline-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>المحافظة</FieldLabel>
                      <NativeSelect value={selectedGov} onChange={v => { setSelectedGov(v); setSelectedDist(""); setSelectedSubDist("") }}>
                        <option value="">-- اختر المحافظة --</option>
                        {geography.map((g: any) => (
                          <option key={g.id} value={g.id.toString()}>{g.nameAr}</option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div>
                      <FieldLabel required>المديرية</FieldLabel>
                      <NativeSelect value={selectedDist} onChange={v => { setSelectedDist(v); setSelectedSubDist("") }} disabled={!selectedGov}>
                        <option value="">-- اختر المديرية --</option>
                        {districts.map((d: any) => (
                          <option key={d.id} value={d.id.toString()}>{d.nameAr}</option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div>
                      <FieldLabel required>العزلة / الناحية</FieldLabel>
                      <NativeSelect value={selectedSubDist} onChange={setSelectedSubDist} disabled={!selectedDist}>
                        <option value="">-- اختر العزلة --</option>
                        {subDistricts.map((s: any) => (
                          <option key={s.id} value={s.id.toString()}>{s.nameAr}</option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div>
                      <FieldLabel>القرية / المنطقة</FieldLabel>
                      <Input name="village" defaultValue={patient?.village || ""}
                        placeholder="اسم القرية أو المنطقة"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>العنوان التفصيلي</FieldLabel>
                      <Input name="addressDetail" defaultValue={patient?.addressDetail || ""}
                        placeholder="الحي، الشارع، أقرب معلم..."
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                  </div>
                </TabsContent>

                {/* === TAB 3: MEDICAL === */}
                <TabsContent value="medical" className="space-y-4 outline-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <FieldLabel required>التشخيص / اسم المرض</FieldLabel>
                      <Input name="diagnosis" defaultValue={patient?.diagnosis || ""} required
                        placeholder="مثال: فشل كلوي، سرطان الدم، داء السكري..."
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel>نوع المرض</FieldLabel>
                      <NativeSelect name="diseaseType" defaultValue={patient?.diseaseType || ""}>
                        <option value="">-- اختر نوع المرض --</option>
                        <option value="مزمن">مزمن</option>
                        <option value="حاد">حاد</option>
                        <option value="إعاقة">إعاقة</option>
                        <option value="نفسي">نفسي</option>
                        <option value="سرطان">سرطان</option>
                        <option value="وراثي">وراثي</option>
                        <option value="أخرى">أخرى</option>
                      </NativeSelect>
                    </div>
                    <div>
                      <FieldLabel>درجة الخطورة</FieldLabel>
                      <NativeSelect name="severity" defaultValue={patient?.severity || "STABLE"}>
                        <option value="CRITICAL">🔴 حرج</option>
                        <option value="SERIOUS">🟠 خطير</option>
                        <option value="MODERATE">🟡 متوسط</option>
                        <option value="STABLE">🟢 مستقر</option>
                      </NativeSelect>
                    </div>
                    <div>
                      <FieldLabel>المستشفى / المركز الصحي</FieldLabel>
                      <Input name="hospital" defaultValue={patient?.hospital || ""}
                        placeholder="اسم المستشفى أو المركز"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel>الطبيب المعالج</FieldLabel>
                      <Input name="doctor" defaultValue={patient?.doctor || ""}
                        placeholder="اسم الطبيب"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel>حالة الملف</FieldLabel>
                      <NativeSelect name="status" defaultValue={patient?.status || "ACTIVE"}>
                        <option value="ACTIVE">🩺 قيد العلاج</option>
                        <option value="RECOVERED">✅ تعافى</option>
                        <option value="DECEASED">⬛ متوفى</option>
                        <option value="SUSPENDED">⏸ معلق</option>
                      </NativeSelect>
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>ملاحظات طبية تفصيلية</FieldLabel>
                      <Textarea name="medicalNotes" defaultValue={patient?.medicalNotes || ""}
                        placeholder="تفاصيل الحالة الطبية، التاريخ المرضي، الأدوية الحالية..."
                        rows={4}
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right resize-none" />
                    </div>
                  </div>
                </TabsContent>

                {/* === TAB 4: SUPPORT === */}
                <TabsContent value="support" className="space-y-4 outline-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <FieldLabel>نوع الدعم المطلوب</FieldLabel>
                      <NativeSelect name="supportType" defaultValue={patient?.supportType || ""}>
                        <option value="">-- اختر نوع الدعم --</option>
                        <option value="أدوية">أدوية</option>
                        <option value="عملية جراحية">عملية جراحية</option>
                        <option value="أجهزة طبية">أجهزة طبية</option>
                        <option value="علاج كيميائي">علاج كيميائي</option>
                        <option value="غسيل كلى">غسيل كلى</option>
                        <option value="علاج طبيعي">علاج طبيعي</option>
                        <option value="نفقات مستشفى">نفقات مستشفى</option>
                        <option value="دعم شامل">دعم شامل</option>
                      </NativeSelect>
                    </div>
                    <div>
                      <FieldLabel>التكلفة الشهرية التقديرية ($)</FieldLabel>
                      <Input name="monthlyCost" type="number" min={0}
                        defaultValue={patient?.monthlyCost || ""}
                        placeholder="بالدولار الأمريكي"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div>
                      <FieldLabel>إجمالي ما صُرف ($)</FieldLabel>
                      <Input name="totalSpent" type="number" min={0}
                        defaultValue={patient?.totalSpent || ""}
                        placeholder="بالدولار الأمريكي"
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>جهة تمويل العلاج</FieldLabel>
                      <Input name="fundingSource" defaultValue={patient?.fundingSource || ""}
                        placeholder="مثال: المنظمة الدولية، متبرع شخصي، الحكومة..."
                        className="bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 flex-shrink-0 flex items-center justify-between bg-slate-950/80 gap-3">
              <button type="button" onClick={() => setOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-xs font-semibold border border-border/60 transition-all">
                إلغاء
              </button>
              <Button type="submit" disabled={isPending}
                className="bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl px-6 py-2 text-sm font-bold flex items-center gap-2">
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                  <><Save className="h-4 w-4" /> {patient ? "حفظ التعديلات" : "تسجيل المريض"}</>
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
