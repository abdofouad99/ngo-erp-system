"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  User,
  HeartHandshake,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  Users,
  Baby,
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
import { createSponsorship } from "@/app/actions/sponsorship-actions"
import { Separator } from "@/components/ui/separator"

// =============================================================================
// VALIDATION SCHEMA (Arabic UI Validation)
// =============================================================================

const formSchema = z.object({
  sponsorId: z.string().min(1, "يرجى اختيار الكفيل المسؤول"),
  targetType: z.enum(["ORPHAN", "FAMILY"], { errorMap: () => ({ message: "يرجى تحديد نوع الكفالة" }) }),
  targetId: z.string().min(1, "يرجى اختيار المستفيد المستهدف"),
  amount: z.string().min(1, "قيمة الكفالة مطلوبة").transform((val) => Number(val)).refine((val) => val > 0, {
    message: "قيمة الكفالة يجب أن تكون أكبر من 0",
  }),
  currency: z.enum(["USD", "SAR", "YER", "EUR", "TRY", "IQD", "SYP"], {
    errorMap: () => ({ message: "يرجى تحديد العملة" }),
  }),
  paymentCycle: z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"], {
    errorMap: () => ({ message: "يرجى تحديد دورة الدفع" }),
  }),
  startDate: z.string().min(1, "تاريخ بدء الكفالة مطلوب"),
  endDate: z.string().optional().nullable().or(z.literal("")),
  sponsorshipNotes: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SponsorshipFormSheetProps {
  sponsors: { id: string; fullName: string }[]
  orphans: { id: string; fullName: string }[]
  families: { id: string; headFullName: string }[]
  trigger?: React.ReactNode
}

