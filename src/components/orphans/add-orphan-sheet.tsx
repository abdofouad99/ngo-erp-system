"use client"

import { useState, useRef } from "react"
import {
  Plus, User, GraduationCap, Activity, CreditCard,
  AlertCircle, Loader2, Users, MapPin, Heart, ChevronLeft, ChevronRight, Check,
  Paperclip, Upload, Trash2, FileText, Image as ImageIcon, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription,
} from "@/components/ui/sheet"
import { createFullOrphan, updateFullOrphan } from "@/app/actions/orphan-full-actions"
import { uploadOrphanAttachment } from "@/app/actions/attachment-actions"
import { translateDocumentType } from "@/lib/attachment-utils"

// =============================================================================
// TYPES
// =============================================================================

interface AddOrphanSheetProps {
  families?:    { id: string; headFullName: string }[]
  createdById?: string
  isMarketer?:  boolean
  orphan?:      any          // بيانات اليتيم عند وضع التعديل
  trigger?:     React.ReactNode  // زر تشغيل مخصص
}

interface PendingFile {
  file:         File
  documentType: string
  description:  string
  preview:      string | null
}

// أنواع المستندات
const DOCUMENT_TYPES = [
  { value: "NATIONAL_ID",        label: "صورة الهوية الوطنية" },
  { value: "BIRTH_CERTIFICATE",  label: "شهادة الميلاد" },
  { value: "DEATH_CERTIFICATE",  label: "شهادة الوفاة" },
  { value: "DISABILITY_CARD",    label: "بطاقة الإعاقة" },
  { value: "FIELD_PHOTO",        label: "صورة ميدانية" },
  { value: "MEDICAL_REPORT",     label: "تقرير طبي" },
  { value: "OTHER",              label: "مستند آخر" },
]

// خطوات النموذج
const STEPS = [
  { id: 1, label: "التعريف والحسابات", icon: CreditCard },
  { id: 2, label: "البيانات الشخصية",  icon: User },
  { id: 3, label: "التعليم والصحة",    icon: GraduationCap },
  { id: 4, label: "التيتم والأسرة",    icon: Heart },
  { id: 5, label: "المعيل",            icon: Users },
  { id: 6, label: "الإخوة",            icon: Users },
  { id: 7, label: "المعرِّف والتسويق", icon: MapPin },
  { id: 8, label: "المستندات والمرفقات", icon: Paperclip },
]

