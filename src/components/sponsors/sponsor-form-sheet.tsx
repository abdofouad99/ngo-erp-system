"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Edit,
  User,
  Building,
  Mail,
  Phone,
  Globe,
  FileText,
  AlertCircle,
  Loader2,
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
import { createSponsor, updateSponsor } from "@/app/actions/sponsorship-actions"

// =============================================================================
// VALIDATION SCHEMA (Arabic UI Validation)
// =============================================================================

const formSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب ويجب ألا يقل عن 3 أحرف"),
  organization: z.string().optional(),
  nationalId: z.string().optional(),
  email: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().email("البريد الإلكتروني المدخل غير صالح").optional().nullable()
  ),
  phone: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SponsorFormSheetProps {
  sponsor?: any // Present in edit mode
  trigger?: React.ReactNode
}

export function SponsorFormSheet({ sponsor, trigger }: SponsorFormSheetProps) {
  const isEditMode = !!sponsor
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      organization: "",
      nationalId: "",
      email: "",
      phone: "",
      country: "",
      notes: "",
    },
  })

  // Prepopulate form if in edit mode
  useEffect(() => {
    if (isEditMode && sponsor) {
      reset({
        fullName: sponsor.fullName,
        organization: sponsor.organization || "",
        nationalId: sponsor.nationalId || "",
        email: sponsor.email || "",
        phone: sponsor.phone || "",
        country: sponsor.country || "",
        notes: sponsor.notes || "",
      })
    } else if (open) {
      reset({
        fullName: "",
        organization: "",
        nationalId: "",
        email: "",
        phone: "",
        country: "",
        notes: "",
      })
    }
  }, [sponsor, isEditMode, open, reset])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = isEditMode
      ? await updateSponsor(sponsor.id, values)
      : await createSponsor(values)

    if (result.success) {
      setSuccessMsg(
        isEditMode ? "تم تحديث بيانات الكفيل بنجاح!" : "تم تسجيل الكفيل الجديد بنجاح!"
      )
      if (!isEditMode) reset()
      setTimeout(() => {
        setOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } else {
      setErrorMsg(result.error || "حدث خطأ غير متوقع. يرجى مراجعة الحقول والرموز المكررة.")
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-md shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]">
            <Plus className="h-4 w-4 text-slate-950 stroke-[3]" />
            <span>تسجيل كفيل جديد</span>
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
              {isEditMode ? (
                <>
                  <Edit className="h-5 w-5 text-emerald-400 animate-pulse" />
                  تعديل سجل الكفيل
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-emerald-400" />
                  تسجيل كفيل جديد بالنظام
                </>
              )}
            </SheetTitle>
            <SheetDescription className="text-slate-400 text-xs mt-1">
              أدخل كافة البيانات الشخصية والمهنية لكفيل الأيتام أو الأسر وجهات الاتصال.
            </SheetDescription>
          </div>
        </div>

        {/* Message Banners */}
        {successMsg && (
          <div className="bg-emerald-500/10 text-emerald-450 p-3 text-xs font-semibold flex items-center gap-2 border-b border-emerald-500/20">
            <AlertCircle className="h-4 w-4 text-emerald-400" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-500/10 text-rose-450 p-3 text-xs font-semibold flex items-center gap-2 border-b border-rose-500/20">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            {errorMsg}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                الاسم الكامل للكفيل *
              </label>
              <Input 
                placeholder="الاسم الرباعي للكفيل الفردي أو ممثل الجهة" 
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                {...register("fullName")} 
              />
              {errors.fullName && (
                <p className="text-xs font-semibold text-rose-400 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Organization / Corporate Sponsor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-slate-500" />
                الجهة / المنظمة الراعية (إن وجد)
              </label>
              <Input 
                placeholder="اسم الجمعية أو المنظمة التابع لها الكفيل" 
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                {...register("organization")} 
              />
            </div>

            {/* National ID / Registry code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                رقم الهوية الوطنية أو السجل التجاري
              </label>
              <Input 
                placeholder="رقم بطاقة التعريف الوطنية أو السجل" 
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                {...register("nationalId")} 
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                البريد الإلكتروني للكفيل
              </label>
              <Input 
                type="text" 
                placeholder="example@domain.com" 
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                {...register("email")} 
              />
              {errors.email && (
                <p className="text-xs font-semibold text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                رقم هاتف التواصل مع الكفيل
              </label>
              <Input 
                placeholder="مثال: 0096650123456" 
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                {...register("phone")} 
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-500" />
                دولة إقامة الكفيل
              </label>
              <Input 
                placeholder="مثال: اليمن، السعودية، قطر، الكويت" 
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                {...register("country")} 
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                ملاحظات إضافية حول الكفيل
              </label>
              <textarea
                rows={3}
                placeholder="سجل أي ملاحظات أو اتفاقيات تواصل خاصة بالكفيل..."
                {...register("notes")}
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
                <span>حفظ سجل الكفيل</span>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
