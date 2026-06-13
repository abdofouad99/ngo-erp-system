"use client"

import { useState } from "react"
import {
  Plus, User, GraduationCap, Activity, CreditCard,
  AlertCircle, Loader2, Users, MapPin, Heart, ChevronLeft, ChevronRight, Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription,
} from "@/components/ui/sheet"
import { createFullOrphan } from "@/app/actions/orphan-full-actions"

// =============================================================================
// TYPES
// =============================================================================

interface AddOrphanSheetProps {
  families: { id: string; headFullName: string }[]
  createdById?: string
}

// خطوات النموذج
const STEPS = [
  { id: 1, label: "التعريف والحسابات", icon: CreditCard },
  { id: 2, label: "البيانات الشخصية",  icon: User },
  { id: 3, label: "التعليم والصحة",    icon: GraduationCap },
  { id: 4, label: "التيتم والأسرة",    icon: Heart },
  { id: 5, label: "المعيل",            icon: Users },
  { id: 6, label: "الإخوة",            icon: Users },
  { id: 7, label: "المعرِّف والتسويق", icon: MapPin },
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

// =============================================================================
// COMPONENT
// =============================================================================

export function AddOrphanSheet({ families, createdById }: AddOrphanSheetProps) {
  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg]   = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Form State ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    familyId: "", orphanCode: "", kuraimiAccount: "", kuraimiAccountOld: "",
    mumaiyo: "", baitZakatNumber: "",
    fullName: "", shortName: "", gender: "MALE", birthdate: "", nationalId: "", religion: "",
    fatherFullName: "", motherName: "",
    educationLevel: "", schoolName: "", educationalStage: "", quranMemorization: "",
    healthStatus: "", disability: false, disabilityType: "", disabilityDetails: "",
    nutritionStatus: "", housingStatus: "",
    orphanType: "FATHER", fatherDeathDate: "", fatherDeathCause: "", motherDeathDate: "",
    birthGovernorate: "", birthDistrict: "", birthVillage: "", birthArea: "",
    referrerName: "", referrerPhone1: "", referrerPhone2: "",
    marketedToOrg: "", notes: "",
  })

  // ── Guardians ───────────────────────────────────────────────────────────────
  const [guardians, setGuardians] = useState([
    { fullName: "", nationalId: "", relation: "", occupation: "", phone1: "", phone2: "", phone3: "", phone4: "" }
  ])

  // ── Siblings ────────────────────────────────────────────────────────────────
  const [siblings, setSiblings] = useState<{ fullName: string; qualification: string; birthdate: string; socialStatus: string; gender: string }[]>([])

  const setF = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }))

  const handleClose = () => {
    setOpen(false)
    setStep(1)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleSubmit = async () => {
    if (!form.familyId) { setErrorMsg("يرجى اختيار الأسرة"); return }
    if (!form.fullName)  { setErrorMsg("اسم اليتيم مطلوب"); return }
    if (!form.birthdate) { setErrorMsg("تاريخ الميلاد مطلوب"); return }

    setLoading(true)
    setErrorMsg(null)

    const result = await createFullOrphan({
      ...form,
      gender:     form.gender as "MALE" | "FEMALE",
      orphanType: form.orphanType as "FATHER" | "MOTHER" | "BOTH",
      disability: form.disability,
      createdById,
      guardians:  guardians.filter(g => g.fullName.trim()),
      siblings:   siblings.filter(s => s.fullName.trim()),
    })

    setLoading(false)

    if (result.success) {
      setSuccessMsg(`✅ تم إضافة اليتيم "${form.fullName}" بنجاح!`)
      setTimeout(() => { handleClose() }, 1800)
    } else {
      setErrorMsg(result.error || "فشل الحفظ")
    }
  }

  // =============================================================================
  // RENDER STEPS
  // =============================================================================

  const renderStep = () => {
    switch (step) {

      // ── STEP 1: أرقام التعريف والحسابات ───────────────────────────────────
      case 1: return (
        <div className="space-y-4">
          <SectionTitle>ربط الأسرة</SectionTitle>
          <FieldRow label="الأسرة التابع لها اليتيم" required>
            <select value={form.familyId} onChange={e => setF("familyId", e.target.value)} className={selectCls}>
              <option value="">-- اختر الأسرة --</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.headFullName}</option>)}
            </select>
          </FieldRow>

          <SectionTitle>أرقام التعريف</SectionTitle>
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
            <FieldRow label="رقم الكريمي الجديد">
              <Input className={inputCls} placeholder="رقم حساب الكريمي" value={form.kuraimiAccount} onChange={e => setF("kuraimiAccount", e.target.value)} />
            </FieldRow>
            <FieldRow label="رقم الكريمي القديم">
              <Input className={inputCls} placeholder="الرقم القديم إن وجد" value={form.kuraimiAccountOld} onChange={e => setF("kuraimiAccountOld", e.target.value)} />
            </FieldRow>
          </div>
        </div>
      )

      // ── STEP 2: البيانات الشخصية ───────────────────────────────────────────
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

      // ── STEP 3: التعليم والصحة والمعيشة ───────────────────────────────────
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

      // ── STEP 4: بيانات التيتم ──────────────────────────────────────────────
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

      // ── STEP 5: بيانات المعيل ──────────────────────────────────────────────
      case 5: return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>بيانات المعيلين</SectionTitle>
            {guardians.length < 2 && (
              <Button size="sm" variant="outline" onClick={() => setGuardians(p => [...p, { fullName: "", nationalId: "", relation: "", occupation: "", phone1: "", phone2: "", phone3: "", phone4: "" }])} className="text-xs h-7 border-slate-700 bg-slate-900/40 hover:bg-slate-800">
                <Plus className="h-3 w-3 ml-1" /> إضافة معيل ثانٍ
              </Button>
            )}
          </div>

          {guardians.map((g, i) => (
            <div key={i} className="border border-slate-700/60 rounded-xl p-3 space-y-3 bg-slate-900/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">{i === 0 ? "المعيل الأساسي" : "المعيل الثاني"}</span>
                {i > 0 && <button onClick={() => setGuardians(p => p.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-300">حذف</button>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="الاسم الكامل">
                  <Input className={inputCls} placeholder="اسم المعيل" value={g.fullName} onChange={e => setGuardians(p => p.map((x, j) => j === i ? { ...x, fullName: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="رقم الهوية">
                  <Input className={inputCls} placeholder="رقم هوية المعيل" value={g.nationalId} onChange={e => setGuardians(p => p.map((x, j) => j === i ? { ...x, nationalId: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="علاقته باليتيم">
                  <Input className={inputCls} placeholder="أخ / عم / خال..." value={g.relation} onChange={e => setGuardians(p => p.map((x, j) => j === i ? { ...x, relation: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="عمله">
                  <Input className={inputCls} placeholder="المهنة" value={g.occupation} onChange={e => setGuardians(p => p.map((x, j) => j === i ? { ...x, occupation: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="هاتف 1">
                  <Input className={inputCls} placeholder="رقم الهاتف الأول" value={g.phone1} onChange={e => setGuardians(p => p.map((x, j) => j === i ? { ...x, phone1: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="هاتف 2">
                  <Input className={inputCls} placeholder="رقم الهاتف الثاني" value={g.phone2} onChange={e => setGuardians(p => p.map((x, j) => j === i ? { ...x, phone2: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="هاتف 3">
                  <Input className={inputCls} placeholder="رقم الهاتف الثالث" value={g.phone3} onChange={e => setGuardians(p => p.map((x, j) => j === i ? { ...x, phone3: e.target.value } : x))} />
                </FieldRow>
                <FieldRow label="هاتف 4">
                  <Input className={inputCls} placeholder="رقم الهاتف الرابع" value={g.phone4} onChange={e => setGuardians(p => p.map((x, j) => j === i ? { ...x, phone4: e.target.value } : x))} />
                </FieldRow>
              </div>
            </div>
          ))}
        </div>
      )

      // ── STEP 6: بيانات الإخوة ─────────────────────────────────────────────
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

      // ── STEP 7: المعرِّف والتسويق ──────────────────────────────────────────
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

      default: return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full sm:w-auto btn-premium gap-2">
          <Plus className="h-4 w-4" />
          <span>إضافة يتيم جديد</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 to-teal-700 p-5 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <SheetTitle className="text-white text-base font-bold">تسجيل يتيم جديد — الخطوة {step} من {STEPS.length}</SheetTitle>
          <SheetDescription className="text-emerald-100 text-xs mt-1">{STEPS[step - 1].label}</SheetDescription>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
          {/* Step pills */}
          <div className="mt-3 flex gap-1 overflow-x-auto">
            {STEPS.map((s, i) => (
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
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</> : <><Check className="h-4 w-4" /> حفظ البيانات</>}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// =============================================================================
// SECTION TITLE HELPER
// =============================================================================
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-extrabold text-emerald-400 border-b border-emerald-500/20 pb-1">{children}</h4>
}
