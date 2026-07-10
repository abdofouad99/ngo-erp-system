"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Edit,
  User,
  MapPin,
  Home as HomeIcon,
  FileText,
  AlertCircle,
  Loader2,
  Users,
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
import { createFamily, updateFamily } from "@/app/actions/family-actions"
import { Separator } from "@/components/ui/separator"

// =============================================================================
// VALIDATION SCHEMA (Arabic UI Validation)
// =============================================================================

const formSchema = z.object({
  headFullName: z.string().min(3, "الاسم الكامل مطلوب ويجب ألا يقل عن 3 أحرف"),
  headNationalId: z.string().min(5, "رقم الهوية الوطنية مطلوب ويجب ألا يقل عن 5 رموز"),
  headGender: z.enum(["MALE", "FEMALE"], { errorMap: () => ({ message: "يرجى اختيار الجنس" }) }),
  headPhoneNumber: z.string().optional(),
  headAltPhone: z.string().optional(),
  headBirthdate: z.string().optional().nullable().or(z.literal("")),
  addressDetail: z.string().optional(),
  subDistrictId: z.string().min(1, "يرجى اختيار الحي/القرية السكنية"),
  vulnerabilityScore: z.string().optional().transform((val) => (val === "" ? 0 : Number(val))).refine((val) => val === null || (val >= 0 && val <= 100), {
    message: "درجة الهشاشة يجب أن تكون بين 0 و 100",
  }),
  notes: z.string().optional(),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  familyMembersCount: z.string().optional().transform((val) => (val === "" ? null : Number(val))).refine((val) => val === null || val >= 1, {
    message: "عدد أفراد الأسرة لا يقل عن 1 فرد",
  }),
  monthlyIncome: z.string().optional().transform((val) => (val === "" ? null : Number(val))).refine((val) => val === null || val >= 0, {
    message: "الدخل الشهري لا يقل عن 0 ريال",
  }),
  housingType: z.string().optional(),
  housingCondition: z.string().optional(),
  povertyLevel: z.enum(["SEVERE", "MEDIUM", "LOW"]).optional().nullable().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface FamilyFormSheetProps {
  family?: any // Present in edit mode
  geography: {
    id: number
    nameAr: string
    districts: {
      id: number
      nameAr: string
      subDistricts: {
        id: number
        nameAr: string
      }[]
    }[]
  }[]
  trigger?: React.ReactNode
  userRole?: string
}

export function FamilyFormSheet({ family, geography, trigger, userRole }: FamilyFormSheetProps) {
  const isEditMode = !!family
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Cascading Geography States
  const [govId, setGovId] = useState<number | "">("")
  const [districtId, setDistrictId] = useState<number | "">("")

  // Setup Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headFullName: "",
      headNationalId: "",
      headGender: "MALE",
      headPhoneNumber: "",
      headAltPhone: "",
      headBirthdate: "",
      addressDetail: "",
      subDistrictId: "",
      vulnerabilityScore: 0 as any,
      notes: "",
      guardianName: "",
      guardianRelation: "",
      guardianPhone: "",
      familyMembersCount: undefined as any,
      monthlyIncome: undefined as any,
      housingType: "",
      housingCondition: "",
      povertyLevel: "",
    },
  })

  // Watch subDistrictId to verify selection
  const watchedSubDistrict = watch("subDistrictId")

  // Load initial values for editing
  useEffect(() => {
    if (isEditMode && family) {
      // Find parent district and governorate
      let matchedGovId: number | "" = ""
      let matchedDistId: number | "" = ""

      for (const gov of geography) {
        for (const dist of gov.districts) {
          for (const sub of dist.subDistricts) {
            if (sub.id === family.subDistrictId) {
              matchedGovId = gov.id
              matchedDistId = dist.id
              break
            }
          }
        }
      }

      setGovId(matchedGovId)
      setDistrictId(matchedDistId)

      // Set form default values
      reset({
        headFullName: family.headFullName,
        headNationalId: family.headNationalId,
        headGender: family.headGender,
        headPhoneNumber: family.headPhoneNumber || "",
        headAltPhone: family.headAltPhone || "",
        headBirthdate: family.headBirthdate ? new Date(family.headBirthdate).toISOString().split("T")[0] : "",
        addressDetail: family.addressDetail || "",
        subDistrictId: family.subDistrictId.toString(),
        vulnerabilityScore: family.vulnerabilityScore !== null ? family.vulnerabilityScore.toString() : ("0" as any),
        notes: family.notes || "",
        guardianName: family.guardianName || "",
        guardianRelation: family.guardianRelation || "",
        guardianPhone: family.guardianPhone || "",
        familyMembersCount: family.familyMembersCount !== null ? family.familyMembersCount.toString() : ("" as any),
        monthlyIncome: family.monthlyIncome !== null ? family.monthlyIncome.toString() : ("" as any),
        housingType: family.housingType || "",
        housingCondition: family.housingCondition || "",
        povertyLevel: family.povertyLevel || "",
      })
    } else if (open) {
      // Reset to empty on open in create mode
      reset({
        headFullName: "",
        headNationalId: "",
        headGender: "MALE",
        headPhoneNumber: "",
        headAltPhone: "",
        headBirthdate: "",
        addressDetail: "",
        subDistrictId: "",
        vulnerabilityScore: 0 as any,
        notes: "",
        guardianName: "",
        guardianRelation: "",
        guardianPhone: "",
        familyMembersCount: undefined as any,
        monthlyIncome: undefined as any,
        housingType: "",
        housingCondition: "",
        povertyLevel: "",
      })
      setGovId("")
      setDistrictId("")
    }
  }, [family, isEditMode, open, geography, reset])

  // Get active lists for cascading selects
  const activeGovernorate = geography.find((g) => g.id === govId)
  const activeDistricts = activeGovernorate ? activeGovernorate.districts : []
  const activeDistrict = activeDistricts.find((d) => d.id === districtId)
  const activeSubDistricts = activeDistrict ? activeDistrict.subDistricts : []

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    // Call server action depending on mode
    const result = isEditMode
      ? await updateFamily(family.id, values)
      : await createFamily(values)

    if (result.success) {
      setSuccessMsg(
        isEditMode ? "تم تحديث بيانات الأسرة بنجاح!" : "تم تسجيل الأسرة الجديدة بنجاح!"
      )
      if (!isEditMode) reset()
      setTimeout(() => {
        setOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } else {
      setErrorMsg(result.error || "حدث خطأ غير متوقع. يرجى مراجعة الحقول.")
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full sm:w-auto btn-premium gap-2">
            <Plus className="h-4 w-4" />
            <span>تسجيل أسرة جديدة</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl"
      >
        {/* Header Panel */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 to-teal-700 p-6 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative">
            <SheetTitle className="text-white text-lg font-bold md:text-xl flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Edit className="h-5 w-5 text-emerald-100" />
                  تعديل بيانات ملف الأسرة
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-emerald-100" />
                  تسجيل أسرة جديدة في النظام
                </>
              )}
            </SheetTitle>
            <SheetDescription className="text-emerald-100 text-xs mt-1">
              أدخل كافة البيانات التفصيلية لرب الأسرة، وتفاصيل السكن، والتقييم المعيشي والهشاشة.
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
            <Tabs defaultValue="identity" className="w-full flex flex-col h-full">
              <TabsList className="bg-slate-900/60 border border-border/60 rounded-xl p-1 mb-6 flex-shrink-0 gap-1 w-full justify-between">
                <TabsTrigger value="identity" className="text-xs py-2 px-3 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  <User className="h-3.5 w-3.5 ml-1.5" />
                  الهوية والاتصال
                </TabsTrigger>
                <TabsTrigger value="geography" className="text-xs py-2 px-3 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 ml-1.5" />
                  الموقع والوصي
                </TabsTrigger>
                <TabsTrigger value="living" className="text-xs py-2 px-3 flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  <HomeIcon className="h-3.5 w-3.5 ml-1.5" />
                  التقييم المعيشي
                </TabsTrigger>
              </TabsList>

              <fieldset disabled={userRole === "VIEWER"} className="w-full space-y-4">
              {/* === TAB 1: IDENTITY & CONTACT === */}
              <TabsContent value="identity" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Full Name */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-300">الاسم الكامل لرب الأسرة *</label>
                    <Input placeholder="الاسم الرباعي لرب الأسرة" className="bg-slate-900/40 border-border text-white" {...register("headFullName")} />
                    {errors.headFullName && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.headFullName.message}</p>
                    )}
                  </div>

                  {/* National ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الرقم الوطني / بطاقة الهوية لرب الأسرة *</label>
                    <Input placeholder="رقم الهوية الوطنية الموحد" className="bg-slate-900/40 border-border text-white" {...register("headNationalId")} />
                    {errors.headNationalId && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.headNationalId.message}</p>
                    )}
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">جنس رب الأسرة *</label>
                    <select
                      {...register("headGender")}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    >
                      <option value="MALE" className="bg-slate-950 text-white">ذكر</option>
                      <option value="FEMALE" className="bg-slate-950 text-white">أنثى</option>
                    </select>
                    {errors.headGender && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.headGender.message}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">رقم الهاتف الرئيسي</label>
                    <Input placeholder="مثال: 771234567" className="bg-slate-900/40 border-border text-white" {...register("headPhoneNumber")} />
                  </div>

                  {/* Alternate Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">رقم هاتف بديل (احتياطي)</label>
                    <Input placeholder="مثال: 733987654" className="bg-slate-900/40 border-border text-white" {...register("headAltPhone")} />
                  </div>

                  {/* Birthdate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">تاريخ الميلاد لرب الأسرة</label>
                    <Input type="date" className="bg-slate-900/40 border-border text-white" {...register("headBirthdate")} />
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 2: GEOGRAPHY & GUARDIAN === */}
              <TabsContent value="geography" className="space-y-4 outline-none">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  العنوان والموقع الجغرافي
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Governorate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">المحافظة *</label>
                    <select
                      value={govId}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value)
                        setGovId(val)
                        setDistrictId("") // Reset children
                        setValue("subDistrictId", "")
                      }}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    >
                      <option value="" className="bg-slate-950 text-white">-- اختر المحافظة --</option>
                      {geography.map((g) => (
                        <option key={g.id} value={g.id} className="bg-slate-950 text-white">
                          {g.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">المديرية *</label>
                    <select
                      value={districtId}
                      disabled={!govId}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value)
                        setDistrictId(val)
                        setValue("subDistrictId", "")
                      }}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right disabled:opacity-50"
                    >
                      <option value="" className="bg-slate-950 text-white">-- اختر المديرية --</option>
                      {activeDistricts.map((d) => (
                        <option key={d.id} value={d.id} className="bg-slate-950 text-white">
                          {d.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SubDistrict */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الحي / العزلة *</label>
                    <select
                      {...register("subDistrictId")}
                      disabled={!districtId}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right disabled:opacity-50"
                    >
                      <option value="" className="bg-slate-950 text-white">-- اختر الحي السكني --</option>
                      {activeSubDistricts.map((s) => (
                        <option key={s.id} value={s.id.toString()} className="bg-slate-950 text-white">
                          {s.nameAr}
                        </option>
                      ))}
                    </select>
                    {errors.subDistrictId && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.subDistrictId.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">تفاصيل العنوان الإضافية (مثل: قرية، شارع، معلم بارز)</label>
                  <Input placeholder="مثال: شارع الثلاثين، بجوار المسجد الكبير" className="bg-slate-900/40 border-border text-white" {...register("addressDetail")} />
                </div>

                <Separator className="my-2 border-border/40" />
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  بيانات الوصي الاجتماعي للأسرة (اختياري)
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">اسم الوصي الكامل</label>
                    <Input placeholder="اسم الوصي البديل" className="bg-slate-900/40 border-border text-white" {...register("guardianName")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">صلة قرابة الوصي برب الأسرة</label>
                    <select
                      {...register("guardianRelation")}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    >
                      <option value="" className="bg-slate-950 text-white">-- غير محدد --</option>
                      <option value="الأم" className="bg-slate-950 text-white">الأم</option>
                      <option value="العم" className="bg-slate-950 text-white">العم</option>
                      <option value="الخال" className="bg-slate-950 text-white">الخال</option>
                      <option value="الجد / الجدة" className="bg-slate-950 text-white">الجد / الجدة</option>
                      <option value="الأخ الأكبر" className="bg-slate-950 text-white">الأخ الأكبر</option>
                      <option value="أخرى" className="bg-slate-950 text-white">أخرى</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-300">رقم هاتف الوصي</label>
                    <Input placeholder="رقم هاتف التواصل مع الوصي" className="bg-slate-900/40 border-border text-white" {...register("guardianPhone")} />
                  </div>
                </div>
              </TabsContent>

              {/* === TAB 3: LIVING ASSESSMENT === */}
              <TabsContent value="living" className="space-y-4 outline-none">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <HomeIcon className="h-4 w-4" />
                  التقييم الاجتماعي والهشاشة
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Poverty Level */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">مستوى الفقر المعيشي</label>
                    <select
                      {...register("povertyLevel")}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    >
                      <option value="" className="bg-slate-950 text-white">-- غير محدد --</option>
                      <option value="SEVERE" className="bg-slate-950 text-white">فقر شديد</option>
                      <option value="MEDIUM" className="bg-slate-950 text-white">فقر متوسط</option>
                      <option value="LOW" className="bg-slate-950 text-white">فقر منخفض</option>
                    </select>
                  </div>

                  {/* Vulnerability Score */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">درجة الهشاشة (0 إلى 100) *</label>
                    <Input type="number" placeholder="مثال: 75" className="bg-slate-900/40 border-border text-white" {...register("vulnerabilityScore")} />
                    {errors.vulnerabilityScore && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.vulnerabilityScore.message}</p>
                    )}
                  </div>

                  {/* Monthly Income */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الدخل الشهري التقريبي (ريال يمني)</label>
                    <Input type="number" placeholder="مثال: 120000" className="bg-slate-900/40 border-border text-white" {...register("monthlyIncome")} />
                    {errors.monthlyIncome && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.monthlyIncome.message}</p>
                    )}
                  </div>

                  {/* Family Members Count */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">عدد أفراد الأسرة الإجمالي</label>
                    <Input type="number" placeholder="مثال: 5" className="bg-slate-900/40 border-border text-white" {...register("familyMembersCount")} />
                    {errors.familyMembersCount && (
                      <p className="text-xs font-semibold text-red-500 mt-1">{errors.familyMembersCount.message}</p>
                    )}
                  </div>

                  {/* Housing Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">نوع السكن</label>
                    <select
                      {...register("housingType")}
                      className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    >
                      <option value="" className="bg-slate-950 text-white">-- اختر نوع السكن --</option>
                      <option value="ملك" className="bg-slate-950 text-white">ملك</option>
                      <option value="إيجار" className="bg-slate-950 text-white">إيجار</option>
                      <option value="خيمة / مؤقت" className="bg-slate-950 text-white">خيمة / مؤقت</option>
                      <option value="مستضاف لدى الأقارب" className="bg-slate-950 text-white">مستضاف لدى الأقارب</option>
                    </select>
                  </div>

                  {/* Housing Condition */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">حالة السكن البنائية</label>
                    <Input placeholder="مثال: متضرر، متهالك، ممتاز" className="bg-slate-900/40 border-border text-white" {...register("housingCondition")} />
                  </div>

                  {/* Notes */}
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ملاحظات البحث الاجتماعي الإضافية</label>
                    <textarea
                      rows={3}
                      placeholder="سجل أي تفاصيل اجتماعية أو صحية هامة للأسرة..."
                      {...register("notes")}
                      className="flex w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    />
                  </div>
                </div>
              </TabsContent>
              </fieldset>
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
              disabled={loading || userRole === "VIEWER"}
              className="btn-premium px-6 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ ملف الأسرة</span>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
