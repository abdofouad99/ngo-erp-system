"use client"

import { useState } from "react"
import {
  Baby,
  Eye,
  Search,
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

export function OrphansClient({ initialOrphans }: OrphansClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGender, setSelectedGender] = useState("ALL")
  const [selectedOrphan, setSelectedOrphan] = useState<Orphan | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Cast initial orphans to local typed array
  const orphans = initialOrphans as Orphan[]

  const filteredOrphans = orphans.filter((orphan) => {
    const matchesSearch =
      orphan.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orphan.nationalId && orphan.nationalId.includes(searchTerm)) ||
      (orphan.orphanCode && orphan.orphanCode.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesGender = selectedGender === "ALL" || orphan.gender === selectedGender

    return matchesSearch && matchesGender
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
      {/* ── Filter & Search Bar ─────────────────────────────────── */}
      <Card className="glass-card">
        <CardContent className="p-4">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Data Table ──────────────────────────────────────────── */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/40 border-b border-border/80">
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-right font-bold text-slate-200 py-3.5 pr-6">كود اليتيم</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الاسم الكامل</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">اسم رب الأسرة</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الجنس</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">العمر</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الحالة</TableHead>
                <TableHead className="text-center font-bold text-slate-200 py-3.5 pl-6">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrphans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    لا توجد نتائج تطابق خيارات البحث والتصفية.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrphans.map((orphan) => (
                  <TableRow
                    key={orphan.id}
                    className="hover:bg-slate-800/30 border-border/40 transition-colors duration-150"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-emerald-400 tabular-nums pr-6">
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
