"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Baby,
  Eye,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Loader2,
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
import { AddOrphanSheet } from "@/components/orphans/add-orphan-sheet"
import { TagBadge, TagFilterPills, TagSelector } from "@/components/tags/tag-components"
import type { TagData } from "@/components/tags/tag-components"
import { approveOrphan, rejectOrphan, deleteOrphan } from "@/app/actions/orphan-actions"
import { exportToExcel } from "@/lib/excel-export"


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
  families?: { id: string; headFullName: string }[]
  currentUserRole?: string
  currentUserId?: string
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

export function OrphansClient({ 
  initialOrphans, 
  allTags = [], 
  families = [],
  currentUserRole,
  currentUserId,
}: OrphansClientProps) {
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

    const data = targets.map((o) => {
      const primaryGuardian = o.guardians?.find((g: any) => g.isPrimary) || o.guardians?.[0] || {};
      
      const row: any = {
        "كود اليتيم": o.orphanCode || "",
        "الاسم الكامل": o.fullName || "",
        "الاسم المختصر للكشوفات": o.shortName || "",
        "الجنس": o.gender === "MALE" ? "ذكر" : "أنثى",
        "تاريخ الميلاد": o.birthdate ? new Date(o.birthdate).toLocaleDateString("ar-YE") : "",
        "الرقم الوطني / شهادة الميلاد": o.nationalId || "",
        "الديانة": o.religion || "",
        "اسم الوالد رباعياً": o.fatherFullName || "",
        "اسم الأم": o.motherName || "",
        "رقم المميو كريمي": o.mumaiyo || "",
        "رقم حساب الكريمي الجديد": o.kuraimiAccount || "",
        "رقم حساب الكريمي القديم": o.kuraimiAccountOld || "",
        "رقم بيت الزكاة": o.baitZakatNumber || "",
        "المرحلة الدراسية": o.educationalStage || "",
        "الصف الدراسي": o.educationLevel || "",
        "اسم المدرسة": o.schoolName || "",
        "مقدار الحفظ من القرآن": o.quranMemorization || "",
        "وضع السكن": o.housingStatus || "",
        "التغذية": o.nutritionStatus || "",
        "الحالة الصحية": o.healthStatus || "",
        "يعاني من إعاقة؟": o.disability ? "نعم" : "لا",
        "نوع الإعاقة": o.disabilityType || "",
        "تفاصيل الإعاقة": o.disabilityDetails || "",
        "نوع اليتيم": o.orphanType === "FATHER" ? "يتيم الأب" : o.orphanType === "MOTHER" ? "يتيم الأم" : o.orphanType === "BOTH" ? "يتيم الأبوين" : "",
        "تاريخ وفاة الأب": o.fatherDeathDate ? new Date(o.fatherDeathDate).toLocaleDateString("ar-YE") : "",
        "سبب وفاة الأب": o.fatherDeathCause || "",
        "تاريخ وفاة الأم": o.motherDeathDate ? new Date(o.motherDeathDate).toLocaleDateString("ar-YE") : "",
        "محافظة الميلاد": o.birthGovernorate || "",
        "مديرية الميلاد": o.birthDistrict || "",
        "عزلة الميلاد": o.birthVillage || "",
        "منطقة الميلاد": o.birthArea || "",
        "اسم المعرِّف": o.referrerName || "",
        "هاتف المعرِّف 1": o.referrerPhone1 || "",
        "هاتف المعرِّف 2": o.referrerPhone2 || "",
        "الجهة المسوَّق لها": o.marketedToOrg || "",
        "الملاحظات": o.notes || "",
        "اسم المعيل الأساسي": primaryGuardian.fullName || "",
        "رقم هوية المعيل الأساسي": primaryGuardian.nationalId || "",
        "صلة قرابة المعيل الأساسي": primaryGuardian.relation || "",
        "عمل المعيل الأساسي": primaryGuardian.occupation || "",
        "هاتف المعيل الأساسي 1": primaryGuardian.phone1 || "",
        "هاتف المعيل الأساسي 2": primaryGuardian.phone2 || "",
        "هاتف المعيل الأساسي 3": primaryGuardian.phone3 || "",
        "هاتف المعيل الأساسي 4": primaryGuardian.phone4 || "",
      };

      for (let i = 0; i < 7; i++) {
        const sib = o.siblings?.[i] || {};
        row[`اسم الأخ ${i + 1}`] = sib.fullName || "";
        row[`جنس الأخ ${i + 1}`] = sib.gender === "MALE" ? "ذكر" : sib.gender === "FEMALE" ? "أنثى" : "";
        row[`مؤهل الأخ ${i + 1}`] = sib.qualification || "";
        row[`تاريخ ميلاد الأخ ${i + 1}`] = sib.birthdate ? new Date(sib.birthdate).toLocaleDateString("ar-YE") : "";
        row[`الحالة الاجتماعية للأخ ${i + 1}`] = sib.socialStatus || "";
      }

      return row;
    });

    exportToExcel(data, "تصدير_الأيتام", "الأيتام");
  };
  const router = useRouter()
  const [selectedGender, setSelectedGender] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [selectedFundingTagId, setSelectedFundingTagId] = useState<string | null>(null)
  const [selectedOrphan, setSelectedOrphan] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteOrphan = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف اليتيم (${name}) ونقل ملفه إلى سلة المهملات؟`)) return
    setDeletingId(id)
    try {
      const res = await deleteOrphan(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || "فشل حذف اليتيم.")
      }
    } catch (err) {
      console.error(err)
      alert("حدث خطأ غير متوقع.")
    } finally {
      setDeletingId(null)
    }
  }

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
    const matchesStatus = selectedStatus === "ALL" || orphan.verificationStatus === selectedStatus

    const orphanTagIds = (orphan.tags || []).map((bt: any) => bt.tagId)
    const matchesStatusTag = !selectedTagId || orphanTagIds.includes(selectedTagId)
    const matchesFundingTag = !selectedFundingTagId || orphanTagIds.includes(selectedFundingTagId)

    return matchesSearch && matchesGender && matchesStatus && matchesStatusTag && matchesFundingTag
  })

  const handleApprove = async (id: string) => {
    const res = await approveOrphan(id)
    if (res.success) {
      // Fallback: send WhatsApp from browser if server couldn't reach local bot
      if (res.notifyMarketer && res.notifyMarketer.phone) {
        const { phone, orphanName } = res.notifyMarketer
        let cleaned = phone.replace(/\D/g, "")
        if (cleaned.startsWith("0")) cleaned = "967" + cleaned.substring(1)
        else if (cleaned.length === 9) cleaned = "967" + cleaned
        const msg = `🎉 بشرى سارة! تم اعتماد وقبول ملف اليتيم: *${orphanName}* بنجاح في النظام من قبل الإدارة. شكراً لجهودك! 🌹`
        try {
          await fetch("http://127.0.0.1:5005/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: cleaned, message: msg }),
            mode: "cors"
          })
        } catch (e) { console.warn("WhatsApp bot unreachable", e) }
      }
      router.refresh()
    }
    return res
  }

  const handleReject = async (id: string, reason: string) => {
    const res = await rejectOrphan(id, reason)
    if (res.success) {
      // Fallback: send WhatsApp from browser if server couldn't reach local bot
      if (res.notifyMarketer && res.notifyMarketer.phone) {
        const { phone, orphanName } = res.notifyMarketer
        let cleaned = phone.replace(/\D/g, "")
        if (cleaned.startsWith("0")) cleaned = "967" + cleaned.substring(1)
        else if (cleaned.length === 9) cleaned = "967" + cleaned
        const msg = `⚠️ تنبيه: تم إرجاع/رفض ملف اليتيم: *${orphanName}* من قبل الإدارة لإجراء تعديلات.\n\n📝 *سبب الرفض:*\n${reason}\n\n🔗 يرجى الدخول لحسابك وتحديث البيانات:\nhttps://ngo-erp-system.vercel.app/login`
        try {
          await fetch("http://127.0.0.1:5005/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: cleaned, message: msg }),
            mode: "cors"
          })
        } catch (e) { console.warn("WhatsApp bot unreachable", e) }
      }
      router.refresh()
    }
    return res
  }

  const handleOpenDetails = (orphan: Orphan) => {
    router.push(`/dashboard/orphans/${orphan.id}`)
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
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Gender Filter Group */}
              <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl border border-border/60">
                <Button
                  onClick={() => setSelectedGender("ALL")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedGender === "ALL"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  الكل (الجنس)
                </Button>
                <Button
                  onClick={() => setSelectedGender("MALE")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedGender === "MALE"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  ذكور
                </Button>
                <Button
                  onClick={() => setSelectedGender("FEMALE")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedGender === "FEMALE"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  إناث
                </Button>
              </div>

              {/* Verification Status Filter Group */}
              <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl border border-border/60">
                <Button
                  onClick={() => setSelectedStatus("ALL")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedStatus === "ALL"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  الكل (الاعتماد)
                </Button>
                <Button
                  onClick={() => setSelectedStatus("APPROVED")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedStatus === "APPROVED"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  معتمد ومقبول
                </Button>
                <Button
                  onClick={() => setSelectedStatus("PENDING")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedStatus === "PENDING"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  طلبات معلقة
                </Button>
                <Button
                  onClick={() => setSelectedStatus("REJECTED")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedStatus === "REJECTED"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  طلبات مرفوضة
                </Button>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExportSelected}
                disabled={filteredOrphans.length === 0}
                className="rounded-xl px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all duration-300 h-9 active:scale-[0.98]"
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
                      {orphan.verificationStatus === "APPROVED" && (
                        <Badge className="badge-premium-emerald">
                          معتمد
                        </Badge>
                      )}
                      {orphan.verificationStatus === "PENDING" && (
                        <Badge className="badge-premium-orange">
                          قيد المراجعة
                        </Badge>
                      )}
                      {orphan.verificationStatus === "REJECTED" && (
                        <Badge className="badge-premium-rose">
                          مرفوض
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pl-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* عرض التفاصيل */}
                        <Button
                          onClick={() => handleOpenDetails(orphan)}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg px-2.5 text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>التفاصيل</span>
                        </Button>

                        <AddOrphanSheet
                          families={families}
                          orphan={orphan}
                          userRole={currentUserRole}
                          createdById={currentUserId}
                          isMarketer={currentUserRole === "MARKETER"}
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

                        {/* حذف/تعطيل */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingId === orphan.id}
                          onClick={() => handleDeleteOrphan(orphan.id, orphan.fullName)}
                          className="h-8 rounded-lg px-2.5 text-xs bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-50 hover:text-white hover:border-rose-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold"
                        >
                          {deletingId === orphan.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>حذف</span>
                            </>
                          )}
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

    </div>
  )
}
