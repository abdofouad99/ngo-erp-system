"use client"

import { useState } from "react"
import {
  Baby,
  Eye,
  Search,
  Filter,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { OrphanDetailsSheet } from "@/components/orphans/orphan-details-sheet"
import { TagBadge, TagFilterPills, TagSelector } from "@/components/tags/tag-components"
import type { TagData } from "@/components/tags/tag-components"

// =============================================================================
// TYPES
// =============================================================================

type Sponsor = {
  fullName: string
  country: string | null
  notes: string | null
}

type Sponsorship = {
  id: string
  amount: any
  currency: string
  paymentCycle: string
  status: string
  sponsorCountry: string | null
  sponsorshipNotes: string | null
  sponsor: Sponsor
}

type Family = {
  headFullName: string
  headNationalId: string
  headGender: string
  headPhoneNumber: string | null
  headAltPhone: string | null
  headBirthdate: Date | null
  addressDetail: string | null
  vulnerabilityScore: number | null
  notes: string | null
  isActive: boolean
  guardianName: string | null
  guardianRelation: string | null
  guardianPhone: string | null
  familyMembersCount: number | null
  monthlyIncome: number | null
  housingType: string | null
  housingCondition: string | null
  povertyLevel: string | null
}

type Orphan = {
  id: string
  fullName: string
  gender: string
  birthdate: Date
  nationalId: string | null
  category: string
  orphanCode: string | null
  kuraimiAccount: string | null
  educationLevel: string | null
  schoolName: string | null
  educationalStage: string | null
  averageGrade: number | null
  educationalNeeds: string | null
  healthStatus: string | null
  disabilityType: string | null
  disability: boolean
  disabilityDetails: string | null
  orphanType: string | null
  fatherDeathDate: Date | null
  fatherDeathCause: string | null
  motherDeathDate: Date | null
  motherName: string | null
  verificationStatus: string
  verifiedBy: string | null
  isActive: boolean
  notes: string | null
  family: Family
  sponsorships: Sponsorship[]
}

interface OrphansClientProps {
  initialOrphans: any[]
  allTags?: TagData[]
}

// =============================================================================
// HELPERS
// =============================================================================

function calculateAge(birthdate: Date | string): number {
  if (!birthdate) return 0
  const today = new Date()
  const birthDate = new Date(birthdate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

function formatDate(date: Date | string | null): string {
  if (!date) return "غير محدد"
  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "غير محدد"
  return new Intl.NumberFormat("ar-YE", {
    style: "currency",
    currency: "YER",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function OrphansClient({ initialOrphans, allTags = [] }: OrphansClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAllToggle = () => {
    const allVisibleSelected = filteredOrphans.length > 0 && filteredOrphans.every(o => selectedIds.includes(o.id));
    if (allVisibleSelected) {
      const visibleIds = filteredOrphans.map(o => o.id);
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = filteredOrphans.map(o => o.id);
      setSelectedIds(prev => {
        const next = [...prev];
        visibleIds.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  }

  const handleExportSelected = () => {
    const targets = selectedIds.length > 0
      ? orphans.filter(o => selectedIds.includes(o.id))
      : filteredOrphans;

    const headers = [
      "كود اليتيم",
      "الاسم الكامل",
      "الاسم المختصر للكشوفات",
      "الجنس",
      "تاريخ الميلاد",
      "الرقم الوطني / شهادة الميلاد",
      "الديانة",
      "اسم الوالد رباعياً",
      "اسم الأم",
      "رقم المميو كريمي",
      "رقم حساب الكريمي الجديد",
      "رقم حساب الكريمي القديم",
      "رقم بيت الزكاة",
      "المرحلة الدراسية",
      "الصف الدراسي",
      "اسم المدرسة",
      "مقدار الحفظ من القرآن",
      "وضع السكن",
      "التغذية",
      "الحالة الصحية",
      "يعاني من إعاقة؟",
      "نوع الإعاقة",
      "تفاصيل الإعاقة",
      "نوع اليتيم",
      "تاريخ وفاة الأب",
      "سبب وفاة الأب",
      "تاريخ وفاة الأم",
      "محافظة الميلاد",
      "مديرية الميلاد",
      "عزلة الميلاد",
      "منطقة الميلاد",
      "اسم المعرِّف",
      "هاتف المعرِّف 1",
      "هاتف المعرِّف 2",
      "الجهة المسوَّق لها",
      "الملاحظات",
      "اسم المعيل الأساسي",
      "رقم هوية المعيل الأساسي",
      "صلة قرابة المعيل الأساسي",
      "عمل المعيل الأساسي",
      "هاتف المعيل الأساسي 1",
      "هاتف المعيل الأساسي 2",
      "هاتف المعيل الأساسي 3",
      "هاتف المعيل الأساسي 4",
      "اسم الأخ 1", "جنس الأخ 1", "مؤهل الأخ 1", "تاريخ ميلاد الأخ 1", "الحالة الاجتماعية للأخ 1",
      "اسم الأخ 2", "جنس الأخ 2", "مؤهل الأخ 2", "تاريخ ميلاد الأخ 2", "الحالة الاجتماعية للأخ 2",
      "اسم الأخ 3", "جنس الأخ 3", "مؤهل الأخ 3", "تاريخ ميلاد الأخ 3", "الحالة الاجتماعية للأخ 3",
      "اسم الأخ 4", "جنس الأخ 4", "مؤهل الأخ 4", "تاريخ ميلاد الأخ 4", "الحالة الاجتماعية للأخ 4",
      "اسم الأخ 5", "جنس الأخ 5", "مؤهل الأخ 5", "تاريخ ميلاد الأخ 5", "الحالة الاجتماعية للأخ 5",
      "اسم الأخ 6", "جنس الأخ 6", "مؤهل الأخ 6", "تاريخ ميلاد الأخ 6", "الحالة الاجتماعية للأخ 6",
      "اسم الأخ 7", "جنس الأخ 7", "مؤهل الأخ 7", "تاريخ ميلاد الأخ 7", "الحالة الاجتماعية للأخ 7"
    ];

    const rows = targets.map((o) => {
      const primaryGuardian = o.guardians?.find((g: any) => g.isPrimary) || o.guardians?.[0] || {};
      
      const sibRows: string[] = [];
      for (let i = 0; i < 7; i++) {
        const sib = o.siblings?.[i] || {};
        sibRows.push(
          sib.fullName || "",
          sib.gender === "MALE" ? "ذكر" : sib.gender === "FEMALE" ? "أنثى" : "",
          sib.qualification || "",
          sib.birthdate ? new Date(sib.birthdate).toLocaleDateString("ar-YE") : "",
          sib.socialStatus || ""
        );
      }

      return [
        o.orphanCode || "",
        o.fullName || "",
        o.shortName || "",
        o.gender === "MALE" ? "ذكر" : "أنثى",
        o.birthdate ? new Date(o.birthdate).toLocaleDateString("ar-YE") : "",
        o.nationalId || "",
        o.religion || "",
        o.fatherFullName || "",
        o.motherName || "",
        o.mumaiyo || "",
        o.kuraimiAccount || "",
        o.kuraimiAccountOld || "",
        o.baitZakatNumber || "",
        o.educationalStage || "",
        o.educationLevel || "",
        o.schoolName || "",
        o.quranMemorization || "",
        o.housingStatus || "",
        o.nutritionStatus || "",
        o.healthStatus || "",
        o.disability ? "نعم" : "لا",
        o.disabilityType || "",
        o.disabilityDetails || "",
        o.orphanType === "FATHER" ? "يتيم الأب" : o.orphanType === "MOTHER" ? "يتيم الأم" : o.orphanType === "BOTH" ? "يتيم الأبوين" : "",
        o.fatherDeathDate ? new Date(o.fatherDeathDate).toLocaleDateString("ar-YE") : "",
        o.fatherDeathCause || "",
        o.motherDeathDate ? new Date(o.motherDeathDate).toLocaleDateString("ar-YE") : "",
        o.birthGovernorate || "",
        o.birthDistrict || "",
        o.birthVillage || "",
        o.birthArea || "",
        o.referrerName || "",
        o.referrerPhone1 || "",
        o.referrerPhone2 || "",
        o.marketedToOrg || "",
        o.notes || "",
        // Guardian
        primaryGuardian.fullName || "",
        primaryGuardian.nationalId || "",
        primaryGuardian.relation || "",
        primaryGuardian.occupation || "",
        primaryGuardian.phone1 || "",
        primaryGuardian.phone2 || "",
        primaryGuardian.phone3 || "",
        primaryGuardian.phone4 || "",
        // Siblings
        ...sibRows
      ];
    });

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تصدير_الأيتام_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
  };
  const [selectedGender, setSelectedGender] = useState("ALL")
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [selectedFundingTagId, setSelectedFundingTagId] = useState<string | null>(null)
  const [selectedOrphan, setSelectedOrphan] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Cast initial orphans to local typed array
  const orphans = initialOrphans as any[]

  // Tags filtered by category
  const operationalTags = allTags.filter((t) => t.category === "ORPHAN_OPERATIONAL_STATUS")
  const fundingTags = allTags.filter((t) => t.category === "FUNDING_SOURCE")

  const filteredOrphans = orphans.filter((orphan) => {
    const matchesSearch =
      orphan.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orphan.family?.headFullName && orphan.family.headFullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.nationalId && orphan.nationalId.includes(searchTerm)) ||
      (orphan.orphanCode && orphan.orphanCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.marketedToOrg && orphan.marketedToOrg.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.tags && orphan.tags.some((bt: any) => bt.tag?.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (orphan.sponsorships && orphan.sponsorships.some((s: any) => s.sponsor?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesGender = selectedGender === "ALL" || orphan.gender === selectedGender

    const orphanTagIds = (orphan.tags || []).map((bt: any) => bt.tagId)
    const matchesStatusTag = !selectedTagId || orphanTagIds.includes(selectedTagId)
    const matchesFundingTag = !selectedFundingTagId || orphanTagIds.includes(selectedFundingTagId)

    return matchesSearch && matchesGender && matchesStatusTag && matchesFundingTag
  })

  const handleOpenDetails = (orphan: Orphan) => {
    setSelectedOrphan(orphan)
    setIsSheetOpen(true)
  }

  // Helper translations
  const translateOrphanType = (type: string | null) => {
    if (type === "FATHER") return "يتيم الأب"
    if (type === "MOTHER") return "يتيم الأم"
    if (type === "BOTH") return "يتيم الأبوين"
    return "غير محدد"
  }

  const translatePovertyLevel = (level: string | null) => {
    if (level === "SEVERE") return "شديد الفقر"
    if (level === "MEDIUM") return "متوسط الفقر"
    if (level === "LOW") return "منخفض الفقر"
    return "غير محدد"
  }

  const translateVerificationStatus = (status: string) => {
    if (status === "APPROVED") return "مكتمل ومعتمد"
    if (status === "REJECTED") return "مرفوض"
    return "قيد المراجعة والتحقق"
  }

  const translatePaymentCycle = (cycle: string) => {
    if (cycle === "MONTHLY") return "شهري"
    if (cycle === "QUARTERLY") return "ربع سنوي"
    if (cycle === "ANNUAL") return "سنوي"
    if (cycle === "SEMI_ANNUAL") return "نصف سنوي"
    if (cycle === "ONE_TIME") return "مرة واحدة"
    return cycle
  }

  return (
    <div className="space-y-6">
      {/* ── Filter & Search Bar ────────────────────────────────────── */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="البحث باسم اليتيم أو الرقم الوطني أو كود الملف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 bg-slate-900/40 border-border/80 focus-visible:bg-slate-900/60 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 text-white text-right placeholder-slate-400 text-sm"
              />
            </div>
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setSelectedGender("ALL")}
                className={`rounded-xl px-4 text-xs font-bold transition-all duration-300 active:scale-[0.98] ${
                  selectedGender === "ALL"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]"
                    : "bg-slate-900/30 border border-border/80 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700"
                }`}
              >
                الكل
              </Button>
              <Button
                onClick={() => setSelectedGender("MALE")}
                className={`rounded-xl px-4 text-xs font-bold transition-all duration-300 active:scale-[0.98] ${
                  selectedGender === "MALE"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]"
                    : "bg-slate-900/30 border border-border/80 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700"
                }`}
              >
                ذكور
              </Button>
              <Button
                onClick={() => setSelectedGender("FEMALE")}
                className={`rounded-xl px-4 text-xs font-bold transition-all duration-300 active:scale-[0.98] ${
                  selectedGender === "FEMALE"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]"
                    : "bg-slate-900/30 border border-border/80 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700"
                }`}
              >
                إناث
              </Button>

              {/* Export Button */}
              <Button
                onClick={handleExportSelected}
                disabled={filteredOrphans.length === 0}
                className="rounded-xl px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all duration-300 active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>تصدير Excel ({selectedIds.length > 0 ? `${selectedIds.length} محدد` : "الكل"})</span>
              </Button>
            </div>
          </div>

          {/* Tag Filters Row */}
          {(operationalTags.length > 0 || fundingTags.length > 0) && (
            <div className="space-y-2 pt-1 border-t border-white/5">
              {operationalTags.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-white/40 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> الحالة
                  </span>
                  <TagFilterPills
                    tags={operationalTags}
                    selectedId={selectedTagId}
                    onSelect={setSelectedTagId}
                    placeholder="جميع الحالات"
                  />
                </div>
              )}
              {fundingTags.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-white/40 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> جهة التمويل
                  </span>
                  <TagFilterPills
                    tags={fundingTags}
                    selectedId={selectedFundingTagId}
                    onSelect={setSelectedFundingTagId}
                    placeholder="جميع الجهات"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Data Table ──────────────────────────────────────────── */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="w-12 text-center py-3.5 pr-4">
                  <input
                    type="checkbox"
                    checked={filteredOrphans.length > 0 && filteredOrphans.every(o => selectedIds.includes(o.id))}
                    onChange={handleSelectAllToggle}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900/40 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5 pr-2">كود اليتيم</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الاسم الكامل</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">اسم رب الأسرة</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الجنس</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">العمر</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">التصنيفات</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الحالة</TableHead>
                <TableHead className="text-center font-bold text-slate-200 py-3.5 pl-6">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrphans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                    لا توجد نتائج تطابق خيارات البحث والتصفية.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrphans.map((orphan) => (
                  <TableRow
                    key={orphan.id}
                    className="hover:bg-slate-800/30 border-border/40 transition-colors duration-150"
                  >
                    <TableCell className="text-center py-3.5 pr-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(orphan.id)}
                        onChange={() => handleSelectRow(orphan.id)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900/40 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-emerald-400 tabular-nums pr-2">
                      {orphan.orphanCode || "—"}
                    </TableCell>
                    <TableCell className="font-bold text-white">{orphan.fullName}</TableCell>
                    <TableCell className="text-slate-300 font-medium">{orphan.family.headFullName}</TableCell>
                    <TableCell>
                      {orphan.gender === "MALE" ? (
                        <Badge className="badge-premium-blue">
                          ذكر
                        </Badge>
                      ) : (
                        <Badge className="badge-premium-rose">
                          أنثى
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300 tabular-nums font-semibold">
                      {calculateAge(orphan.birthdate).toLocaleString("ar-SA")} سنة
                    </TableCell>
                    {/* Tags Column */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(orphan.tags || []).slice(0, 3).map((bt: any) => (
                          <TagBadge key={bt.tagId} tag={bt.tag} />
                        ))}
                        {(orphan.tags || []).length > 3 && (
                          <span className="text-[10px] text-white/40">+{(orphan.tags || []).length - 3}</span>
                        )}
                        {(orphan.tags || []).length === 0 && allTags.length > 0 && (
                          <TagSelector
                            entityId={orphan.id}
                            entityType="beneficiary"
                            allTags={allTags}
                            selectedTagIds={[]}
                            label="+ تصنيف"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {orphan.verificationStatus === "APPROVED" ? (
                        <Badge className="badge-premium-emerald">
                          معتمد
                        </Badge>
                      ) : (
                        <Badge className="badge-premium-orange">
                          قيد المراجعة
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pl-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => handleOpenDetails(orphan)}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg px-3 text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1.5 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>عرض التفاصيل</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Detailed View Side Sheet ────────────────────────────── */}
      <OrphanDetailsSheet
        orphan={selectedOrphan}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  )
}
