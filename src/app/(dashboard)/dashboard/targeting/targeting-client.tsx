"use client"

import { useState, useTransition } from "react"
import {
  Target,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  Loader2,
  Users,
  Building2,
  Award,
  Sparkles,
  Layers,
  PackageOpen,
} from "lucide-react"
import { NeedScoreBadge } from "@/components/ui/need-score-badge"
import { filterBeneficiariesForTargeting, createDistributionFromTargeting } from "@/app/actions/targeting-actions"
import * as XLSX from "xlsx"

interface GeographyProps {
  geography: any[]
}

export function TargetingClient({ geography }: GeographyProps) {
  const [isPending, startTransition] = useTransition()

  // Filters State
  const [projectNameInput, setProjectNameInput] = useState("")
  const [interventionType, setInterventionType] = useState("سلة غذائية")
  const [minNeedScore, setMinNeedScore] = useState(55)
  const [selectedGov, setSelectedGov] = useState("")
  const [selectedDist, setSelectedDist] = useState("")
  const [selectedSubDist, setSelectedSubDist] = useState("")
  const [limitCount, setLimitCount] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Exclude Checkboxes State
  const [excludeDaysCheck, setExcludeDaysCheck] = useState(false)
  const [excludeDuplicatesCheck, setExcludeDuplicatesCheck] = useState(true)
  const [excludeSponsoredCheck, setExcludeSponsoredCheck] = useState(false)

  // Results State
  const [results, setResults] = useState<any[]>([])
  const [totalMatched, setTotalMatched] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const districts = geography.find((g: any) => g.id.toString() === selectedGov)?.districts || []
  const subDistricts = districts.find((d: any) => d.id.toString() === selectedDist)?.subDistricts || []

  // Vulnerability Chips List
  const vulnerabilityChips = [
    { id: "orphans", label: "أيتام" },
    { id: "widows", label: "أرامل" },
    { id: "displaced", label: "نازحون" },
    { id: "disabled", label: "ذوو إعاقة/مرض مزمن" },
    { id: "poor_house", label: "سكن متهالك" },
    { id: "unemployed", label: "بلا عمل" },
    { id: "elderly", label: "كبار سن" },
    { id: "under5", label: "أطفال دون 5 سنوات" },
    { id: "large_family", label: "أسرة كبيرة" },
    { id: "no_aid", label: "لم تُساعد سابقاً" },
    { id: "divorced", label: "مطلقات/مطلقون" },
  ]

  const toggleTagFilter = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  function handleFilter() {
    setError(null)
    setHasSearched(true)

    startTransition(async () => {
      const res = await filterBeneficiariesForTargeting({
        minNeedScore,
        governorateId: selectedGov,
        districtId: selectedDist,
        subDistrictId: selectedSubDist,
        limit: limitCount ? parseInt(limitCount) : undefined,
        excludeAidedDays: excludeDaysCheck ? 90 : undefined,
        hasOrphansOnly: selectedTags.includes("orphans"),
        hasWidowsOnly: selectedTags.includes("widows"),
        hasDisabledOnly: selectedTags.includes("disabled"),
      })

      if (res.success) {
        let filteredRes = res.results

        // Apply Extra Client Exclusion logic if checked
        if (excludeSponsoredCheck) {
          filteredRes = filteredRes.filter(r => !r.family.hasOrphans)
        }

        setResults(filteredRes)
        setTotalMatched(filteredRes.length)
      } else {
        setError(res.error || "فشل جلب الأسر المستحقة")
      }
    })
  }

  function handleExportExcel() {
    if (results.length === 0) return

    const dataToExport = results.map((item, idx) => ({
      "#": idx + 1,
      "كود الأسرة": `YT-2026-${item.family.id.slice(-4).toUpperCase()}`,
      "اسم رب الأسرة": item.family.headFullName,
      "الرقم الوطني": item.family.headNationalId,
      "رقم الهاتف": item.family.headPhoneNumber || "—",
      "المحافظة": item.family.subDistrict?.district?.governorate?.nameAr || "—",
      "المديرية": item.family.subDistrict?.district?.nameAr || "—",
      "العزلة": item.family.subDistrict?.nameAr || "—",
      "عدد الأفراد": item.family.manualMembersCount || item.family.familyMembersCount || 1,
      "درجة الاحتياج (%)": item.needScore,
      "مستوى الأولوية": item.priorityAr,
      "أسباب الأولوية": item.reasons?.join(" • ") || "استحقاق عالي",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "كشف المستفيدين")
    XLSX.writeFile(workbook, `كشف_استهداف_المستفيدين_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  async function handleCreateProject() {
    const finalName = projectNameInput.trim() || `مشروع ${interventionType} — ${new Date().toLocaleDateString("ar-YE")}`
    if (results.length === 0) return

    setIsCreatingProject(true)
    const familyIds = results.map(r => r.family.id)

    const res = await createDistributionFromTargeting(finalName, interventionType, familyIds)
    setIsCreatingProject(false)

    if (res.success) {
      alert(`تم بنجاح اعتماد الكشف وتسجيل الصرف لـ (${results.length} أسرة) وإنشاء المشروع ✅`)
      setProjectNameInput("")
    } else {
      alert(res.error || "فشل اعتماد التوزيع")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-900/30">
            <Target className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Targeting Engine
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-100 mt-1">بناء كشف مستفيدين مشروع</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              حدّد معايير الاستحقاق، عايِن الأسر المطابقة، ثم اعتمد الكشف وصدّره
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right Form Side: معايير الاستحقاق (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-xl space-y-5 h-fit shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-400" /> معايير الاستحقاق
            </h3>
          </div>

          {/* Project Name & Intervention */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">اسم المشروع / الدورة</label>
              <input
                type="text"
                placeholder="مثال: سلة غذائية — رمضان 1448"
                value={projectNameInput}
                onChange={e => setProjectNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/30 text-white text-right rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">نوع التدخل</label>
              <select
                value={interventionType}
                onChange={e => setInterventionType(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/30 text-white text-right rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
              >
                <option value="سلة غذائية">سلة غذائية</option>
                <option value="مساعدة نقدية">مساعدة نقدية</option>
                <option value="كسوة عيد">كسوة عيد</option>
                <option value="علاج ودواء">علاج ودواء</option>
                <option value="ترميم سكن">ترميم سكن</option>
                <option value="تمكين اقتصادي">تمكين اقتصادي</option>
                <option value="كفالة يتيم">كفالة يتيم</option>
                <option value="مياه وخزانات">مياه وخزانات</option>
              </select>
            </div>
          </div>

          {/* Need Score Slider */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">الحد الأدنى لدرجة الأولوية:</label>
              <span className="text-xs font-extrabold text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {minNeedScore} نقطة فأعلى
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={95}
              step={5}
              value={minNeedScore}
              onChange={e => setMinNeedScore(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 cursor-pointer h-2 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
              <span>0 (الكل)</span>
              <span>35 (متوسط)</span>
              <span>55 (عالي)</span>
              <span>75 (حرج)</span>
            </div>
          </div>

          {/* Geography Cascade */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">المديرية</label>
              <select
                value={selectedGov}
                onChange={e => {
                  setSelectedGov(e.target.value)
                  setSelectedDist("")
                  setSelectedSubDist("")
                }}
                className="w-full bg-slate-950 border border-emerald-500/30 text-white text-right rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
              >
                <option value="">كل المديريات والمحافظات</option>
                {geography.map((g: any) => (
                  <option key={g.id} value={g.id.toString()}>
                    {g.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Limit Count */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">الحد الأقصى لعدد المستفيدين</label>
            <input
              type="number"
              value={limitCount}
              onChange={e => setLimitCount(e.target.value)}
              placeholder="اتركه فارغاً لغير محدود"
              className="w-full bg-slate-950 border border-emerald-500/30 text-white text-right rounded-xl px-3 py-2 text-xs placeholder-slate-500 font-mono"
            />
          </div>

          {/* Special Categories Tag Chips */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <label className="text-xs font-bold text-slate-300 block">اشتراط فئات (يجب توفّرها جميعاً):</label>
            <div className="flex flex-wrap gap-1.5">
              {vulnerabilityChips.map((chip) => {
                const active = selectedTags.includes(chip.id)
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => toggleTagFilter(chip.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                      active
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-105"
                        : "bg-slate-950 text-slate-400 border-border/60 hover:border-emerald-500/40"
                    }`}
                  >
                    {chip.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Exclusion Checkboxes */}
          <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeDaysCheck}
                onChange={e => setExcludeDaysCheck(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
              />
              <span>استبعاد من استلم مساعدة خلال آخر 90 يوماً</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeDuplicatesCheck}
                onChange={e => setExcludeDuplicatesCheck(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
              />
              <span>استبعاد السجلات المكرّرة المشتبه بها</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeSponsoredCheck}
                onChange={e => setExcludeSponsoredCheck(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
              />
              <span>استبعاد الأسر المكفولة أصلاً من جهة مانحة</span>
            </label>
          </div>

          {/* Filter Action Button */}
          <button
            onClick={handleFilter}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black rounded-xl py-3 text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> جاري تطبيق المعايير...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 text-slate-950" /> تطبيق المعايير
              </>
            )}
          </button>
        </div>

        {/* Left Side: Results & Commit Actions (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-border/40 pb-4 flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    الأسر المطابقة
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {hasSearched ? `تم العثور على (${results.length}) أسرة مستحقة للتدخل` : "لم تُطبَّق معايير بعد"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    disabled={results.length === 0}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-border/60 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" /> تصدير Excel
                  </button>

                  <button
                    onClick={handleCreateProject}
                    disabled={results.length === 0 || isCreatingProject}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 disabled:opacity-40 hover:from-emerald-600 hover:to-teal-700 rounded-xl px-4 py-2 text-xs font-black flex items-center gap-1.5 transition-all shadow-md"
                  >
                    {isCreatingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageOpen className="h-3.5 w-3.5" />}
                    اعتماد الكشف وتسجيل الصرف
                  </button>
                </div>
              </div>

              {/* Table of Matched Results */}
              {results.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-300 font-bold border-b border-border/60">
                      <tr>
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3">كود الأسرة</th>
                        <th className="py-3 px-3">رب الأسرة</th>
                        <th className="py-3 px-3">الرقم الوطني</th>
                        <th className="py-3 px-3">الموقع الجغرافي</th>
                        <th className="py-3 px-3 text-center">الأفراد</th>
                        <th className="py-3 px-3 text-center">درجة الاحتياج</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 text-slate-300">
                      {results.map((r, i) => (
                        <tr key={r.family.id} className="hover:bg-slate-950/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-400">{i + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                            YT-2026-{r.family.id.slice(-4).toUpperCase()}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">{r.family.headFullName}</td>
                          <td className="py-3 px-3 font-mono">{r.family.headNationalId}</td>
                          <td className="py-3 px-3 text-slate-400">
                            {r.family.subDistrict?.district?.governorate?.nameAr} - {r.family.subDistrict?.district?.nameAr}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-white tabular-nums">
                            {r.family.manualMembersCount || r.family.familyMembersCount || 1}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <NeedScoreBadge score={r.needScore} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
                  <div className="p-4 rounded-full bg-slate-950 border border-border/40 text-slate-500">
                    <Target className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">لم تُطبَّق معايير بعد</p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    حدّد شروط الاستحقاق ونوع التدخل في اللوحة اليمنى ثم انقر على "تطبيق المعايير" لعرض الكشف.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
