"use client"

import { useState, useEffect, use } from "react"
import { getUpdateRequestByToken, submitUpdateRequest, type UpdateData } from "@/app/actions/update-request-actions"
import { CheckCircle, AlertCircle, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react"

interface PageProps {
  params: Promise<{ token: string }>
}

export default function UpdatePage({ params }: PageProps) {
  const unwrappedParams = use(params)
  const token = unwrappedParams.token

  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [request, setRequest]       = useState<any>(null)
  const [orphan, setOrphan]         = useState<any>(null)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)
  const [submitterName, setSubmitterName] = useState("")
  const [openSection, setOpenSection] = useState<string>("education")

  // حالة النموذج — الحقول المسموح بها فقط
  const [form, setForm] = useState<UpdateData & { guardian: any; siblings: any[] }>({
    educationLevel: "", educationalStage: "", schoolName: "", quranMemorization: "",
    healthStatus: "", birthGovernorate: "", birthDistrict: "", birthVillage: "",
    birthArea: "", housingStatus: "", kuraimiAccount: "",
    guardian: { fullName: "", relation: "", occupation: "", phone1: "", phone2: "", phone3: "", phone4: "" },
    siblings: [],
  })

  useEffect(() => {
    getUpdateRequestByToken(token).then(res => {
      if (!res.success) { setError(res.error || "خطأ"); setLoading(false); return }

      const req = res.request!
      const b   = req.beneficiary
      setRequest(req)
      setOrphan(b)

      // تهيئة النموذج من البيانات الحالية لليتيم
      // إذا كان الطلب مرفوضاً، نملأ من آخر بيانات أُرسلت
      const prev = req.status === "REJECTED" && req.submittedData
        ? (req.submittedData as any)
        : null

      const primaryGuardian = b.guardians?.find((g: any) => g.isPrimary) || b.guardians?.[0] || {}

      setForm({
        educationLevel:    prev?.educationLevel    ?? b.educationLevel    ?? "",
        educationalStage:  prev?.educationalStage  ?? b.educationalStage  ?? "",
        schoolName:        prev?.schoolName        ?? b.schoolName        ?? "",
        quranMemorization: prev?.quranMemorization ?? b.quranMemorization ?? "",
        healthStatus:      prev?.healthStatus      ?? b.healthStatus      ?? "",
        birthGovernorate:  prev?.birthGovernorate  ?? b.birthGovernorate  ?? "",
        birthDistrict:     prev?.birthDistrict     ?? b.birthDistrict     ?? "",
        birthVillage:      prev?.birthVillage      ?? b.birthVillage      ?? "",
        birthArea:         prev?.birthArea         ?? b.birthArea         ?? "",
        housingStatus:     prev?.housingStatus     ?? b.housingStatus     ?? "",
        kuraimiAccount:    prev?.kuraimiAccount    ?? b.kuraimiAccount    ?? "",
        guardian: {
          fullName:   prev?.guardian?.fullName   ?? primaryGuardian.fullName   ?? "",
          relation:   prev?.guardian?.relation   ?? primaryGuardian.relation   ?? "",
          occupation: prev?.guardian?.occupation ?? primaryGuardian.occupation ?? "",
          phone1:     prev?.guardian?.phone1     ?? primaryGuardian.phone1     ?? "",
          phone2:     prev?.guardian?.phone2     ?? primaryGuardian.phone2     ?? "",
          phone3:     prev?.guardian?.phone3     ?? primaryGuardian.phone3     ?? "",
          phone4:     prev?.guardian?.phone4     ?? primaryGuardian.phone4     ?? "",
        },
        siblings: (b.siblings || []).map((s: any) => ({
          id:           s.id,
          fullName:     (prev?.siblings?.find((ps: any) => ps.id === s.id)?.fullName)     ?? s.fullName     ?? "",
          qualification:(prev?.siblings?.find((ps: any) => ps.id === s.id)?.qualification) ?? s.qualification ?? "",
          socialStatus: (prev?.siblings?.find((ps: any) => ps.id === s.id)?.socialStatus)  ?? s.socialStatus  ?? "",
        })),
      })

      setLoading(false)
    })
  }, [token])

  const handleSubmit = async () => {
    if (!submitterName.trim()) { setError("يرجى كتابة اسمك قبل الإرسال"); return }
    setSubmitting(true)
    setError(null)
    const res = await submitUpdateRequest(token, submitterName.trim(), form)
    setSubmitting(false)
    if (res.success) setSuccess(true)
    else setError(res.error || "فشل الإرسال")
  }

  const setF = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))
  const setG = (key: string, val: string) => setForm(p => ({ ...p, guardian: { ...p.guardian, [key]: val } }))
  const setSib = (idx: number, key: string, val: string) => setForm(p => ({
    ...p,
    siblings: p.siblings.map((s: any, i: number) => i === idx ? { ...s, [key]: val } : s)
  }))

  const Section = ({ id, title, icon, children }: any) => (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpenSection(openSection === id ? "" : id)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="flex items-center gap-2 font-bold text-white text-sm">
          <span>{icon}</span> {title}
        </span>
        {openSection === id ? <ChevronUp className="h-4 w-4 text-emerald-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {openSection === id && <div className="px-5 py-4 space-y-3">{children}</div>}
    </div>
  )

  const Field = ({ label, value, onChange, placeholder, type = "text" }: any) => (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
      />
    </div>
  )

  const Select = ({ label, value, onChange, options }: any) => (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-400">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
      >
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  )

  if (error && !orphan) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center space-y-3">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-white font-bold text-lg">{error}</p>
        <p className="text-slate-500 text-sm">يرجى التواصل مع المنظمة للحصول على رابط جديد</p>
      </div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto" />
        <h2 className="text-white font-extrabold text-xl">تم إرسال التحديث بنجاح!</h2>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          سيقوم فريقنا بمراجعة البيانات المُحدَّثة والتواصل معك في حال وجود أي استفسار.
        </p>
      </div>
    </div>
  )

  if (request?.status === "APPROVED") return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto" />
        <h2 className="text-white font-extrabold text-xl">تم قبول طلب التحديث</h2>
        <p className="text-slate-400 text-sm">تم تحديث بيانات اليتيم بنجاح. شكراً لتعاونكم.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-700 to-teal-800 px-4 py-6 text-right">
        <p className="text-emerald-200 text-xs font-bold mb-1">نظام بيت الزكاة — تحديث البيانات</p>
        <h1 className="text-white text-xl font-extrabold">{orphan?.fullName}</h1>
        <p className="text-emerald-100 text-xs mt-1">
          يرجى مراجعة البيانات أدناه وتحديث ما تغيّر فقط
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* إشعار الرفض */}
        {request?.status === "REJECTED" && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4">
            <p className="text-red-400 font-bold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              تم رفض طلبك السابق
            </p>
            {request.rejectionReason && (
              <p className="text-red-300 text-xs mt-2 leading-relaxed">
                السبب: {request.rejectionReason}
              </p>
            )}
            <p className="text-red-200 text-xs mt-2">يمكنك تعديل البيانات وإعادة الإرسال.</p>
          </div>
        )}

        {/* اسم مُرسِل التحديث */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 space-y-2">
          <label className="text-xs font-extrabold text-emerald-400">اسمك الكريم (مطلوب)</label>
          <input
            type="text"
            value={submitterName}
            onChange={e => setSubmitterName(e.target.value)}
            placeholder="اكتب اسمك كاملاً"
            className="w-full rounded-xl border border-emerald-500/20 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right font-bold"
          />
        </div>

        {/* ── Section 1: التعليم ── */}
        <Section id="education" title="البيانات التعليمية" icon="📚">
          <div className="grid grid-cols-2 gap-3">
            <Field label="المرحلة الدراسية" value={form.educationalStage} onChange={(v: string) => setF("educationalStage", v)} placeholder="ابتدائي / ثانوي..." />
            <Field label="الصف الدراسي" value={form.educationLevel} onChange={(v: string) => setF("educationLevel", v)} placeholder="الصف الثامن..." />
            <Field label="اسم المدرسة" value={form.schoolName} onChange={(v: string) => setF("schoolName", v)} placeholder="اسم المدرسة الحالية" />
            <Field label="مقدار حفظ القرآن" value={form.quranMemorization} onChange={(v: string) => setF("quranMemorization", v)} placeholder="جزء عم / سورة البقرة..." />
          </div>
        </Section>

        {/* ── Section 2: الصحة ── */}
        <Section id="health" title="الحالة الصحية" icon="💊">
          <Select
            label="الحالة الصحية"
            value={form.healthStatus}
            onChange={(v: string) => setF("healthStatus", v)}
            options={[
              { value: "", label: "-- اختر --" },
              { value: "سليم", label: "سليم" },
              { value: "مريض", label: "مريض" },
              { value: "يحتاج متابعة", label: "يحتاج متابعة" },
            ]}
          />
        </Section>

        {/* ── Section 3: السكن ── */}
        <Section id="housing" title="بيانات السكن والعنوان" icon="🏠">
          <div className="grid grid-cols-2 gap-3">
            <Field label="المحافظة" value={form.birthGovernorate} onChange={(v: string) => setF("birthGovernorate", v)} placeholder="المحافظة" />
            <Field label="المديرية" value={form.birthDistrict} onChange={(v: string) => setF("birthDistrict", v)} placeholder="المديرية" />
            <Field label="المنطقة" value={form.birthArea} onChange={(v: string) => setF("birthArea", v)} placeholder="الحي / المنطقة" />
            <Select
              label="نوع السكن"
              value={form.housingStatus}
              onChange={(v: string) => setF("housingStatus", v)}
              options={[
                { value: "", label: "-- اختر --" },
                { value: "ملك", label: "ملك" },
                { value: "إيجار", label: "إيجار" },
                { value: "مع الأهل", label: "مع الأهل" },
              ]}
            />
          </div>
        </Section>

        {/* ── Section 4: المعيل ── */}
        <Section id="guardian" title="بيانات المعيل وأرقام التواصل" icon="👤">
          <div className="grid grid-cols-2 gap-3">
            <Field label="اسم المعيل" value={form.guardian.fullName} onChange={(v: string) => setG("fullName", v)} placeholder="اسم المعيل الكامل" />
            <Field label="صلة القرابة" value={form.guardian.relation} onChange={(v: string) => setG("relation", v)} placeholder="أخ / عم / خال..." />
            <Field label="عمله / مهنته" value={form.guardian.occupation} onChange={(v: string) => setG("occupation", v)} placeholder="المهنة الحالية" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {["phone1", "phone2", "phone3", "phone4"].map((ph, i) => (
              <Field
                key={ph}
                label={`رقم الهاتف ${i + 1}`}
                value={form.guardian[ph]}
                onChange={(v: string) => setG(ph, v)}
                placeholder={`07XXXXXXXXX`}
                type="tel"
              />
            ))}
          </div>
        </Section>

        {/* ── Section 5: المالي ── */}
        <Section id="financial" title="بيانات الحساب المالي" icon="💰">
          <Field
            label="رقم حساب الكريمي (الجديد)"
            value={form.kuraimiAccount}
            onChange={(v: string) => setF("kuraimiAccount", v)}
            placeholder="رقم الحساب في بنك الكريمي"
          />
        </Section>

        {/* ── Section 6: الإخوة ── */}
        {form.siblings.length > 0 && (
          <Section id="siblings" title="بيانات الإخوة والأخوات" icon="👨‍👩‍👧">
            {form.siblings.map((sib: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                <p className="text-xs font-bold text-emerald-400">الأخ/الأخت {idx + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="الاسم" value={sib.fullName} onChange={(v: string) => setSib(idx, "fullName", v)} placeholder="الاسم الكامل" />
                  <Field label="المؤهل" value={sib.qualification} onChange={(v: string) => setSib(idx, "qualification", v)} placeholder="دراسي / جامعي..." />
                  <div className="col-span-2">
                    <Select
                      label="الحالة الاجتماعية"
                      value={sib.socialStatus}
                      onChange={(v: string) => setSib(idx, "socialStatus", v)}
                      options={[
                        { value: "", label: "-- اختر --" },
                        { value: "أعزب", label: "أعزب" },
                        { value: "متزوج", label: "متزوج" },
                        { value: "مطلق", label: "مطلق" },
                        { value: "أرمل", label: "أرمل" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* تنبيه البيانات المحمية */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
          <p className="text-amber-400 text-xs font-bold">⚠️ ملاحظة هامة</p>
          <p className="text-amber-200 text-xs mt-1 leading-relaxed">
            بعض البيانات (كالاسم، الهوية، تاريخ الميلاد) لا يمكن تعديلها عبر هذا النموذج.
            للتعديل على هذه البيانات يرجى التواصل مع المنظمة مباشرة.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-red-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* زر الإرسال */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-6 py-4 text-white font-extrabold text-sm transition-all duration-200 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {submitting ? "جاري الإرسال..." : request?.status === "REJECTED" ? "إعادة الإرسال" : "إرسال التحديث"}
        </button>

        <p className="text-center text-xs text-slate-600 pb-6">
          جميع البيانات المُدخلة ستُراجع من قِبل فريق المنظمة قبل تطبيقها
        </p>
      </div>
    </div>
  )
}
