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

  // Selected Family state for viewing details
  const [selectedFamily, setSelectedFamily] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Print Family state
  const [printFamilyData, setPrintFamilyData] = useState<any | null>(null)

  // Loading state for toggling active status
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Filter logic
  const filteredFamilies = initialFamilies.filter((family) => {
    const matchesSearch =
      family.headFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      family.headNationalId.includes(searchTerm) ||
      (family.headPhoneNumber && family.headPhoneNumber.includes(searchTerm))

    // Match Governorate
    const matchesGov =
      selectedGov === "ALL" ||
      family.subDistrict?.district?.governorate?.id?.toString() === selectedGov

    // Match Poverty Level
    const matchesPoverty =
      selectedPoverty === "ALL" || family.povertyLevel === selectedPoverty

    // Match Status
    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "ACTIVE" && family.isActive) ||
      (selectedStatus === "INACTIVE" && !family.isActive)

    // Match Displaced
    const matchesDisplaced =
      filterDisplaced === "ALL" ||
      (filterDisplaced === "YES" && family.isDisplaced) ||
      (filterDisplaced === "NO" && !family.isDisplaced)

    // Match Orphans
    const matchesOrphans =
      filterOrphans === "ALL" ||
      (filterOrphans === "YES" && family.hasOrphans) ||
      (filterOrphans === "NO" && !family.hasOrphans)

    // Match Widow
    const matchesWidow =
      filterWidow === "ALL" ||
      (filterWidow === "YES" && family.hasWidow) ||
      (filterWidow === "NO" && !family.hasWidow)

    // Match Unemployed
    const matchesUnemployed =
      filterUnemployed === "ALL" ||
      (filterUnemployed === "YES" && family.hasUnemployed) ||
      (filterUnemployed === "NO" && !family.hasUnemployed)

    // Match Housing Type
    const matchesHousing =
      filterHousingType === "ALL" ||
      family.housingType === filterHousingType

    // Match Max Income
    const matchesIncome =
      !filterMaxIncome ||
      (family.monthlyIncome !== null && family.monthlyIncome <= Number(filterMaxIncome))

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

  // Poverty level translations and styles
  const getPovertyBadge = (level: string | null) => {
    switch (level) {
      case "SEVERE":
        return <Badge className="badge-premium-rose">شديد</Badge>
      case "MEDIUM":
        return <Badge className="badge-premium-orange">متوسط</Badge>
      case "LOW":
        return <Badge className="badge-premium-emerald">منخفض</Badge>
      default:
        return <span className="text-slate-400 text-xs italic">غير محدد</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Filter & Search Control Panel ───────────────────────── */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="البحث باسم رب الأسرة، أو الرقم الوطني، أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 bg-slate-900/40 border-border/80 focus-visible:bg-slate-900/60 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 text-white text-right placeholder-slate-400 text-sm"
              />
            </div>

            {/* Governorate Filter */}
            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right font-medium"
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
              className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right font-medium"
            >
              <option value="ALL" className="bg-slate-950 text-white">كل مستويات الفقر</option>
              <option value="SEVERE" className="bg-slate-950 text-white">فقر شديد</option>
              <option value="MEDIUM" className="bg-slate-950 text-white">فقر متوسط</option>
              <option value="LOW" className="bg-slate-950 text-white">فقر منخفض</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right font-medium"
            >
              <option value="ALL" className="bg-slate-950 text-white">كل الحالات (نشط/معطل)</option>
              <option value="ACTIVE" className="bg-slate-950 text-white">النشطة فقط</option>
              <option value="INACTIVE" className="bg-slate-950 text-white">المعطلة فقط</option>
            </select>
          </div>

          {/* زر التبديل للبحث المتقدم */}
          <div className="flex justify-start mt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              {showAdvanced ? "▲ إخفاء خيارات البحث المتقدم" : "▼ عرض خيارات البحث المتقدم والمركب"}
            </button>
          </div>

          {/* لوحة البحث المتقدم القابلة للطي */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Displaced */}
              <div className="space-y-1.5 text-right">
                <label className="text-[11px] font-bold text-slate-400">حالة النزوح</label>
                <select
                  value={filterDisplaced}
                  onChange={(e) => setFilterDisplaced(e.target.value)}
                  className="flex h-9 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                >
                  <option value="ALL" className="bg-slate-950 text-white">الكل (نازح أو مقيم)</option>
                  <option value="YES" className="bg-slate-950 text-white">الأسر النازحة فقط</option>
                  <option value="NO" className="bg-slate-950 text-white">الأسر المقيمة فقط</option>
                </select>
              </div>

              {/* Orphans */}
              <div className="space-y-1.5 text-right">
                <label className="text-[11px] font-bold text-slate-400">رعاية الأيتام</label>
                <select
                  value={filterOrphans}
                  onChange={(e) => setFilterOrphans(e.target.value)}
                  className="flex h-9 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                >
                  <option value="ALL" className="bg-slate-950 text-white">الكل</option>
                  <option value="YES" className="bg-slate-950 text-white">أسر تكفل أيتاماً</option>
                  <option value="NO" className="bg-slate-950 text-white">لا تكفل أيتاماً</option>
                </select>
              </div>

              {/* Widow */}
              <div className="space-y-1.5 text-right">
                <label className="text-[11px] font-bold text-slate-400">أرامل بالأسرة</label>
                <select
                  value={filterWidow}
                  onChange={(e) => setFilterWidow(e.target.value)}
                  className="flex h-9 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                >
                  <option value="ALL" className="bg-slate-950 text-white">الكل</option>
                  <option value="YES" className="bg-slate-950 text-white">يوجد أرملة بالأسرة</option>
                  <option value="NO" className="bg-slate-950 text-white">لا يوجد أرملة بالأسرة</option>
                </select>
              </div>

              {/* Unemployed */}
              <div className="space-y-1.5 text-right">
                <label className="text-[11px] font-bold text-slate-400">عاطلين عن العمل</label>
                <select
                  value={filterUnemployed}
                  onChange={(e) => setFilterUnemployed(e.target.value)}
                  className="flex h-9 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                >
                  <option value="ALL" className="bg-slate-950 text-white">الكل</option>
                  <option value="YES" className="bg-slate-950 text-white">يوجد عاطلين بالأسرة</option>
                  <option value="NO" className="bg-slate-950 text-white">لا يوجد عاطلين بالأسرة</option>
                </select>
              </div>

              {/* Housing Type */}
              <div className="space-y-1.5 text-right">
                <label className="text-[11px] font-bold text-slate-400">نوع السكن</label>
                <select
                  value={filterHousingType}
                  onChange={(e) => setFilterHousingType(e.target.value)}
                  className="flex h-9 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                >
                  <option value="ALL" className="bg-slate-950 text-white">كل أنواع السكن</option>
                  <option value="ملكي" className="bg-slate-950 text-white">ملكي</option>
                  <option value="إيجار" className="bg-slate-950 text-white">إيجار</option>
                  <option value="نزوح/مخيم" className="bg-slate-950 text-white">نزوح / مخيم</option>
                  <option value="شعبي" className="bg-slate-950 text-white">شعبي</option>
                  <option value="أخرى" className="bg-slate-950 text-white">أخرى</option>
                </select>
              </div>

              {/* Max Income */}
              <div className="space-y-1.5 text-right">
                <label className="text-[11px] font-bold text-slate-400">الحد الأقصى للدخل الشهري</label>
                <Input
                  type="number"
                  placeholder="مبلغ الدخل الأقصى..."
                  value={filterMaxIncome}
                  onChange={(e) => setFilterMaxIncome(e.target.value)}
                  className="bg-slate-900/40 border-border text-white text-xs h-9 focus-visible:ring-emerald-500/50 text-right"
                />
              </div>

              {/* زر مسح فلاتر البحث المتقدم */}
              <div className="col-span-1 sm:col-span-2 md:col-span-3 flex justify-end pt-2">
                <Button
                  onClick={() => {
                    setFilterDisplaced("ALL")
                    setFilterOrphans("ALL")
                    setFilterWidow("ALL")
                    setFilterUnemployed("ALL")
                    setFilterHousingType("ALL")
                    setFilterMaxIncome("")
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold hover:bg-slate-850 hover:text-white border-border rounded-xl px-4 py-1.5 h-8 bg-slate-900/40 text-slate-300"
                >
                  <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
                  إعادة ضبط فلاتر البحث المتقدم
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Table Action Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20 p-4 border border-white/5 rounded-xl">
        <div className="text-sm text-slate-450 font-bold">
          تم العثور على <span className="font-extrabold text-white text-base">{filteredFamilies.length}</span> أسرة
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
            className="rounded-xl px-4 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white gap-2 transition-all duration-300 h-9 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>تصدير Excel (المصفى)</span>
          </Button>
        </div>
      </div>

      {/* ── Table / Grid View ───────────────────────────────────── */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full text-right">
              <TableHeader className="bg-slate-900/40 border-b border-border/80">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-12 text-center text-slate-200 font-bold py-3.5 pr-6">م</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5 pr-2">رب الأسرة</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5">الرقم الوطني</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5">رقم الهاتف</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5">الموقع الجغرافي</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5">نقاط الهشاشة</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5">مستوى الفقر</TableHead>
                  <TableHead className="text-right text-slate-200 font-bold py-3.5">الأفراد المسجلين</TableHead>
                  <TableHead className="text-center text-slate-200 font-bold py-3.5">حالة الملف</TableHead>
                  <TableHead className="text-center text-slate-200 font-bold py-3.5 pl-6">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFamilies.length > 0 ? (
                  filteredFamilies.map((family, i) => {
                    const addressStr = `${family.subDistrict?.district?.governorate?.nameAr} - ${family.subDistrict?.district?.nameAr}`
                    return (
                      <TableRow key={family.id} className="hover:bg-slate-800/30 border-border/40 transition-colors duration-150">
                        {/* Serial number */}
                        <TableCell className="text-center py-3.5 pr-6 text-slate-400 font-mono font-semibold text-xs tabular-nums">
                          {i + 1}
                        </TableCell>
                        {/* Name */}
                        <TableCell className="py-3.5 pr-2 font-bold text-white text-sm">
                          {family.headFullName}
                        </TableCell>
                        {/* National ID */}
                        <TableCell className="py-3.5 font-mono text-sm text-slate-300">
                          {family.headNationalId}
                        </TableCell>
                        {/* Phone */}
                        <TableCell className="py-3.5 font-mono text-sm text-slate-300">
                          {family.headPhoneNumber || "-"}
                        </TableCell>
                        {/* Address */}
                        <TableCell className="py-3.5 text-xs font-semibold text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            <span>{addressStr}</span>
                          </div>
                        </TableCell>
                        {/* Vulnerability Score */}
                        <TableCell className="py-3.5 font-bold text-sm text-white tabular-nums">
                          {family.vulnerabilityScore !== null ? `${family.vulnerabilityScore}%` : "-"}
                        </TableCell>
                        {/* Poverty Badge */}
                        <TableCell className="py-3.5">
                          {getPovertyBadge(family.povertyLevel)}
                        </TableCell>
                        {/* Members count */}
                        <TableCell className="py-3.5 font-bold text-slate-300 tabular-nums">
                          {family.members?.length || 0}
                        </TableCell>
                        {/* Active Badge */}
                        <TableCell className="py-3.5 text-center">
                          {family.isActive ? (
                            <Badge className="badge-premium-emerald font-bold">
                              نشط
                            </Badge>
                          ) : (
                            <Badge className="badge-premium-rose font-bold">
                              معطل
                            </Badge>
                          )}
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="py-3.5 pl-6">
                          <div className="flex items-center justify-center gap-2">
                            {/* View details */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetails(family)}
                              className="h-8 rounded-lg px-2.5 text-xs bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>التفاصيل</span>
                            </Button>

                            {/* Family Card QR */}
                            <FamilyCardSheet family={family} />

                            {/* Print Profile */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPrintFamilyData(family)}
                              className="h-8 rounded-lg px-2.5 text-xs bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>طباعة</span>
                            </Button>

                            {/* Edit form */}
                            <FamilyFormSheet
                              family={family}
                              geography={geography}
                              userRole={currentUserRole}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg px-2.5 text-xs bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-50 hover:text-white hover:border-amber-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span>تعديل</span>
                                </Button>
                              }
                            />

                            {/* Toggle active status */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={togglingId === family.id}
                              onClick={() => handleToggleActive(family.id, family.isActive)}
                              className={`h-8 rounded-lg px-2.5 text-xs transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold ${
                                family.isActive
                                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-50 hover:text-white hover:border-rose-500"
                                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-50 hover:text-white hover:border-emerald-500"
                              }`}
                            >
                              {togglingId === family.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : family.isActive ? (
                                <>
                                  <ShieldX className="h-3.5 w-3.5" />
                                  <span>تعطيل</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  <span>تنشيط</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-sm text-slate-400 font-medium">
                      لا توجد نتائج تطابق خيارات البحث والتصفية المحددة.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Detailed Family View Sheet ──────────────────────────── */}
      {selectedFamily && (
        <FamilyDetailsSheet
          family={selectedFamily}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}

      {/* Print Profile Modal */}
      {printFamilyData && (
        <PrintProfile
          type="family"
          data={{
            headOfFamily: printFamilyData.headFullName,
            phone: printFamilyData.headPhoneNumber,
            povertyLevel: printFamilyData.povertyLevel,
            membersCount: printFamilyData.members?.length || 0,
            socialStatus: printFamilyData.socialStatus || "—",
            governorateName: printFamilyData.subDistrict?.district?.governorate?.nameAr || "—",
            orphansCount: printFamilyData.beneficiaries?.filter((b: any) => b.category === "ORPHAN")?.length || 0,
            sequentialNumber: printFamilyData.familyCode || printFamilyData.id,
            notes: printFamilyData.notes,
          }}
          onClose={() => setPrintFamilyData(null)}
        />
      )}
    </div>
  )
}