export function SponsorshipFormSheet({
  sponsors,
  orphans,
  families,
  trigger,
}: SponsorshipFormSheetProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sponsorId: "",
      targetType: "ORPHAN",
      targetId: "",
      amount: undefined as any,
      currency: "USD",
      paymentCycle: "MONTHLY",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      sponsorshipNotes: "",
      notes: "",
    },
  })

  // Watch targetType to clear targetId and toggle dropdowns
  const targetTypeWatched = watch("targetType")

  useEffect(() => {
    setValue("targetId", "") // Clear selection when type toggles
  }, [targetTypeWatched, setValue])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = await createSponsorship(values)

    if (result.success) {
      setSuccessMsg("تم تسجيل الكفالة الجديدة بنجاح في قاعدة البيانات!")
      reset()
      setTimeout(() => {
        setOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } else {
      setErrorMsg(result.error || "حدث خطأ غير متوقع أثناء حفظ الكفالة.")
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-md shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]">
            <Plus className="h-4 w-4 text-slate-950 stroke-[3]" />
            <span>تسجيل كفالة جديدة</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="sm:max-w-md w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-slate-900 shadow-2xl text-white"
      >
        {/* Header Panel */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-950/80 to-slate-950 p-6 text-white flex-shrink-0 border-b border-slate-900">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-emerald-500/5" />

          <div className="relative">
            <SheetTitle className="text-white text-lg font-bold md:text-xl flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-emerald-400" />
              تسجيل كفالة جديدة
            </SheetTitle>
            <SheetDescription className="text-slate-400 text-xs mt-1">
              ربط كفيل بأحد الأيتام أو الأسر المستفيدة وتحديد مبالغ الكفالة ودورة الدفع وتواريخها.
            </SheetDescription>
          </div>
        </div>

        {/* Message Banners */}
        {successMsg && (
          <div className="bg-emerald-500/10 text-emerald-455 p-3 text-xs font-semibold flex items-center gap-2 border-b border-emerald-500/20">
            <AlertCircle className="h-4 w-4 text-emerald-400" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-500/10 text-rose-455 p-3 text-xs font-semibold flex items-center gap-2 border-b border-rose-500/20">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            {errorMsg}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Sponsor Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                اختر الكفيل المسؤول *
              </label>
              <select
                {...register("sponsorId")}
                className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 cursor-pointer"
              >
                <option value="" className="bg-slate-950 text-white">-- اختر الكفيل المسجل في النظام --</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-950 text-white">
                    {s.fullName}
                  </option>
                ))}
              </select>
              {errors.sponsorId && (
                <p className="text-xs font-semibold text-rose-450 mt-1">{errors.sponsorId.message}</p>
              )}
            </div>

            {/* Target Type selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 text-slate-500" />
                نوع الكفالة المستهدفة *
              </label>
              <select
                {...register("targetType")}
                className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 font-medium cursor-pointer"
              >
                <option value="ORPHAN" className="bg-slate-950 text-white">كفالة فردية ليتيم (Orphan)</option>
                <option value="FAMILY" className="bg-slate-950 text-white">كفالة معيشية لأسرة (Family)</option>
              </select>
            </div>

            {/* Recipient Target Selector */}
            {targetTypeWatched === "ORPHAN" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Baby className="h-3.5 w-3.5 text-slate-500" />
                  اختر اليتيم المستهدف *
                </label>
                <select
                  {...register("targetId")}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 cursor-pointer"
                >
                  <option value="" className="bg-slate-950 text-white">-- اختر اليتيم --</option>
                  {orphans.map((o) => (
                    <option key={o.id} value={o.id} className="bg-slate-950 text-white">
                      {o.fullName}
                    </option>
                  ))}
                </select>
                {errors.targetId && (
                  <p className="text-xs font-semibold text-rose-450 mt-1">{errors.targetId.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  اختر الأسرة المستهدفة *
                </label>
                <select
                  {...register("targetId")}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 cursor-pointer"
                >
                  <option value="" className="bg-slate-950 text-white">-- اختر رب الأسرة --</option>
                  {families.map((f) => (
                    <option key={f.id} value={f.id} className="bg-slate-950 text-white">
                      {f.headFullName}
                    </option>
                  ))}
                </select>
                {errors.targetId && (
                  <p className="text-xs font-semibold text-rose-455 mt-1">{errors.targetId.message}</p>
                )}
              </div>
            )}

            <Separator className="bg-slate-900 my-2" />

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                  قيمة الكفالة *
                </label>
                <Input 
                  type="number" 
                  placeholder="مثال: 50" 
                  className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  {...register("amount")} 
                />
                {errors.amount && (
                  <p className="text-xs font-semibold text-rose-455 mt-1">{errors.amount.message}</p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">العملة *</label>
                <select
                  {...register("currency")}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="USD" className="bg-slate-950 text-white">دولار أمريكي (USD)</option>
                  <option value="SAR" className="bg-slate-950 text-white">ريال سعودي (SAR)</option>
                  <option value="YER" className="bg-slate-950 text-white">ريال يمني (YER)</option>
                  <option value="EUR" className="bg-slate-950 text-white">يورو (EUR)</option>
                </select>
              </div>
            </div>

            {/* Payment Cycle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">دورة الدفع المقررة *</label>
              <select
                {...register("paymentCycle")}
                className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 cursor-pointer"
              >
                <option value="MONTHLY" className="bg-slate-950 text-white">شهري (Monthly)</option>
                <option value="QUARTERLY" className="bg-slate-950 text-white">ربع سنوي (Quarterly)</option>
                <option value="SEMI_ANNUAL" className="bg-slate-950 text-white">نصف سنوي (Semi-Annual)</option>
                <option value="ANNUAL" className="bg-slate-950 text-white">سنوي (Annual)</option>
                <option value="ONE_TIME" className="bg-slate-950 text-white">دفعة واحدة (One-Time)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  تاريخ البدء *
                </label>
                <Input 
                  type="date" 
                  className="bg-slate-900/60 border-slate-800 text-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 dark:[color-scheme:dark]"
                  {...register("startDate")} 
                />
                {errors.startDate && (
                  <p className="text-xs font-semibold text-rose-455 mt-1">{errors.startDate.message}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  تاريخ الانتهاء
                </label>
                <Input 
                  type="date" 
                  className="bg-slate-900/60 border-slate-800 text-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 dark:[color-scheme:dark]"
                  {...register("endDate")} 
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                شروط أو ملاحظات خاصة بالكفالة
              </label>
              <textarea
                rows={3}
                placeholder="سجل أي تفاصيل، شروط تواصل، أو شروط دفع معينة للكفالة..."
                {...register("sponsorshipNotes")}
                className="flex w-full rounded-xl border border-slate-800 bg-slate-900/60 text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 text-right px-3 py-2 text-sm focus-visible:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="p-4 border-t border-slate-900 flex-shrink-0 flex items-center justify-end gap-2 bg-slate-950">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
              className="rounded-xl px-5 border-slate-800 text-slate-300 bg-slate-900/50 hover:bg-slate-900 hover:text-white transition-all duration-200"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl px-6 font-bold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 text-slate-950" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>تنشيط الكفالة</span>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