// =============================================================================
// HELPERS
// =============================================================================

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "bg-slate-900/40 border-slate-700 text-white text-sm h-9 rounded-lg focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
const selectCls = "flex h-9 w-full rounded-lg border border-slate-700 bg-slate-900/40 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-extrabold text-emerald-400 border-b border-emerald-500/20 pb-1">{children}</h4>
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AddOrphanSheet({ families = [], createdById, isMarketer, orphan, trigger }: AddOrphanSheetProps) {
  const isEditMode = !!orphan

  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Form State (مع تهيئة من بيانات اليتيم في وضع التعديل) ────────────────
  const [form, setForm] = useState({
    familyId:          orphan?.familyId || "",
    orphanCode:        orphan?.orphanCode || "",
    kuraimiAccount:    orphan?.kuraimiAccount || "",
    kuraimiAccountOld: orphan?.kuraimiAccountOld || "",
    mumaiyo:           orphan?.mumaiyo || "",
    baitZakatNumber:   orphan?.baitZakatNumber || "",
    fullName:          orphan?.fullName || "",
    shortName:         orphan?.shortName || "",
    gender:            orphan?.gender || "MALE",
    birthdate:         orphan?.birthdate ? new Date(orphan.birthdate).toISOString().split("T")[0] : "",
    nationalId:        orphan?.nationalId || "",
    religion:          orphan?.religion || "",
    fatherFullName:    orphan?.fatherFullName || "",
    motherName:        orphan?.motherName || "",
    educationLevel:    orphan?.educationLevel || "",
    schoolName:        orphan?.schoolName || "",
    educationalStage:  orphan?.educationalStage || "",
    quranMemorization: orphan?.quranMemorization || "",
    healthStatus:      orphan?.healthStatus || "",
    disability:        orphan?.disability || false,
    disabilityType:    orphan?.disabilityType || "",
    disabilityDetails: orphan?.disabilityDetails || "",
    nutritionStatus:   orphan?.nutritionStatus || "",
    housingStatus:     orphan?.housingStatus || "",
    orphanType:        orphan?.orphanType || "FATHER",
    fatherDeathDate:   orphan?.fatherDeathDate ? new Date(orphan.fatherDeathDate).toISOString().split("T")[0] : "",
    fatherDeathCause:  orphan?.fatherDeathCause || "",
    motherDeathDate:   orphan?.motherDeathDate ? new Date(orphan.motherDeathDate).toISOString().split("T")[0] : "",
    birthGovernorate:  orphan?.birthGovernorate || "",
    birthDistrict:     orphan?.birthDistrict || "",
    birthVillage:      orphan?.birthVillage || "",
    birthArea:         orphan?.birthArea || "",
    referrerName:      orphan?.referrerName || "",
    referrerPhone1:    orphan?.referrerPhone1 || "",
    referrerPhone2:    orphan?.referrerPhone2 || "",
    marketedToOrg:     orphan?.marketedToOrg || "",
    notes:             orphan?.notes || "",
  })

  // ── Guardians (مع تهيئة في وضع التعديل) ────────────────────────────────
  const [guardians, setGuardians] = useState(
    orphan?.guardians?.length
      ? orphan.guardians.map((g: any) => ({
          fullName: g.fullName || "", nationalId: g.nationalId || "",
          relation: g.relation || "", occupation: g.occupation || "",
          phone1: g.phone1 || "", phone2: g.phone2 || "",
          phone3: g.phone3 || "", phone4: g.phone4 || "",
        }))
      : [{ fullName: "", nationalId: "", relation: "", occupation: "", phone1: "", phone2: "", phone3: "", phone4: "" }]
  )

  // ── Siblings (مع تهيئة في وضع التعديل) ─────────────────────────────────
  const [siblings, setSiblings] = useState<{ fullName: string; qualification: string; birthdate: string; socialStatus: string; gender: string }[]>(
    orphan?.siblings?.length
      ? orphan.siblings.map((s: any) => ({
          fullName: s.fullName || "", qualification: s.qualification || "",
          birthdate: s.birthdate ? new Date(s.birthdate).toISOString().split("T")[0] : "",
          socialStatus: s.socialStatus || "", gender: s.gender || "MALE",
        }))
      : []
  )

  // ── Pending Files (ملفات مراد رفعها) ─────────────────────────────────────
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [newFileType, setNewFileType] = useState("NATIONAL_ID")
  const [newFileDesc, setNewFileDesc] = useState("")
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const setF = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }))

  const resetForm = () => {
    setStep(1)
    setErrorMsg(null)
    setSuccessMsg(null)
    setPendingFiles([])
    setNewFileType("NATIONAL_ID")
    setNewFileDesc("")
    if (!isEditMode) {
      setForm({ familyId: "", orphanCode: "", kuraimiAccount: "", kuraimiAccountOld: "", mumaiyo: "", baitZakatNumber: "", fullName: "", shortName: "", gender: "MALE", birthdate: "", nationalId: "", religion: "", fatherFullName: "", motherName: "", educationLevel: "", schoolName: "", educationalStage: "", quranMemorization: "", healthStatus: "", disability: false, disabilityType: "", disabilityDetails: "", nutritionStatus: "", housingStatus: "", orphanType: "FATHER", fatherDeathDate: "", fatherDeathCause: "", motherDeathDate: "", birthGovernorate: "", birthDistrict: "", birthVillage: "", birthArea: "", referrerName: "", referrerPhone1: "", referrerPhone2: "", marketedToOrg: "", notes: "" })
      setGuardians([{ fullName: "", nationalId: "", relation: "", occupation: "", phone1: "", phone2: "", phone3: "", phone4: "" }])
      setSiblings([])
    }
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  // إضافة ملف جديد للقائمة المؤقتة
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("حجم الملف يتجاوز 5 ميغابايت")
      return
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("نوع الملف غير مدعوم. يُسمح بـ JPG, PNG, WEBP, PDF فقط")
      return
    }
    setErrorMsg(null)
    let preview: string | null = null
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file)
    }
    setPendingFiles(prev => [...prev, { file, documentType: newFileType, description: newFileDesc, preview }])
    setNewFileDesc("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!form.fullName)  { setErrorMsg("اسم اليتيم مطلوب"); return }
    if (!form.birthdate) { setErrorMsg("تاريخ الميلاد مطلوب"); return }
    if (!isMarketer && !form.familyId) { setErrorMsg("يرجى اختيار الأسرة"); return }

    setLoading(true)
    setErrorMsg(null)

    let result: any

    const payload = {
      ...form,
      gender:     form.gender as "MALE" | "FEMALE",
      orphanType: form.orphanType as "FATHER" | "MOTHER" | "BOTH",
      disability: form.disability,
      createdById,
      guardians:  guardians.filter((g: { fullName: string }) => g.fullName.trim()),
      siblings:   siblings.filter((s: { fullName: string }) => s.fullName.trim()),
    }

    if (isEditMode) {
      // وضع التعديل — إعادة الحالة لـ PENDING
      result = await updateFullOrphan(orphan.id, payload, true)
    } else {
      result = await createFullOrphan(payload)
    }

    // رفع المرفقات بعد إنشاء/تحديث اليتيم
    if (result.success && pendingFiles.length > 0) {
      const orphanId = isEditMode ? orphan.id : result.orphan?.id
      if (orphanId) {
        for (const pf of pendingFiles) {
          const fd = new FormData()
          fd.append("orphanId",     orphanId)
          fd.append("file",         pf.file)
          fd.append("documentType", pf.documentType)
          fd.append("description",  pf.description)
          await uploadOrphanAttachment(fd)
        }
      }
    }

    setLoading(false)

    if (result.success) {
      const name = form.fullName
      setSuccessMsg(isEditMode
        ? `✅ تم تحديث بيانات "${name}" وإعادة إرسال الطلب للمراجعة!`
        : `✅ تم إضافة اليتيم "${name}" بنجاح!`)
      setTimeout(() => { handleClose() }, 2000)
    } else {
      setErrorMsg(result.error || "فشل الحفظ")
    }
  }

  // =============================================================================
  // RENDER STEPS
  // =============================================================================

  const renderStep = () => {
    switch (step) {

      // ── STEP 1: أرقام التعريف والحسابات ─────────────────────────────────────
      case 1: return (
        <div className="space-y-4">
          {/* ربط الأسرة — مخفي للمسوق */}
          {!isMarketer && (
            <>
              <SectionTitle>ربط الأسرة</SectionTitle>
              <FieldRow label="الأسرة التابع لها اليتيم" required>
                <select value={form.familyId} onChange={e => setF("familyId", e.target.value)} className={selectCls}>
                  <option value="">-- اختر الأسرة --</option>
                  {families.map(f => <option key={f.id} value={f.id}>{f.headFullName}</option>)}
                </select>
              </FieldRow>
            </>
          )}

          {/* أرقام التعريف — مخفية للمسوق */}
          {!isMarketer && (
            <>
              <SectionTitle>أرقام التعريف (للمشرف فقط)</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="رقم ملف اليتيم (كود)">
                  <Input className={inputCls} placeholder="ORF-2026-001" value={form.orphanCode} onChange={e => setF("orphanCode", e.target.value)} />
                </FieldRow>
                <FieldRow label="رقم بيت الزكاة">
                  <Input className={inputCls} placeholder="رقم الملف في بيت الزكاة" value={form.baitZakatNumber} onChange={e => setF("baitZakatNumber", e.target.value)} />
                </FieldRow>
                <FieldRow label="رقم المميو كريمي">
                  <Input className={inputCls} placeholder="رقم المميو" value={form.mumaiyo} onChange={e => setF("mumaiyo", e.target.value)} />
                </FieldRow>
              </div>
            </>
          )}

          <SectionTitle>أرقام الحسابات</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="رقم الكريمي الجديد">
              <Input className={inputCls} placeholder="رقم حساب الكريمي" value={form.kuraimiAccount} onChange={e => setF("kuraimiAccount", e.target.value)} />
            </FieldRow>
            <FieldRow label="رقم الكريمي القديم">
              <Input className={inputCls} placeholder="الرقم القديم إن وجد" value={form.kuraimiAccountOld} onChange={e => setF("kuraimiAccountOld", e.target.value)} />
            </FieldRow>
          </div>

          {isMarketer && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3 text-xs text-blue-300">
              سيتم إنشاء ملف الأسرة تلقائياً بناءً على بيانات المعيل الذي ستدخله في الخطوة 5.
            </div>
          )}
        </div>
      )

      // ── STEP 2: البيانات الشخصية ─────────────────────────────────────────────
      case 2: return (
        <div className="space-y-4">
          <SectionTitle>البيانات الشخصية</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="الاسم الكامل" required>
              <Input className={inputCls} placeholder="الاسم الرباعي" value={form.fullName} onChange={e => setF("fullName", e.target.value)} />
            </FieldRow>
            <FieldRow label="الاسم المختصر للكشوفات">
              <Input className={inputCls} placeholder="اسم مختصر" value={form.shortName} onChange={e => setF("shortName", e.target.value)} />
            </FieldRow>
            <FieldRow label="الجنس" required>
              <select className={selectCls} value={form.gender} onChange={e => setF("gender", e.target.value)}>
                <option value="MALE">ذكر</option>
                <option value="FEMALE">أنثى</option>
              </select>
            </FieldRow>
            <FieldRow label="تاريخ الميلاد" required>
              <Input type="date" className={inputCls} value={form.birthdate} onChange={e => setF("birthdate", e.target.value)} />
            </FieldRow>
            <FieldRow label="رقم الهوية">
              <Input className={inputCls} placeholder="الرقم الوطني" value={form.nationalId} onChange={e => setF("nationalId", e.target.value)} />
            </FieldRow>
            <FieldRow label="الديانة">
              <Input className={inputCls} placeholder="إسلام / مسيحي..." value={form.religion} onChange={e => setF("religion", e.target.value)} />
            </FieldRow>
            <FieldRow label="اسم الوالد رباعياً">
              <Input className={inputCls} placeholder="الاسم الكامل للأب" value={form.fatherFullName} onChange={e => setF("fatherFullName", e.target.value)} />
            </FieldRow>
            <FieldRow label="اسم الأم">
              <Input className={inputCls} placeholder="الاسم الكامل للأم" value={form.motherName} onChange={e => setF("motherName", e.target.value)} />
            </FieldRow>
          </div>

          <SectionTitle>مكان الميلاد</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="المحافظة">
              <Input className={inputCls} placeholder="محافظة الميلاد" value={form.birthGovernorate} onChange={e => setF("birthGovernorate", e.target.value)} />
            </FieldRow>
            <FieldRow label="المديرية">
              <Input className={inputCls} placeholder="مديرية الميلاد" value={form.birthDistrict} onChange={e => setF("birthDistrict", e.target.value)} />
            </FieldRow>
            <FieldRow label="العزلة">
              <Input className={inputCls} placeholder="عزلة الميلاد" value={form.birthVillage} onChange={e => setF("birthVillage", e.target.value)} />
            </FieldRow>
            <FieldRow label="المنطقة">
              <Input className={inputCls} placeholder="منطقة الميلاد" value={form.birthArea} onChange={e => setF("birthArea", e.target.value)} />
            </FieldRow>
          </div>
        </div>
      )

      // ── STEP 3: التعليم والصحة والمعيشة ─────────────────────────────────────
      case 3: return (
        <div className="space-y-4">
          <SectionTitle>بيانات التعليم</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="المرحلة الدراسية">
              <Input className={inputCls} placeholder="ابتدائي / ثانوي..." value={form.educationalStage} onChange={e => setF("educationalStage", e.target.value)} />
            </FieldRow>
            <FieldRow label="الصف الدراسي">
              <Input className={inputCls} placeholder="مثال: الصف الثامن" value={form.educationLevel} onChange={e => setF("educationLevel", e.target.value)} />
            </FieldRow>
            <FieldRow label="اسم المدرسة">
              <Input className={inputCls} placeholder="المدرسة الحالية" value={form.schoolName} onChange={e => setF("schoolName", e.target.value)} />
            </FieldRow>
            <FieldRow label="مقدار الحفظ من القرآن">
              <Input className={inputCls} placeholder="مثال: جزء عم، ربع..." value={form.quranMemorization} onChange={e => setF("quranMemorization", e.target.value)} />
            </FieldRow>
          </div>

          <SectionTitle>الحالة الصحية</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="الحالة الصحية العامة">
              <Input className={inputCls} placeholder="سليم / مريض / ..." value={form.healthStatus} onChange={e => setF("healthStatus", e.target.value)} />
            </FieldRow>
            <FieldRow label="هل يعاني من إعاقة؟">
              <div className="flex items-center gap-2 h-9">
                <input type="checkbox" id="dis" checked={form.disability} onChange={e => setF("disability", e.target.checked)} className="h-4 w-4 rounded" />
                <label htmlFor="dis" className="text-xs text-slate-300 cursor-pointer">نعم، يوجد إعاقة</label>
              </div>
            </FieldRow>
            {form.disability && <>
              <FieldRow label="نوع الإعاقة">
                <Input className={inputCls} placeholder="حركية / بصرية / ..." value={form.disabilityType} onChange={e => setF("disabilityType", e.target.value)} />
              </FieldRow>
              <FieldRow label="تفاصيل الإعاقة">
                <Input className={inputCls} placeholder="تفاصيل إضافية" value={form.disabilityDetails} onChange={e => setF("disabilityDetails", e.target.value)} />
              </FieldRow>
            </>}
          </div>

          <SectionTitle>البيانات المعيشية</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="التغذية">
              <select className={selectCls} value={form.nutritionStatus} onChange={e => setF("nutritionStatus", e.target.value)}>
                <option value="">-- اختر --</option>
                <option value="جيدة">جيدة</option>
                <option value="عادية">عادية</option>
                <option value="سيئة">سيئة</option>
              </select>
            </FieldRow>
            <FieldRow label="وضع السكن">
              <select className={selectCls} value={form.housingStatus} onChange={e => setF("housingStatus", e.target.value)}>
                <option value="">-- اختر --</option>
                <option value="ملك">ملك</option>
                <option value="إيجار">إيجار</option>
                <option value="مع الأهل">مع الأهل</option>
              </select>
            </FieldRow>
          </div>
        </div>
      )

      // ── STEP 4: بيانات التيتم ────────────────────────────────────────────────
      case 4: return (
        <div className="space-y-4">
          <SectionTitle>تصنيف التيتم</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="نوع اليتيم" required>
              <select className={selectCls} value={form.orphanType} onChange={e => setF("orphanType", e.target.value)}>
                <option value="FATHER">يتيم الأب</option>
                <option value="MOTHER">يتيم الأم</option>
                <option value="BOTH">يتيم الأبوين</option>
              </select>
            </FieldRow>
          </div>

          {(form.orphanType === "FATHER" || form.orphanType === "BOTH") && <>
            <SectionTitle>بيانات وفاة الأب</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="تاريخ وفاة الأب">
                <Input type="date" className={inputCls} value={form.fatherDeathDate} onChange={e => setF("fatherDeathDate", e.target.value)} />
              </FieldRow>
              <FieldRow label="سبب وفاة الأب">
                <Input className={inputCls} placeholder="سبب الوفاة" value={form.fatherDeathCause} onChange={e => setF("fatherDeathCause", e.target.value)} />
              </FieldRow>
            </div>
          </>}

          {(form.orphanType === "MOTHER" || form.orphanType === "BOTH") && <>
            <SectionTitle>بيانات وفاة الأم</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="تاريخ وفاة الأم">
                <Input type="date" className={inputCls} value={form.motherDeathDate} onChange={e => setF("motherDeathDate", e.target.value)} />
              </FieldRow>
            </div>
          </>}

          <SectionTitle>ملاحظات</SectionTitle>
          <FieldRow label="ملاحظات إضافية">
            <textarea rows={3} className="flex w-full rounded-lg border border-slate-700 bg-slate-900/40 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right" placeholder="أي ملاحظات ميدانية..." value={form.notes} onChange={e => setF("notes", e.target.value)} />
          </FieldRow>
        </div>
      )

      // ── STEP 5: بيانات المعيل ────────────────────────────────────────────────
      case 5: return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>بيانات المعيلين</SectionTitle>
            {guardians.length < 2 && (
              <Button size="sm" variant="outline" onClick={() => setGuardians((p: typeof guardians) => [...p, { fullName: "", nationalId: "", relation: "", occupation: "", phone1: "", phone2: "", phone3: "", phone4: "" }])} className="text-xs h-7 border-slate-700 bg-slate-900/40 hover:bg-slate-800">
                <Plus className="h-3 w-3 ml-1" /> إضافة معيل ثانٍ
              </Button>
            )}
          </div>
          {isMarketer && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-300">
              بيانات المعيل الأول ستُستخدم تلقائياً لإنشاء ملف الأسرة إذا لم يكن مسجلاً مسبقاً.
            </div>
          )}
          {guardians.map((g: typeof guardians[0], i: number) => (
            <div key={i} className="border border-slate-700/60 rounded-xl p-3 space-y-3 bg-slate-900/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">{i === 0 ? "المعيل الأساسي" : "المعيل الثاني"}</span>
              {i > 0 && <button onClick={() => setGuardians((p: typeof guardians) => p.filter((_: typeof guardians[0], j: number) => j !== i))} className="text-red-400 text-xs hover:text-red-300">حذف</button>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="الاسم الكامل">
                  <Input className={inputCls} placeholder="اسم المعيل" value={g.fullName} onChange={e => setGuardians((p: typeof guardians) => p.map((x: typeof guardians[0], j: number) => j === i ? { ...x, fullName: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="رقم الهوية">
                  <Input className={inputCls} placeholder="رقم هوية المعيل" value={g.nationalId} onChange={e => setGuardians((p: typeof guardians) => p.map((x: typeof guardians[0], j: number) => j === i ? { ...x, nationalId: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="علاقته باليتيم">
                  <Input className={inputCls} placeholder="أخ / عم / خال..." value={g.relation} onChange={e => setGuardians((p: typeof guardians) => p.map((x: typeof guardians[0], j: number) => j === i ? { ...x, relation: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="عمله">
                  <Input className={inputCls} placeholder="المهنة" value={g.occupation} onChange={e => setGuardians((p: typeof guardians) => p.map((x: typeof guardians[0], j: number) => j === i ? { ...x, occupation: e.target.value } : x))} />
                </FieldRow>
                {["phone1", "phone2", "phone3", "phone4"].map((ph, pi) => (
                  <FieldRow key={ph} label={`هاتف ${pi + 1}`}>
                    <Input className={inputCls} placeholder={`رقم الهاتف ${pi + 1}`} value={(g as any)[ph]} onChange={e => setGuardians((p: typeof guardians) => p.map((x: typeof guardians[0], j: number) => j === i ? { ...x, [ph]: e.target.value } : x))} />
                  </FieldRow>
                ))}
              </div>
            </div>
          ))}
        </div>
      )

      // ── STEP 6: بيانات الإخوة ────────────────────────────────────────────────
      case 6: return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>بيانات الإخوة والأخوات (حتى 7)</SectionTitle>
            {siblings.length < 7 && (
              <Button size="sm" variant="outline" onClick={() => setSiblings(p => [...p, { fullName: "", qualification: "", birthdate: "", socialStatus: "", gender: "MALE" }])} className="text-xs h-7 border-slate-700 bg-slate-900/40 hover:bg-slate-800">
                <Plus className="h-3 w-3 ml-1" /> إضافة أخ
              </Button>
            )}
          </div>
          {siblings.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">
              لا يوجد إخوة مسجلون — اضغط "إضافة أخ" لإضافة بيانات الإخوة
            </div>
          )}
          {siblings.map((s, i) => (
            <div key={i} className="border border-slate-700/60 rounded-xl p-3 space-y-3 bg-slate-900/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">الأخ/الأخت {i + 1}</span>
                <button onClick={() => setSiblings(p => p.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-300">حذف</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="الاسم">
                  <Input className={inputCls} placeholder="اسم الأخ/الأخت" value={s.fullName} onChange={e => setSiblings(p => p.map((x, j) => j === i ? { ...x, fullName: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="الجنس">
                  <select className={selectCls} value={s.gender} onChange={e => setSiblings(p => p.map((x, j) => j === i ? { ...x, gender: e.target.value } : x))}>
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </FieldRow>
                <FieldRow label="المؤهل">
                  <Input className={inputCls} placeholder="دراسي / جامعي / ..." value={s.qualification} onChange={e => setSiblings(p => p.map((x, j) => j === i ? { ...x, qualification: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="تاريخ الميلاد">
                  <Input type="date" className={inputCls} value={s.birthdate} onChange={e => setSiblings(p => p.map((x, j) => j === i ? { ...x, birthdate: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="الحالة الاجتماعية">
                  <Input className={inputCls} placeholder="أعزب / متزوج / ..." value={s.socialStatus} onChange={e => setSiblings(p => p.map((x, j) => j === i ? { ...x, socialStatus: e.target.value } : x))} />
                </FieldRow>
              </div>
            </div>
          ))}
        </div>
      )

      // ── STEP 7: المعرِّف والتسويق ─────────────────────────────────────────────
      case 7: return (
        <div className="space-y-4">
          <SectionTitle>بيانات المعرِّف</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="اسم المعرِّف">
              <Input className={inputCls} placeholder="من عرّف اليتيم" value={form.referrerName} onChange={e => setF("referrerName", e.target.value)} />
            </FieldRow>
            <FieldRow label="هاتف المعرِّف 1">
              <Input className={inputCls} placeholder="رقم الهاتف" value={form.referrerPhone1} onChange={e => setF("referrerPhone1", e.target.value)} />
            </FieldRow>
            <FieldRow label="هاتف المعرِّف 2">
              <Input className={inputCls} placeholder="رقم هاتف بديل" value={form.referrerPhone2} onChange={e => setF("referrerPhone2", e.target.value)} />
            </FieldRow>
          </div>

          <SectionTitle>التسويق والكفالة</SectionTitle>
          <div className="grid grid-cols-1 gap-3">
            <FieldRow label="الجهة المسوَّق لها">
              <Input className={inputCls} placeholder="مثال: بيت الزكاة الكويتي" value={form.marketedToOrg} onChange={e => setF("marketedToOrg", e.target.value)} />
            </FieldRow>
          </div>
        </div>
      )

      // ── STEP 8: المستندات والمرفقات ──────────────────────────────────────────
      case 8: return (
        <div className="space-y-5">
          <SectionTitle>رفع المستندات والوثائق الرسمية</SectionTitle>

          {/* نموذج إضافة ملف */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="نوع الوثيقة">
                <select className={selectCls} value={newFileType} onChange={e => setNewFileType(e.target.value)}>
                  {DOCUMENT_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="وصف الملف (اختياري)">
                <Input className={inputCls} placeholder="مثال: هوية والد اليتيم" value={newFileDesc} onChange={e => setNewFileDesc(e.target.value)} />
              </FieldRow>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/40 py-6 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-all duration-200 cursor-pointer"
            >
              <Upload className="h-7 w-7" />
              <span className="text-xs font-bold">اضغط لاختيار ملف</span>
              <span className="text-[10px] text-slate-500">JPG, PNG, WEBP, PDF — الحد الأقصى 5 ميغابايت</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* قائمة الملفات المضافة */}
          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400">الملفات المضافة ({pendingFiles.length})</p>
              {pendingFiles.map((pf, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
                  {pf.preview ? (
                    <button onClick={() => setLightboxSrc(pf.preview)} className="flex-shrink-0">
                      <img src={pf.preview} alt="" className="h-12 w-12 rounded-lg object-cover border border-slate-700 hover:border-emerald-500 transition-colors" />
                    </button>
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{pf.file.name}</p>
                    <p className="text-[10px] text-emerald-400">{translateDocumentType(pf.documentType)}</p>
                    {pf.description && <p className="text-[10px] text-slate-500 truncate">{pf.description}</p>}
                    <p className="text-[10px] text-slate-600">{(pf.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => setPendingFiles(p => {
                      const removed = p[idx]
                      if (removed.preview) URL.revokeObjectURL(removed.preview)
                      return p.filter((_, i) => i !== idx)
                    })}
                    className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingFiles.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-700 rounded-xl">
              لم تتم إضافة أي مستندات بعد. يمكنك تخطي هذه الخطوة وإضافة المستندات لاحقاً.
            </div>
          )}

          {/* Lightbox للصور */}
          {lightboxSrc && (
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setLightboxSrc(null)}
            >
              <img src={lightboxSrc} alt="" className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl" />
              <button className="absolute top-4 left-4 text-white text-2xl font-bold bg-black/40 rounded-full h-10 w-10 flex items-center justify-center hover:bg-black/60">✕</button>
            </div>
          )}
        </div>
      )

      default: return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full sm:w-auto btn-premium gap-2">
            <Plus className="h-4 w-4" />
            <span>{isEditMode ? "تعديل الطلب" : "إضافة يتيم جديد"}</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 to-teal-700 p-5 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <SheetTitle className="text-white text-base font-bold">
            {isEditMode ? "تعديل وإعادة إرسال الطلب" : "تسجيل يتيم جديد"} — الخطوة {step} من {STEPS.length}
          </SheetTitle>
          <SheetDescription className="text-emerald-100 text-xs mt-1">{STEPS[step - 1].label}</SheetDescription>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
          {/* Step pills */}
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {STEPS.map((s) => (
              <button key={s.id} onClick={() => setStep(s.id)} className={`flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${step === s.id ? "bg-white text-emerald-700" : step > s.id ? "bg-white/30 text-white" : "bg-white/10 text-white/60"}`}>
                {step > s.id ? <Check className="h-3 w-3 inline" /> : s.id} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        {successMsg && <div className="bg-emerald-950/60 text-emerald-400 p-3 text-xs font-semibold flex items-center gap-2 border-b border-emerald-500/20"><AlertCircle className="h-4 w-4" />{successMsg}</div>}
        {errorMsg   && <div className="bg-red-950/60 text-red-400 p-3 text-xs font-semibold flex items-center gap-2 border-b border-red-500/20"><AlertCircle className="h-4 w-4" />{errorMsg}</div>}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {renderStep()}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-border flex-shrink-0 flex items-center justify-between gap-2 bg-slate-950/80">
          <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : setOpen(false)} className="gap-1 rounded-xl border-border bg-slate-900/40 text-slate-300 hover:bg-slate-800">
            <ChevronRight className="h-4 w-4" />
            {step > 1 ? "السابق" : "إلغاء"}
          </Button>

          <span className="text-xs text-slate-500">{step} / {STEPS.length}</span>

          {step < STEPS.length ? (
            <Button type="button" onClick={() => setStep(s => s + 1)} className="gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading} className="gap-1 btn-premium px-6">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</> : <><Check className="h-4 w-4" /> {isEditMode ? "إعادة إرسال الطلب" : "حفظ البيانات"}</>}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
