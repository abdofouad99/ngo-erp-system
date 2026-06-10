"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  User,
  GraduationCap,
  FileText,
  CreditCard,
  AlertCircle,
  Loader2,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { createOrphan } from "@/app/actions/orphan-actions"
import { Separator } from "@/components/ui/separator"

// =============================================================================
// VALIDATION SCHEMA (Arabic Client validation matching Server actions)
// =============================================================================

const formSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب ويجب ألا يقل عن 3 أحرف"),
  gender: z.enum(["MALE", "FEMALE"], { errorMap: () => ({ message: "يرجى اختيار الجنس" }) }),
  birthdate: z.string().min(1, "تاريخ الميلاد مطلوب"),
  nationalId: z.string().optional(),
  familyId: z.string().min(1, "يرجى اختيار الأسرة التابع لها اليتيم"),
  orphanCode: z.string().optional(),
  kuraimiAccount: z.string().optional(),
  educationLevel: z.string().optional(),
  schoolName: z.string().optional(),
  educationalStage: z.string().optional(),
  averageGrade: z.string().optional().transform((val) => (val === "" ? null : Number(val))).refine((val) => val === null || (val >= 0 && val <= 100), {
    message: "المعدل يجب أن يكون بين 0 و 100",
  }),
  educationalNeeds: z.string().optional(),
  healthStatus: z.string().optional(),
  disabilityType: z.string().optional(),
  disability: z.boolean().default(false),
  disabilityDetails: z.string().optional(),
  orphanType: z.enum(["FATHER", "MOTHER", "BOTH"]).optional().nullable().or(z.literal("")),
  fatherDeathDate: z.string().optional().nullable().or(z.literal("")),
  fatherDeathCause: z.string().optional(),
  motherDeathDate: z.string().optional().nullable().or(z.literal("")),
  motherName: z.string().optional(),
  verificationStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  verifiedBy: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddOrphanSheetProps {
  families: {
    id: string
    headFullName: string
  }[]
}

