"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Edit,
  Folder,
  DollarSign,
  Users,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  Package,
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
import { createProject, updateProject } from "@/app/actions/project-actions"

// =============================================================================
// VALIDATION SCHEMA (Arabic UI Validation)
// =============================================================================

const formSchema = z.object({
  name: z.string().min(3, "اسم المشروع مطلوب ويجب ألا يقل عن 3 أحرف"),
  category: z.enum(["CASH", "IN_KIND", "TRAINING", "MEDICAL", "OTHER"], {
    errorMap: () => ({ message: "يرجى تحديد تصنيف المشروع" }),
  }),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "SUSPENDED", "CANCELLED"], {
    errorMap: () => ({ message: "يرجى تحديد حالة المشروع" }),
  }),
  budget: z.string().optional().transform((val) => (val === "" ? null : Number(val))).refine((val) => val === null || val >= 0, {
    message: "الميزانية لا تقل عن 0",
  }),
  currency: z.enum(["USD", "SAR", "YER", "EUR", "TRY", "IQD", "SYP"], {
    errorMap: () => ({ message: "يرجى تحديد العملة" }),
  }),
  targetCount: z.string().optional().transform((val) => (val === "" ? null : Number(val))).refine((val) => val === null || val >= 1, {
    message: "عدد المستهدفين لا يقل عن 1 مستفيد",
  }),
  startDate: z.string().optional().nullable().or(z.literal("")),
  endDate: z.string().optional().nullable().or(z.literal("")),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ProjectFormSheetProps {
  project?: any // Present in edit mode
  trigger?: React.ReactNode
}

export function ProjectFormSheet({ project, trigger }: ProjectFormSheetProps) {
  const isEditMode = !!project
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
      name: "",
      category: "IN_KIND",
      status: "DRAFT",
      budget: undefined as any,
      currency: "USD",
      targetCount: undefined as any,
      startDate: "",
      endDate: "",
      description: "",
    },
  })

  // Prepopulate form if in edit mode
  useEffect(() => {
    if (isEditMode && project) {
      reset({
        name: project.name,
        category: project.category,
        status: project.status,
        budget: project.budget !== null ? project.budget.toString() : ("" as any),
        currency: project.currency,
        targetCount: project.targetCount !== null ? project.targetCount.toString() : ("" as any),
        startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
        description: project.description || "",
      })
    } else if (open) {
      reset({
        name: "",
        category: "IN_KIND",
        status: "DRAFT",
        budget: undefined as any,
        currency: "USD",
        targetCount: undefined as any,
        startDate: "",
        endDate: "",
        description: "",
      })
    }
  }, [project, isEditMode, open, reset])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = isEditMode
      ? await updateProject(project.id, values)
      : await createProject(values)

    if (result.success) {
      setSuccessMsg(
        isEditMode ? "تم تحديث بيانات المشروع بنجاح!" : "تم تسجيل المشروع الجديد بنجاح!"
      )
      if (!isEditMode) reset()
      setTimeout(() => {
        setOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } else {
      setErrorMsg(result.error || "حدث خطأ غير متوقع أثناء حفظ المشروع.")
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-md shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]">
            <Plus className="h-4 w-4 text-slate-950 stroke-[3]" />
            <span>إنشاء مشروع جديد</span>
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
                  تعديل سجل المشروع
                </>
              ) : (
                <>
                  <Package className="h-5 w-5 text-emerald-400" />
                  تسجيل مشروع جديد
                </>
              )}
            </SheetTitle>
            <SheetDescription className="text-slate-400 text-xs mt-1">
              أدخل البيانات التعريفية والمالية والتواريخ الزمنية لمشروع الدعم.
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
            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-slate-500" />
                اسم المشروع *
              </label>
              <Input 
                placeholder="مثال: مشروع كسوة العيد للأيتام 2026" 
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                {...register("name")} 
              />
              {errors.name && (
                <p className="text-xs font-semibold text-rose-455 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">تصنيف وفئة المشروع *</label>
                <select
                  {...register("category")}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="IN_KIND" className="bg-slate-950 text-white">عيني (سلال، ملابس)</option>
                  <option value="CASH" className="bg-slate-950 text-white">نقدي (حوالات مالية)</option>
                  <option value="MEDICAL" className="bg-slate-950 text-white">طبي (علاجات، عمليات)</option>
                  <option value="TRAINING" className="bg-slate-950 text-white">تأهيلي (دورات، تمكين)</option>
                  <option value="OTHER" className="bg-slate-950 text-white">أخرى</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">حالة التنفيذ الحالية *</label>
                <select
                  {...register("status")}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-right text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="DRAFT" className="bg-slate-950 text-white">مسودة (تخطيط)</option>
                  <option value="ACTIVE" className="bg-slate-950 text-white">نشط (قيد التنفيذ)</option>
                  <option value="COMPLETED" className="bg-slate-950 text-white">مكتمل</option>
                  <option value="SUSPENDED" className="bg-slate-950 text-white">موقوف مؤقتاً</option>
                  <option value="CANCELLED" className="bg-slate-950 text-white">ملغى</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Budget */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                  ميزانية المشروع المقررة
                </label>
                <Input 
                  type="number" 
                  placeholder="الميزانية الإجمالية" 
                  className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  {...register("budget")} 
                />
                {errors.budget && (
                  <p className="text-xs font-semibold text-rose-455 mt-1">{errors.budget.message}</p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">العملة *</label>
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

            {/* Target Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                العدد المستهدف (مستفيد)
              </label>
              <Input 
                type="number" 
                placeholder="مثال: 500" 
                className="bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                {...register("targetCount")} 
              />
              {errors.targetCount && (
                <p className="text-xs font-semibold text-rose-455 mt-1">{errors.targetCount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  تاريخ بدء المشروع
                </label>
                <Input 
                  type="date" 
                  className="bg-slate-900/60 border-slate-800 text-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 dark:[color-scheme:dark]"
                  {...register("startDate")} 
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  تاريخ انتهاء المشروع
                </label>
                <Input 
                  type="date" 
                  className="bg-slate-900/60 border-slate-800 text-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 dark:[color-scheme:dark]"
                  {...register("endDate")} 
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                وصف وتفاصيل المشروع
              </label>
              <textarea
                rows={4}
                placeholder="اكتب نبذة مختصرة عن نطاق المشروع وموقع تنفيذه..."
                {...register("description")}
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
                <span>حفظ بيانات المشروع</span>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
