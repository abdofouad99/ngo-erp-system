"use client"

import { useState } from "react"
import {
  Search,
  Eye,
  Edit,
  HeartHandshake,
  Users,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Globe,
  Building,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SponsorDetailsSheet } from "@/components/sponsors/sponsor-details-sheet"
import { SponsorFormSheet } from "@/components/sponsors/sponsor-form-sheet"
import {
  updateSponsorshipStatus,
  deleteSponsorship,
} from "@/app/actions/sponsorship-actions"

interface SponsorsClientProps {
  initialSponsors: any[]
  initialSponsorships: any[]
  activeOrphans: any[]
  activeFamilies: any[]
}

export function SponsorsClient({
  initialSponsors,
  initialSponsorships,
  activeOrphans,
  activeFamilies,
}: SponsorsClientProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState("sponsors")

  // Search & Filter States
  const [sponsorSearch, setSponsorSearch] = useState("")
  const [sponsorshipSearch, setSponsorshipSearch] = useState("")
  const [selectedTargetType, setSelectedTargetType] = useState("ALL")
  const [selectedCurrency, setSelectedCurrency] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")

  // Details Sheet State
  const [selectedSponsor, setSelectedSponsor] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Loading States
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter Sponsors
  const filteredSponsors = initialSponsors.filter((sponsor) => {
    return (
      sponsor.fullName.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
      (sponsor.email && sponsor.email.toLowerCase().includes(sponsorSearch.toLowerCase())) ||
      (sponsor.country && sponsor.country.toLowerCase().includes(sponsorSearch.toLowerCase())) ||
      (sponsor.organization && sponsor.organization.toLowerCase().includes(sponsorSearch.toLowerCase()))
    )
  })

  // Filter Sponsorships
  const filteredSponsorships = initialSponsorships.filter((sponsorship) => {
    const targetName = sponsorship.beneficiaryId
      ? sponsorship.beneficiary?.fullName
      : sponsorship.family?.headFullName

    const matchesSearch =
      sponsorship.sponsor?.fullName.toLowerCase().includes(sponsorshipSearch.toLowerCase()) ||
      (targetName && targetName.toLowerCase().includes(sponsorshipSearch.toLowerCase()))

    const matchesType =
      selectedTargetType === "ALL" ||
      (selectedTargetType === "ORPHAN" && sponsorship.beneficiaryId) ||
      (selectedTargetType === "FAMILY" && sponsorship.familyId)

    const matchesCurrency =
      selectedCurrency === "ALL" || sponsorship.currency === selectedCurrency

    const matchesStatus =
      selectedStatus === "ALL" || sponsorship.status === selectedStatus

    return matchesSearch && matchesType && matchesCurrency && matchesStatus
  })

  // Handlers
  const handleOpenDetails = (sponsor: any) => {
    setSelectedSponsor(sponsor)
    setIsDetailsOpen(true)
  }

  const handleUpdateStatus = async (id: string, newStatus: any) => {
    setTogglingId(id)
    const result = await updateSponsorshipStatus(id, newStatus)
    if (!result.success) {
      alert(result.error || "فشل تعديل حالة الكفالة.")
    }
    setTogglingId(null)
  }

  const handleDeleteSponsorship = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الكفالة نهائياً من النظام؟")) return
    setDeletingId(id)
    const result = await deleteSponsorship(id)
    if (!result.success) {
      alert(result.error || "فشل حذف الكفالة.")
    }
    setDeletingId(null)
  }

  // Translation helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold px-2 py-0.5">
            فعّالة
          </Badge>
        )
      case "PAUSED":
        return (
          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold px-2 py-0.5">
            موقوفة مؤقتاً
          </Badge>
        )
      case "STOPPED":
        return (
          <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold px-2 py-0.5">
            ملغاة
          </Badge>
        )
      default:
        return <Badge className="bg-slate-800 text-slate-300 border border-slate-700">{status}</Badge>
    }
  }

  const translateCycle = (cycle: string) => {
    switch (cycle) {
      case "MONTHLY":
        return "شهري"
      case "QUARTERLY":
        return "ربع سنوي"
      case "SEMI_ANNUAL":
        return "نصف سنوي"
      case "ANNUAL":
        return "سنوي"
      case "ONE_TIME":
        return "دفعة واحدة"
      default:
        return cycle
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sponsors" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-1 mb-6 flex-shrink-0 gap-1 sm:w-auto w-full justify-start">
          <TabsTrigger 
            value="sponsors" 
            className="text-xs py-2 px-4 transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold text-slate-300"
          >
            <Users className="h-3.5 w-3.5 ml-1.5" />
            إدارة سجلات الكفلاء
          </TabsTrigger>
          <TabsTrigger 
            value="sponsorships" 
            className="text-xs py-2 px-4 transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold text-slate-300"
          >
            <HeartHandshake className="h-3.5 w-3.5 ml-1.5" />
            الكشوفات والكفالات الجارية
          </TabsTrigger>
        </TabsList>

        {/* =====================================================================
            TAB 1: SPONSORS LIST
            ===================================================================== */}
        <TabsContent value="sponsors" className="space-y-4 outline-none">
          {/* Search bar */}
          <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-md shadow-lg">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="البحث باسم الكفيل، الدولة، المنظمة، البريد..."
                  value={sponsorSearch}
                  onChange={(e) => setSponsorSearch(e.target.value)}
                  className="pr-9 bg-slate-900/50 border-slate-800/80 focus-visible:bg-slate-900 focus-visible:ring-emerald-500 text-right placeholder-slate-500 text-sm text-white focus:border-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border border-slate-800 bg-slate-950/30 backdrop-blur-md shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full text-right">
                  <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                    <TableRow className="hover:bg-slate-900 border-b border-slate-800">
                      <TableHead className="text-right text-slate-200 font-bold py-4 pr-6">الاسم الكامل</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">الجهة / المنظمة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">معلومات الاتصال</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">الدولة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">الكفالات المرتبطة</TableHead>
                      <TableHead className="text-center text-slate-200 font-bold py-4 pl-6">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredSponsors.length > 0 ? (
                      filteredSponsors.map((sponsor) => (
                        <TableRow key={sponsor.id} className="hover:bg-slate-900/40 border-b border-slate-900/50 transition-all duration-200">
                          {/* Name */}
                          <td className="py-4 pr-6 font-bold text-white text-sm">
                            {sponsor.fullName}
                          </td>
                          {/* Organization */}
                          <td className="py-4 text-xs font-semibold text-slate-400">
                            {sponsor.organization ? (
                              <div className="flex items-center gap-1.5">
                                <Building className="h-3.5 w-3.5 text-slate-500" />
                                <span>{sponsor.organization}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">كفيل فردي</span>
                            )}
                          </td>
                          {/* Contact */}
                          <td className="py-4 text-xs font-medium text-slate-300 space-y-0.5">
                            {sponsor.phone && (
                              <div className="flex items-center gap-1 font-mono">
                                <Phone className="h-3.5 w-3.5 text-slate-500" />
                                <span>{sponsor.phone}</span>
                              </div>
                            )}
                            {sponsor.email && (
                              <div className="flex items-center gap-1 font-mono">
                                <Mail className="h-3.5 w-3.5 text-slate-500" />
                                <span>{sponsor.email}</span>
                              </div>
                            )}
                            {!sponsor.phone && !sponsor.email && <span>-</span>}
                          </td>
                          {/* Country */}
                          <td className="py-4 text-xs font-semibold text-slate-400">
                            {sponsor.country ? (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5 text-slate-500" />
                                <span>{sponsor.country}</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          {/* sponsorships count */}
                          <td className="py-4 font-bold text-slate-300 tabular-nums text-sm">
                            {sponsor.sponsorships?.length || 0} كفالة
                          </td>
                          {/* Actions */}
                          <td className="py-4 pl-6">
                            <div className="flex items-center justify-center gap-2">
                              {/* Open Details */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDetails(sponsor)}
                                className="h-8 rounded-lg px-2.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 border-blue-500/30 hover:border-blue-500/50 flex items-center gap-1 font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>كشوفات الكفالة</span>
                              </Button>

                              {/* Edit Sponsor */}
                              <SponsorFormSheet
                                sponsor={sponsor}
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg px-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/50 flex items-center gap-1 font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                    <span>تعديل</span>
                                  </Button>
                                }
                              />
                            </div>
                          </td>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <td colSpan={6} className="text-center py-12 text-sm text-slate-500 font-medium">
                          لا توجد نتائج تطابق خيارات بحث الكفلاء.
                        </td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =====================================================================
            TAB 2: SPONSORSHIPS LIST
            ===================================================================== */}
        <TabsContent value="sponsorships" className="space-y-4 outline-none">
          {/* Controls */}
          <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-md shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {/* Search query */}
                <div className="relative md:col-span-2">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="البحث باسم الكفيل أو اسم المستهدف (يتيم أو رب أسرة)..."
                    value={sponsorshipSearch}
                    onChange={(e) => setSponsorshipSearch(e.target.value)}
                    className="pr-9 bg-slate-900/50 border-slate-800/80 focus-visible:bg-slate-900 focus-visible:ring-emerald-500 text-right placeholder-slate-500 text-sm text-white focus:border-emerald-500"
                  />
                </div>

                {/* Target Type Filter */}
                <select
                  value={selectedTargetType}
                  onChange={(e) => setSelectedTargetType(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-right text-slate-200 font-medium cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-950 text-white">كل أنواع الكفالات</option>
                  <option value="ORPHAN" className="bg-slate-950 text-white">كفالات الأيتام الفردية</option>
                  <option value="FAMILY" className="bg-slate-950 text-white">كفالات الأسر المعيشية</option>
                </select>

                {/* Currency Filter */}
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-right text-slate-200 font-medium cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-950 text-white">كل العملات</option>
                  <option value="USD" className="bg-slate-950 text-white">الدولار الأمريكي (USD)</option>
                  <option value="SAR" className="bg-slate-950 text-white">الريال السعودي (SAR)</option>
                  <option value="YER" className="bg-slate-950 text-white">الريال اليمني (YER)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border border-slate-800 bg-slate-950/30 backdrop-blur-md shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full text-right">
                  <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                    <TableRow className="hover:bg-slate-900 border-b border-slate-800">
                      <TableHead className="text-right text-slate-200 font-bold py-4 pr-6">الكفيل</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">نوع الكفالة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">المستفيد المستهدف</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">المبلغ والعملة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">دورة الدفع</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">تاريخ البدء</TableHead>
                      <TableHead className="text-center text-slate-200 font-bold py-4">الحالة</TableHead>
                      <TableHead className="text-center text-slate-200 font-bold py-4 pl-6">تحديث وتعديل الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredSponsorships.length > 0 ? (
                      filteredSponsorships.map((s) => {
                        const isOrphan = !!s.beneficiaryId
                        const targetName = isOrphan
                          ? s.beneficiary?.fullName
                          : s.family?.headFullName
                        return (
                          <TableRow key={s.id} className="hover:bg-slate-900/40 border-b border-slate-900/50 transition-all duration-200">
                            {/* Sponsor */}
                            <td className="py-4 pr-6 font-bold text-white text-sm">
                              {s.sponsor?.fullName}
                            </td>
                            {/* Type */}
                            <td className="py-4">
                              {isOrphan ? (
                                <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/20 bg-blue-500/10 font-medium">يتيم فردي</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/20 bg-purple-500/10 font-medium">أسرة معيشية</Badge>
                              )}
                            </td>
                            {/* Target Name */}
                            <td className="py-4 font-bold text-slate-200 text-sm">
                              {targetName}
                            </td>
                            {/* Amount & Currency */}
                            <td className="py-4 font-mono font-bold text-emerald-400 tabular-nums">
                              {s.amount.toLocaleString()} {s.currency}
                            </td>
                            {/* Payment Cycle */}
                            <td className="py-4 text-xs font-semibold text-slate-400">
                              {translateCycle(s.paymentCycle)}
                            </td>
                            {/* Start date */}
                            <td className="py-4 font-mono text-xs text-slate-400">
                              {new Date(s.startDate).toLocaleDateString("ar-YE")}
                            </td>
                            {/* Status */}
                            <td className="py-4 text-center">
                              {getStatusBadge(s.status)}
                            </td>
                            {/* Quick status update operations */}
                            <td className="py-4 pl-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Change status buttons */}
                                <select
                                  value={s.status}
                                  disabled={togglingId === s.id}
                                  onChange={(e) => handleUpdateStatus(s.id, e.target.value as any)}
                                  className="h-8 rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs focus-visible:outline-none text-right font-semibold disabled:opacity-50 text-slate-200 cursor-pointer"
                                >
                                  <option value="ACTIVE" className="bg-slate-950 text-white">تنشيط الكفالة</option>
                                  <option value="PAUSED" className="bg-slate-950 text-white">إيقاف مؤقت</option>
                                  <option value="STOPPED" className="bg-slate-950 text-white">إلغاء نهائي</option>
                                </select>

                                {/* Delete button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deletingId === s.id}
                                  onClick={() => handleDeleteSponsorship(s.id)}
                                  className="h-8 w-8 p-0 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 border-rose-500/30 hover:border-rose-500/50 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                                >
                                  {deletingId === s.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <td colSpan={8} className="text-center py-12 text-sm text-slate-500 font-medium">
                          لا توجد نتائج تطابق خيارات بحث الكفالات.
                        </td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Details View Sheet ──────────────────────────── */}
      {selectedSponsor && (
        <SponsorDetailsSheet
          sponsor={selectedSponsor}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
    </div>
  )
}
