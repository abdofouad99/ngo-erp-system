"use client"

import { useState } from "react"
import {
  Search,
  Eye,
  Edit,
  ShieldCheck,
  ShieldX,
  MapPin,
  Loader2,
  Download,
  Printer,
  RefreshCw,
  CreditCard,
  Users,
  ShieldAlert,
  Heart,
  Home,
  Droplet,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react"
import { PrintProfile } from "@/components/print-profile"
import { Button } from "@/components/ui/button"
import { exportFamiliesToExcel } from "@/lib/excel-export"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { FamilyDetailsSheet } from "@/components/families/family-details-sheet"
import { FamilyFormSheet } from "@/components/families/family-form-sheet"
import { toggleFamilyActive } from "@/app/actions/family-actions"
import { ExcelImportSheet } from "@/components/families/excel-import-sheet"
import { FamilyCardSheet } from "@/components/families/family-card-sheet"
import { NeedScoreBadge } from "@/components/ui/need-score-badge"

interface FamiliesClientProps {
  initialFamilies: any[]
  geography: any[]
  currentUserRole?: string
}

export function FamiliesClient({ initialFamilies, geography, currentUserRole }: FamiliesClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGov, setSelectedGov] = useState<string>("ALL")
  const [selectedPoverty, setSelectedPoverty] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")

  // Advanced Filter States
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterDisplaced, setFilterDisplaced] = useState<string>("ALL")
  const [filterOrphans, setFilterOrphans] = useState<string>("ALL")
  const [filterWidow, setFilterWidow] = useState<string>("ALL")
  const [filterUnemployed, setFilterUnemployed] = useState<string>("ALL")
  const [filterHousingType, setFilterHousingType] = useState<string>("ALL")
  const [filterMaxIncome, setFilterMaxIncome] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Selected Family state for viewing details
  const [selectedFamily, setSelectedFamily] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Loading state for toggling active status
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Vulnerability Chips Configuration
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
  ]

  const toggleTagFilter = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  // Filter logic
  const filteredFamilies = initialFamilies.filter((family) => {
    const codeStr = `YT-2026-${family.id.slice(-4)}`
    const matchesSearch =
      family.headFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      family.headNationalId.includes(searchTerm) ||
      codeStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (family.headPhoneNumber && family.headPhoneNumber.includes(searchTerm))

    const matchesGov =
      selectedGov === "ALL" ||
      family.subDistrict?.district?.governorate?.id?.toString() === selectedGov

    const matchesPoverty =
      selectedPoverty === "ALL" || family.povertyLevel === selectedPoverty

    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACTIVE" && family.isActive) ||
      (selectedStatus === "INACTIVE" && !family.isActive)

    const matchesDisplaced =
      filterDisplaced === "ALL" ||
      (filterDisplaced === "YES" && family.isDisplaced) ||
      (filterDisplaced === "NO" && !family.isDisplaced)

    const matchesOrphans =
      filterOrphans === "ALL" ||
      (filterOrphans === "YES" && family.hasOrphans) ||
      (filterOrphans === "NO" && !family.hasOrphans)

    const matchesWidow =
      filterWidow === "ALL" ||
      (filterWidow === "YES" && family.hasWidow) ||
      (filterWidow === "NO" && !family.hasWidow)

    const matchesUnemployed =
      filterUnemployed === "ALL" ||
      (filterUnemployed === "YES" && family.hasUnemployed) ||
      (filterUnemployed === "NO" && !family.hasUnemployed)

    const matchesHousing =
      filterHousingType === "ALL" ||
      family.housingType === filterHousingType

    const matchesIncome =
      !filterMaxIncome ||
      (family.monthlyIncome !== null && family.monthlyIncome <= Number(filterMaxIncome))

    // Tag Chips Matching
    if (selectedTags.length > 0) {
      if (selectedTags.includes("orphans") && !family.hasOrphans) return false
      if (selectedTags.includes("widows") && !family.hasWidow) return false
      if (selectedTags.includes("displaced") && !family.isDisplaced) return false
      if (selectedTags.includes("disabled") && !family.specialNeedsCount) return false
      if (selectedTags.includes("poor_house") && family.housingType !== "متهالك" && family.housingType !== "خيمة") return false
      if (selectedTags.includes("unemployed") && !family.hasUnemployed) return false
      if (selectedTags.includes("elderly") && !family.elderlyAbove60Count) return false
      if (selectedTags.includes("under5") && !family.kidsUnder5Count) return false
      if (selectedTags.includes("large_family") && (family.familyMembersCount || 0) < 6) return false
    }

    return (
      matchesSearch &&
      matchesGov &&
      matchesPoverty &&
      matchesStatus &&
      matchesDisplaced &&
      matchesOrphans &&
      matchesWidow &&
      matchesUnemployed &&
      matchesHousing &&
      matchesIncome
    )
  })

  // Calculations for Top Metric Cards
  const totalCount = initialFamilies.length
  const totalPeople = initialFamilies.reduce((acc, f) => acc + (f.familyMembersCount || f.manualMembersCount || 1), 0)
  const avgPeople = totalCount > 0 ? (totalPeople / totalCount).toFixed(1) : 0

  const criticalCount = initialFamilies.filter(f => f.povertyLevel === "SEVERE" || (f.vulnerabilityScore && f.vulnerabilityScore >= 75)).length
  const highPriorityCount = initialFamilies.filter(f => f.povertyLevel === "MEDIUM" || (f.vulnerabilityScore && f.vulnerabilityScore >= 55 && f.vulnerabilityScore < 75)).length
  const criticalPct = totalCount > 0 ? Math.round((criticalCount / totalCount) * 100) : 0

  const totalOrphans = initialFamilies.reduce((acc, f) => acc + (f.orphansCount || 0), 0)
  const orphanFamiliesCount = initialFamilies.filter(f => f.hasOrphans || (f.orphansCount && f.orphansCount > 0)).length

  const displacedCount = initialFamilies.filter(f => f.isDisplaced).length
  const displacedPct = totalCount > 0 ? Math.round((displacedCount / totalCount) * 100) : 0

  const disabledCount = initialFamilies.filter(f => f.specialNeedsCount && f.specialNeedsCount > 0).length
  const disabledPct = totalCount > 0 ? Math.round((disabledCount / totalCount) * 100) : 0

  const noAidCount = initialFamilies.filter(f => !f.lastDeliveryDate).length
  const noAidPct = totalCount > 0 ? Math.round((noAidCount / totalCount) * 100) : 0

  // Calculate Median Per Capita Income
  const perCapitaIncomes = initialFamilies
    .map(f => (f.monthlyIncome || 0) / (f.familyMembersCount || f.manualMembersCount || 1))
    .sort((a, b) => a - b)
  const medianIncome = perCapitaIncomes.length > 0 ? Math.round(perCapitaIncomes[Math.floor(perCapitaIncomes.length / 2)]) : 10000

  // Open details sheet helper
  const handleOpenDetails = (family: any) => {
    setSelectedFamily(family)
    setIsDetailsOpen(true)
  }

  // Toggle active action handler
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (currentUserRole === "VIEWER") {
      alert("عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بتعديل حالة النشاط.")
      return
    }
    setTogglingId(id)
    const result = await toggleFamilyActive(id, !currentStatus)
    if (!result.success) {
      alert(result.error || "فشل تغيير حالة نشاط الأسرة.")
    }
    setTogglingId(null)
  }

  const getPovertyBadge = (level: string | null) => {
    switch (level) {
      case "SEVERE":
        return <Badge className="badge-premium-rose">فقر شديد</Badge>
      case "MEDIUM":
        return <Badge className="badge-premium-orange">فقر متوسط</Badge>
      case "LOW":
        return <Badge className="badge-premium-emerald">فقر منخفض</Badge>
      default:
        return <span className="text-slate-400 text-xs italic">غير محدد</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top 8 Metric Summary Cards (طراز البطاقات الجانبية الملونة) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: الأسر المسجلة */}
        <div className="bg-slate-900/60 border-l-4 border-l-cyan-500 border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <span className="text-xs text-slate-400 font-bold block mb-1">الأسر المسجلة</span>
          <div className="text-3xl font-black text-white font-mono">{totalCount}</div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            من أصل {totalCount} سجلاً في القاعدة
          </span>
        </div>

        {/* Card 2: إجمالي الأفراد */}
        <div className="bg-slate-900/60 border-l-4 border-l-teal-500 border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي الأفراد</span>
          <div className="text-3xl font-black text-teal-400 font-mono">{totalPeople}</div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            بمتوسط {avgPeople} فرد لكل أسرة
          </span>
        </div>

        {/* Card 3: أسر ذات أولوية حرجة */}
        <div className="bg-slate-900/60 border-l-4 border-l-rose-500 border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <span className="text-xs text-slate-400 font-bold block mb-1">أسر ذات أولوية حرجة</span>
          <div className="text-3xl font-black text-rose-400 font-mono">{criticalCount}</div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            {criticalPct}% من الأسر · و {highPriorityCount} أسرة أولوية عالية
          </span>
        </div>

        {/* Card 4: أيتام داخل الأسر */}
        <div className="bg-slate-900/60 border-l-4 border-l-amber-500 border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <span className="text-xs text-slate-400 font-bold block mb-1">أيتام داخل الأسر</span>
          <div className="text-3xl font-black text-amber-400 font-mono">{totalOrphans}</div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            موزعون على {orphanFamiliesCount} أسرة كافلة
          </span>
        </div>

        {/* Card 5: أسر نازحة */}
        <div className="bg-slate-900/60 border-l-4 border-l-blue-500 border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <span className="text-xs text-slate-400 font-bold block mb-1">أسر نازحة</span>
          <div className="text-3xl font-black text-blue-400 font-mono">{displacedCount}</div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            {displacedPct}% من إجمالي الأسر
          </span>
        </div>

        {/* Card 6: ذوو إعاقة / مرض مزمن */}
        <div className="bg-slate-900/60 border-l-4 border-l-indigo-500 border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <span className="text-xs text-slate-400 font-bold block mb-1">ذوو إعاقة / مرض مزمن</span>
          <div className="text-3xl font-black text-indigo-400 font-mono">{disabledCount}</div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            في {disabledPct}% من الأسر
          </span>
        </div>

        {/* Card 7: وسيط نصيب الفرد شهرياً */}
        <div className="bg-slate-900/60 border-l-4 border-l-emerald-500 border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <span className="text-xs text-slate-400 font-bold block mb-1">وسيط نصيب الفرد شهرياً</span>
          <div className="text-3xl font-black text-emerald-400 font-mono">{medianIncome.toLocaleString("ar-YE-u-nu-latn")}</div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            ريال يمني / فرد
          </span>
        </div>

        {/* Card 8: لم تستلم أي مساعدة */}
        <div className="bg-slate-900/60 border-l-4 border-l-pink-500 border border-border/50 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <span className="text-xs text-slate-400 font-bold block mb-1">لم تستلم أي مساعدة</span>
          <div className="text-3xl font-black text-pink-400 font-mono">{noAidCount}</div>
          <span className="text-[11px] text-slate-400 font-medium block mt-1">
            {noAidPct}% لم تصلهم أي جهة
          </span>
        </div>
      </div>

      {/* ── Filter & Search Control Panel ───────────────────────── */}
      <Card className="glass-card bg-slate-900/60 border border-emerald-500/20 backdrop-blur-xl">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="البحث باسم رب الأسرة، الهوية، الهاتف، أو الكود YT-2026..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 bg-slate-950 border-emerald-500/30 focus-visible:ring-emerald-500 text-white text-right placeholder-slate-400 text-xs rounded-xl h-10"
              />
            </div>

            {/* Governorate Filter */}
            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-emerald-500/30 bg-slate-950 text-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right font-medium"
            >
              <option value="ALL" className="bg-slate-950 text-white">كل المحافظات</option>
              {geography.map((gov) => (
                <option key={gov.id} value={gov.id.toString()} className="bg-slate-950 text-white">
                  {gov.nameAr}
                </option>
              ))}
            </select>

            {/* Poverty Level Filter */}
            <select
              value={selectedPoverty}
              onChange={(e) => setSelectedPoverty(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-emerald-500/30 bg-slate-950 text-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right font-medium"
            >
              <option value="ALL" className="bg-slate-950 text-white">درجة الأولوية (الكل)</option>
              <option value="SEVERE" className="bg-slate-950 text-white">فقر شديد / حرجة</option>
              <option value="MEDIUM" className="bg-slate-950 text-white">فقر متوسط / عالية</option>
              <option value="LOW" className="bg-slate-950 text-white">فقر منخفض</option>
            </select>
          </div>

          {/* Vulnerability Tags Chips Bar (اختيار متعدد) */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <span className="text-xs font-bold text-slate-300 block">فئات الهشاشة (اختيار متعدد):</span>
            <div className="flex flex-wrap gap-2">
              {vulnerabilityChips.map((chip) => {
                const active = selectedTags.includes(chip.id)
                return (
                  <button
                    key={chip.id}
                    onClick={() => toggleTagFilter(chip.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      active
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-105"
                        : "bg-slate-950 text-slate-300 border-border/60 hover:border-emerald-500/40"
                    }`}
                  >
                    {chip.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Result Count Banner */}
          <div className="flex justify-between items-center text-xs text-slate-300 font-bold bg-slate-950/80 px-4 py-2 rounded-xl border border-border/40">
            <span>
              {filteredFamilies.length} أسرة مطابقة · {filteredFamilies.reduce((acc, f) => acc + (f.familyMembersCount || f.manualMembersCount || 1), 0)} فرد · {filteredFamilies.filter(f => f.povertyLevel === "SEVERE").length} حرجة
            </span>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              {showAdvanced ? "إخفاء الفلاتر المركبة ▲" : "عرض خيارات الفلترة المتقدمة ▼"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Table Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 border border-border/60 rounded-xl">
        <div className="text-sm text-slate-300 font-bold">
          عرض النتائج لعدد <span className="font-extrabold text-emerald-400 text-base">{filteredFamilies.length}</span> أسرة
        </div>
        <div className="flex gap-2">
          <ExcelImportSheet currentUserRole={currentUserRole} />
          <Button
            onClick={() => {
              if (currentUserRole === "VIEWER") {
                alert("عذراً، هذا الحساب مخصص للقراءة والعرض فقط، ولا يسمح بتصدير البيانات.")
                return
              }
              exportFamiliesToExcel(filteredFamilies)
            }}
            disabled={filteredFamilies.length === 0}
            className="rounded-xl px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all h-9 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>تصدير Excel (المصفى)</span>
          </Button>
        </div>
      </div>

      {/* ── Complete Enhanced Table View (تطابق وتفوق 100 مرة) ── */}
      <Card className="glass-card overflow-hidden border border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full text-right">
              <TableHeader className="bg-slate-950 border-b border-border/80">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 pr-4 text-xs">الكود</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 pr-2 text-xs">رب الأسرة والزوجة</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 text-xs">الهوية الوطنية</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 text-xs">الجوال</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 text-xs">المديرية / المنطقة</TableHead>
                  <TableHead className="text-center text-slate-200 font-bold py-3.5 text-xs">الأفراد</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 text-xs">نصيب الفرد</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 text-xs">السكن</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 text-xs">الفئات والسمات</TableHead>
                  <TableHead className="text-center text-slate-200 font-bold py-3.5 text-xs">مؤشر الحاجة</TableHead>
                  <TableHead className="text-center text-slate-200 font-bold py-3.5 pl-4 text-xs">الإجراءات والبطاقة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFamilies.length > 0 ? (
                  filteredFamilies.map((family) => {
                    const familyCode = `YT-2026-${family.id.slice(-4).toUpperCase()}`
                    const districtStr = family.subDistrict?.district?.nameAr || "غير محدد"
                    const subDistrictStr = family.subDistrict?.nameAr || "المنطقة"
                    const totalM = family.familyMembersCount || family.manualMembersCount || 1
                    const perCapita = Math.round((family.monthlyIncome || 0) / totalM)

                    return (
                      <TableRow key={family.id} className="hover:bg-slate-900/60 border-border/40 transition-colors duration-150">
                        {/* Code */}
                        <TableCell className="py-3.5 pr-4 text-emerald-400 font-mono font-bold text-xs">
                          {familyCode}
                        </TableCell>

                        {/* Head & Spouse */}
                        <TableCell className="py-3.5 pr-2 text-xs">
                          <span className="font-bold text-white block text-sm">{family.headFullName}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {family.hasWidow ? "أرملة — تعول أسرة" : "متزوج"}
                          </span>
                        </TableCell>

                        {/* National ID */}
                        <TableCell className="py-3.5 font-mono text-xs text-slate-300 font-semibold">
                          {family.headNationalId}
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="py-3.5 font-mono text-xs text-slate-300">
                          {family.headPhoneNumber || "—"}
                        </TableCell>

                        {/* District / SubDistrict */}
                        <TableCell className="py-3.5 text-xs">
                          <span className="font-bold text-slate-200 block">{districtStr}</span>
                          <span className="text-[10px] text-slate-400 block">{subDistrictStr}</span>
                        </TableCell>

                        {/* Members Count */}
                        <TableCell className="py-3.5 text-center font-bold text-white tabular-nums text-sm">
                          {totalM}
                        </TableCell>

                        {/* Per Capita Income */}
                        <TableCell className="py-3.5 text-xs font-mono font-semibold text-slate-300">
                          {perCapita > 0 ? `${perCapita.toLocaleString("ar-YE-u-nu-latn")} ريال` : "غير موثق"}
                        </TableCell>

                        {/* Housing */}
                        <TableCell className="py-3.5 text-xs font-bold text-slate-300">
                          {family.housingType || "متهالك"}
                        </TableCell>

                        {/* Tags Badges */}
                        <TableCell className="py-3.5 text-xs">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {family.hasOrphans && <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0.5">أيتام</Badge>}
                            {family.hasWidow && <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[9px] px-1.5 py-0.5">أرامل</Badge>}
                            {family.isDisplaced && <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[9px] px-1.5 py-0.5">نازحون</Badge>}
                            {family.specialNeedsCount > 0 && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] px-1.5 py-0.5">إعاقة</Badge>}
                          </div>
                        </TableCell>

                        {/* Need Score Circular Gauge & Priority */}
                        <TableCell className="py-3.5 text-center">
                          <NeedScoreBadge score={family.vulnerabilityScore} familyData={family} size="sm" />
                        </TableCell>

                        {/* Actions & Family Card Sheet */}
                        <TableCell className="py-3.5 pl-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Family Printable QR Card */}
                            <FamilyCardSheet family={family} />

                            {/* View Profile */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetails(family)}
                              className="h-8 px-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                      لا توجد أسر مطابقة لخيارات الفلترة الحالية.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Sheet Component */}
      <FamilyDetailsSheet
        family={selectedFamily}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  )
}