export function AddOrphanSheet({ families }: AddOrphanSheetProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      gender: "MALE",
      birthdate: "",
      nationalId: "",
      familyId: "",
      orphanCode: "",
      kuraimiAccount: "",
      educationLevel: "",
      schoolName: "",
      educationalStage: "",
      averageGrade: undefined as any,
      educationalNeeds: "",
      healthStatus: "",
      disabilityType: "",
      disability: false,
      disabilityDetails: "",
      orphanType: "FATHER",
      fatherDeathDate: "",
      fatherDeathCause: "",
      motherDeathDate: "",
      motherName: "",
      verificationStatus: "PENDING",
      verifiedBy: "",
      notes: "",
    },
  })

  // Watch fields for conditional rendering
  const showDisability = watch("disability")
  const orphanTypeWatched = watch("orphanType")

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    // Map fields to raw input expected by Server Actions
    const result = await createOrphan(values)

    if (result.success) {
      setSuccessMsg("تم تسجيل اليتيم بنجاح في قاعدة البيانات!")
      reset()
      setTimeout(() => {
        setOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } else {
      setErrorMsg(result.error || "فشل التسجيل. يرجى مراجعة الحقول والرموز المكررة.")
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full sm:w-auto btn-premium gap-2">
          <Plus className="h-4 w-4" />
          <span>إضافة يتيم جديد</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl"
      >
        {/* Header Panel */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-500 to-teal-600 p-6 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative">
            <SheetTitle className="text-white text-lg font-bold md:text-xl">
              تسجيل يتيم جديد في قاعدة البيانات
            </SheetTitle>
            <SheetDescription className="text-emerald-100 text-xs mt-1">
              أدخل كافة البيانات التفصيلية المتعلقة باليتيم والمرحلة الدراسية وحالة اليتم وصرفيات الكريمي.
            </SheetDescription>
          </div>
        </div>

        {/* Message Banner */}
        {successMsg && (
          <div className="bg-emerald-950/50 text-emerald-400 p-3 text-xs font-semibold flex items-center gap-2 border-b border-emerald-500/20">
            <AlertCircle className="h-4 w-4 text-emerald-400" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-950/50 text-red-400 p-3 text-xs font-semibold flex items-center gap-2 border-b border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            {errorMsg}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Tabs defaultValue="personal" className="w-full flex flex-col h-full">
              <TabsList className="bg-slate-900/60 border border-border/60 rounded-xl p-1 mb-4 flex-shrink-0 gap-1">
                <TabsTrigger value="personal" className="text-xs py-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                  <User className="h-3.5 w-3.5 ml-1.5" />
                  الشخصية والدراسة
                </TabsTrigger>
                <TabsTrigger value="family" className="text-xs py-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                  <GraduationCap className="h-3.5 w-3.5 ml-1.5" />
                  بيانات الوفاة
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-xs py-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                  <CreditCard className="h-3.5 w-3.5 ml-1.5" />
                  المالية والمراجعة
                </TabsTrigger>
              </TabsList>

              {/* === TAB 1: PERSONAL & EDUCATION === */}
              <TabsContent value="personal" className="space-y-4 outline-none">
                {/* Family Association Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">ربط بالأسرة المسجلة *</label>
                  <select
                    {...register("familyId")}
                    className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                  >
                    <option value="" className="bg-slate-950 text-white">-- اختر الأسرة التابع لها اليتيم --</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.id} className="bg-slate-950 text-white">
                        {f.headFullName}
                      </option>
                    ))}
                  </select>
                  {errors.familyId && (
                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.familyId.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الاسم الكامل لليتيم *</label>
                    <Input placeholder="الاسم الرباعي كما هو ببطاقة القيد" className="bg-slate-900/40 border-border text-white" {...register("fullName")} />
                    {errors.fullName && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الجنس *</label>
                    <select
                      {...register("gender")}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    >
                      <option value="MALE" className="bg-slate-950 text-white">ذكر</option>
                      <option value="FEMALE" className="bg-slate-950 text-white">أنثى</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.gender.message}</p>
                    )}
                  </div>

                  {/* Birthdate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">تاريخ الميلاد *</label>
                    <Input type="date" className="bg-slate-900/40 border-border text-white" {...register("birthdate")} />
                    {errors.birthdate && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.birthdate.message}</p>
                    )}
                  </div>

                  {/* National ID / Birth Certificate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">رقم الهوية أو شهادة الميلاد</label>
                    <Input placeholder="الرقم الوطني الموحد" className="bg-slate-900/40 border-border text-white" {...register("nationalId")} />
                  </div>

                  {/* Orphan Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">كود ملف اليتيم</label>
                    <Input placeholder="مثال: ORF-2026-102" className="bg-slate-900/40 border-border text-white" {...register("orphanCode")} />
                  </div>
                </div>

                <Separator className="my-1 border-border/40" />
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  بيانات التعليم والمدرسة
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">المرحلة الدراسية</label>
                    <Input placeholder="ابتدائي، أساسي، ثانوي" className="bg-slate-900/40 border-border text-white" {...register("educationalStage")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الصف الدراسي الحالي</label>
                    <Input placeholder="مثال: الصف التاسع" className="bg-slate-900/40 border-border text-white" {...register("educationLevel")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">اسم المدرسة</label>
                    <Input placeholder="المدرسة المقيد بها حالياً" className="bg-slate-900/40 border-border text-white" {...register("schoolName")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">المعدل الدراسي الأخير (%)</label>
                    <Input type="number" step="0.01" placeholder="مثال: 95.5" className="bg-slate-900/40 border-border text-white" {...register("averageGrade")} />
                    {errors.averageGrade && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.averageGrade.message}</p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الاحتياجات والمستلزمات التعليمية</label>
                    <Input placeholder="مثال: رسوم دراسية، زي مدرسي، كتب دراسية" className="bg-slate-900/40 border-border text-white" {...register("educationalNeeds")} />
                  </div>
                </div>

                <Separator className="my-1 border-border/40" />
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  الحالة الصحية والإعاقات
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الحالة الصحية العامة</label>
                    <Input placeholder="مثال: سليم، يعاني من الربو" className="bg-slate-900/40 border-border text-white" {...register("healthStatus")} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">هل يعاني من إعاقة؟</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        id="disability"
                        {...register("disability")}
                        className="rounded border-border bg-slate-900/40 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                      <label htmlFor="disability" className="text-xs font-semibold text-slate-300 cursor-pointer">نعم، يوجد إعاقة</label>
                    </div>
                  </div>

                  {showDisability && (
                    <div className="col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">تصنيف أو نوع الإعاقة</label>
                        <Input placeholder="مثال: حركية، بصرية" className="bg-slate-900/40 border-border text-white" {...register("disabilityType")} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">تفاصيل الإعاقة والمستلزمات</label>
                        <Input placeholder="مثال: كرسي متحرك" className="bg-slate-900/40 border-border text-white" {...register("disabilityDetails")} />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* === TAB 2: ORPHANHOOD & DEATH === */}
              <TabsContent value="family" className="space-y-4 outline-none">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  بيانات الوفاة وتصنيف اليتيم
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Orphan Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">تصنيف وتصنيف اليتم</label>
                    <select
                      {...register("orphanType")}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    >
                      <option value="FATHER" className="bg-slate-950 text-white">يتيم الأب</option>
                      <option value="MOTHER" className="bg-slate-950 text-white">يتيم الأم</option>
                      <option value="BOTH" className="bg-slate-950 text-white">يتيم الأبوين (الأب والأم)</option>
                    </select>
                  </div>

                  {/* Mother Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">اسم الأم بالكامل</label>
                    <Input placeholder="الاسم الرباعي للأم" className="bg-slate-900/40 border-border text-white" {...register("motherName")} />
                  </div>

                  {/* Father Death Date */}
                  {(orphanTypeWatched === "FATHER" || orphanTypeWatched === "BOTH") && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">تاريخ وفاة الأب</label>
                        <Input type="date" className="bg-slate-900/40 border-border text-white" {...register("fatherDeathDate")} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">سبب وفاة الأب</label>
                        <Input placeholder="توضيح سبب الوفاة" className="bg-slate-900/40 border-border text-white" {...register("fatherDeathCause")} />
                      </div>
                    </>
                  )}

                  {/* Mother Death Date */}
                  {(orphanTypeWatched === "MOTHER" || orphanTypeWatched === "BOTH") && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">تاريخ وفاة الأم</label>
                      <Input type="date" className="bg-slate-900/40 border-border text-white" {...register("motherDeathDate")} />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* === TAB 3: FINANCIAL & AUDIT === */}
              <TabsContent value="financial" className="space-y-4 outline-none">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  الحسابات المالية وبطاقة الصرف
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Kuraimi Account */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-300">رقم حساب الكريمي للصرف (Kuraimi Account)</label>
                    <Input placeholder="مثال: 300456789" className="bg-slate-900/40 border-border text-white" {...register("kuraimiAccount")} />
                  </div>

                  <Separator className="col-span-2 border-border/40" />

                  {/* Verification Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">حالة تدقيق وتدقيق الملف الميداني</label>
                    <select
                      {...register("verificationStatus")}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    >
                      <option value="PENDING" className="bg-slate-950 text-white">قيد المراجعة</option>
                      <option value="APPROVED" className="bg-slate-950 text-white">مكتمل ومعتمد</option>
                      <option value="REJECTED" className="bg-slate-950 text-white">مرفوض</option>
                    </select>
                  </div>

                  {/* Verified By */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">اسم الباحث / المراجع الميداني</label>
                    <Input placeholder="الشخص المسؤول عن تدقيق الملف" className="bg-slate-900/40 border-border text-white" {...register("verifiedBy")} />
                  </div>

                  {/* Social Notes */}
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ملاحظات البحث الاجتماعي الإضافية</label>
                    <textarea
                      rows={3}
                      placeholder="سجل أي ملاحظات معيشية أو ميدانية هامة..."
                      {...register("notes")}
                      className="flex w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Form Actions Footer */}
          <div className="p-4 border-t border-border flex-shrink-0 flex items-center justify-end gap-2 bg-slate-950/80">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
              className="rounded-xl px-5 border-border bg-slate-900/40 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-premium px-6 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ بيانات اليتيم</span>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
