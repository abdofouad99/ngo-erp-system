"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Folder,
  User,
  Layers,
  ShoppingBag,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
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
import { createDistribution } from "@/app/actions/project-actions"
import { Separator } from "@/components/ui/separator"

// =============================================================================
// VALIDATION SCHEMA (Arabic UI Validation)
// =============================================================================

const formSchema = z.object({
  projectId: z.string().min(1, "يرجى اختيار المشروع"),
  beneficiaryId: z.string().min(1, "يرجى اختيار المستفيد المستهدف"),
  batchNumber: z.string().min(1, "رقم الدفعة مطلوب").transform((val) => Number(val)).refine((val) => val >= 1, {
    message: "رقم الدفعة لا يقل عن 1",
  }),
  deliveredItem: z.string().min(1, "يرجى تحديد المادة أو المساعدة الموزعة"),
  quantity: z.string().min(1, "الكمية مطلوبة").transform((val) => Number(val)).refine((val) => val >= 1, {
    message: "الكمية لا تقل عن 1",
  }),
  unitValue: z.string().optional().transform((val) => (val === "" ? null : Number(val))).refine((val) => val === null || val >= 0, {
    message: "القيمة المفردة لا تقل عن 0",
  }),
  currency: z.enum(["USD", "SAR", "YER", "EUR", "TRY", "IQD", "SYP"], {
    errorMap: () => ({ message: "يرجى تحديد العملة" }),
  }),
  isDelivered: z.boolean().default(false),
  deliveryNotes: z.string().optional(),
  deliveryDate: z.string().optional().nullable().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface DistributionFormSheetProps {
  projects: { id: string; name: string; currency: string }[]
  beneficiaries: { id: string; fullName: string }[]
  trigger?: React.ReactNode
}

export function DistributionFormSheet({
  projects,
  beneficiaries,
  trigger,
}: DistributionFormSheetProps) {
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
      projectId: "",
      beneficiaryId: "",
      batchNumber: "1" as any,
      deliveredItem: "",
      quantity: "1" as any,
      unitValue: undefined as any,
      currency: "USD",
      isDelivered: false,
      deliveryNotes: "",
      deliveryDate: new Date().toISOString().split("T")[0],
    },
  })

  // Watch selected project to pre-populate currency
  const watchedProjectId = watch("projectId")

  useEffect(() => {
    if (watchedProjectId) {
      const matched = projects.find((p) => p.id === watchedProjectId)
      if (matched) {
        setValue("currency", matched.currency as any)
      }
    }
  }, [watchedProjectId, projects, setValue])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = await createDistribution(values)

    if (result.success) {
      setSuccessMsg("تم تسجيل وتوثيق كشف التوزيع بنجاح!")
      reset()
      setTimeout(() => {
        setOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } else {
      setErrorMsg(result.error || "حدث خطأ غير متوقع أثناء تسجيل التوزيع.")
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-md shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]">
            <Plus className="h-4 w-4 text-slate-950 stroke-[3]" />
            <span>تسجيل توزيع جديد</span>
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
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              تسجيل توزيع جديد للأفراد
            </SheetTitle>
            <SheetDescription className="text-slate-400 text-xs mt-1">
              ربط مستفيد بمشروع إغاثي نشط وتدوين الدفعة والمادة وحالة التسليم الميداني.
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
          <div className="bg-rose-500/10 text-rose-455 p-3 text-xs font-semibold flex items-center gap-2 border-b border-rose-500/20">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            {errorMsg}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Project Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-slate-500" />
                المشروع الإغاثي / المالي *
              </label>
              <select
                {...register("projectId")}
                className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-255 font-semibold cursor-pointer"
              >
                <option value="" className="bg-slate-950 text-white">-- اختر المشروع --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-xs font-semibold text-rose-455 mt-1">{errors.projectId.message}</p>
              )}
            </div>

            {/* Beneficiary Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                المستفيد المستلم *
              </label>
              <select
                {...register("beneficiaryId")}
                className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 cursor-pointer"
              >
                <option value="" className="bg-slate-950 text-white">-- اختر المستفيد --</option>
                {beneficiaries.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-950 text-white">
                    {b.fullName}
                  </option>
                ))}
              </select>
              {errors.beneficiaryId && (
                <p className="text-xs font-semibold text-rose-455 mt-1">{errors.beneficiaryId.message}</p>
              )}
            </div>

            <Separator className="bg-slate-900 my-2" />

            <div className="grid grid-cols-3 gap-3">
              {/* Batch Number */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  رقم الدفعة *
                </label>
                <Input 
                  type="number" 
                  placeholder="مثال: 1" 
                  className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  {...register("batchNumber")} 
                />
                {errors.batchNumber && (
                  <p className="text-xs font-semibold text-rose-455 mt-1">{errors.batchNumber.message}</p>
                )}
              </div>

              {/* Delivered Item */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
                  المادة أو المساعدة الموزعة *
                </label>
                <Input 
                  placeholder="مثال: سلة غذائية 15كج، أو $50 نقدي" 
                  className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  {...register("deliveredItem")} 
                />
                {errors.deliveredItem && (
                  <p className="text-xs font-semibold text-rose-455 mt-1">{errors.deliveredItem.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">الكمية *</label>
                <Input 
                  type="number" 
                  placeholder="1" 
                  className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  {...register("quantity")} 
                />
                {errors.quantity && (
                  <p className="text-xs font-semibold text-rose-455 mt-1">{errors.quantity.message}</p>
                )}
              </div>

              {/* Unit Value */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                  القيمة المفردة
                </label>
                <Input 
                  type="number" 
                  placeholder="القيمة" 
                  className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  {...register("unitValue")} 
                />
                {errors.unitValue && (
                  <p className="text-xs font-semibold text-rose-455 mt-1">{errors.unitValue.message}</p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">العملة</label>
                <select
                  {...register("currency")}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="USD" className="bg-slate-950 text-white">USD ($)</option>
                  <option value="SAR" className="bg-slate-950 text-white">SAR (ر.س)</option>
                  <option value="YER" className="bg-slate-950 text-white">YER (ر.ي)</option>
                  <option value="EUR" className="bg-slate-950 text-white">EUR (€)</option>
                </select>
              </div>
            </div>

            <Separator className="bg-slate-900 my-1" />

            {/* Is Delivered Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">حالة التسليم الميداني</label>
              <div className="flex items-center gap-2 h-10 bg-slate-900/40 px-3 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="isDelivered"
                  {...register("isDelivered")}
                  className="rounded border-slate-800 text-emerald-500 bg-slate-950 focus:ring-emerald-500/50 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="isDelivered" className="text-xs font-bold text-slate-350 cursor-pointer">
                  تم تسليم الحصة للمستفيد بنجاح
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Delivery Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  تاريخ التسليم
                </label>
                <Input 
                  type="date" 
                  className="bg-slate-900/60 border-slate-800 text-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 dark:[color-scheme:dark]"
                  {...register("deliveryDate")} 
                />
              </div>

              {/* Delivery Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  ملاحظات الاستلام والتوقيعات
                </label>
                <textarea
                  rows={3}
                  placeholder="سجل ملاحظات الاستلام (رقم سند، توقيع، مستلم بديل)..."
                  {...register("deliveryNotes")}
                  className="flex w-full rounded-xl border border-slate-800 bg-slate-900/60 text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 text-right px-3 py-2 text-sm focus-visible:outline-none transition-all duration-200"
                />
              </div>
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
                <span>حفظ التسليم</span>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
