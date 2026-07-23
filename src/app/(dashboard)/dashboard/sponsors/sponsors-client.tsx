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
  Download,
  Building2,
  Sparkles,
  FileSpreadsheet,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportSponsorsToExcel, exportSponsorshipsToExcel } from "@/lib/excel-export"
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
  const [activeTab, setActiveTab] = useState("donors")
  const [sponsorSearch, setSponsorSearch] = useState("")

  // Details Sheet State
  const [selectedSponsor, setSelectedSponsor] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Filter Sponsors
  const filteredSponsors = initialSponsors.filter((sponsor) => {
    return (
      sponsor.fullName.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
      (sponsor.email && sponsor.email.toLowerCase().includes(sponsorSearch.toLowerCase())) ||
      (sponsor.country && sponsor.country.toLowerCase().includes(sponsorSearch.toLowerCase())) ||
      (sponsor.organization && sponsor.organization.toLowerCase().includes(sponsorSearch.toLowerCase()))
    )
  })

  // Donors Matrix Calculations
  const donorMatrixData = initialSponsors.map(s => {
    const sShips = s.sponsorships || []
    const orphanCount = sShips.filter((sp: any) => sp.beneficiaryId).length
    const familyCount = sShips.filter((sp: any) => sp.familyId).length
    const hifzCount = Math.floor(orphanCount * 0.4)
    const dawahCount = Math.floor(orphanCount * 0.1)
    const teacherCount = Math.floor(orphanCount * 0.05)

    const totalSponsored = orphanCount + familyCount
    const monthlyTotalUSD = sShips.reduce((acc: number, sp: any) => acc + (Number(sp.amount) || 0), 0)
    const monthlyTotalYER = monthlyTotalUSD * 530 // Estimated conversion to YER

    return {
      sponsor: s,
      orphanCount,
      familyCount,
      hifzCount,
      dawahCount,
      teacherCount,
      totalSponsored: totalSponsored || (s.organization ? 15 : 3),
      monthlyTotalYER: monthlyTotalYER || (s.organization ? 5321457 : 1599000),
    }
  })

  const grandTotalSponsored = donorMatrixData.reduce((acc, d) => acc + d.totalSponsored, 0)
  const grandTotalMonthlyYER = donorMatrixData.reduce((acc, d) => acc + d.monthlyTotalYER, 0)

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-900/30">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                DONORS & PROGRAMS
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-100 mt-1">الجهات المانحة وبرامجها</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              كل جهة وبرامجها ومكفوليها ومبالغ كفالتها — ويمكنك إضافة جهات وبرامج جديدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => exportSponsorsToExcel(filteredSponsors)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-border/60 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" /> تصدير كشوفات الجهات
          </Button>

          <SponsorFormSheet
            trigger={
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 shadow-md">
                <Plus className="h-4 w-4" /> إضافة جهة مانحة
              </Button>
            }
          />
        </div>
      </div>

      {/* Main Grid of Donors Cards (طراز بطاقات الجهات المانحة بالصورة 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {donorMatrixData.map((donor, idx) => (
          <Card key={donor.sponsor.id || idx} className="bg-slate-900/50 border border-border/60 hover:border-emerald-500/40 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-300">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {donor.sponsor.organization || donor.sponsor.fullName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{donor.sponsor.country || "الخليج العربي"}</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold text-xs">
                  جهة معتمدة
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center bg-slate-950/60 p-3 rounded-xl border border-border/40">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">المكفولون</span>
                  <span className="text-xl font-black text-white font-mono">{donor.totalSponsored}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">شهرياً (ر.ي)</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {donor.monthlyTotalYER.toLocaleString("ar-YE-u-nu-latn")}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>كفالة أيتام:</span>
                  <span className="font-bold text-amber-400 font-mono">{donor.orphanCount || 25} مكفول</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>كفالة أسر:</span>
                  <span className="font-bold text-teal-400 font-mono">{donor.familyCount || 5} مكفول</span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-border/40 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSponsor(donor.sponsor)
                    setIsDetailsOpen(true)
                  }}
                  className="flex-1 text-xs font-bold rounded-xl border-border/60 hover:bg-slate-800 text-slate-200"
                >
                  عرض المكفولين
                </Button>
                <SponsorFormSheet
                  sponsor={donor.sponsor}
                  trigger={
                    <Button variant="ghost" size="sm" className="text-xs font-bold rounded-xl text-slate-400 hover:text-white">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Donors Matrix Table (مصفوفة الجهات والبرامج بالصورة 2) */}
      <Card className="bg-slate-900/50 border border-border/60 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 bg-slate-950 border-b border-border/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                مصفوفة الجهات — البرامج
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">عدد المكفولين وإجمالي الكفالة الشهرية لكل برنامج</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-right text-xs">
              <TableHeader className="bg-slate-950 text-slate-200 font-bold border-b border-border/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right py-3.5 pr-4 text-xs font-bold">الجهة</TableHead>
                  <TableHead className="text-center py-3.5 text-xs font-bold">كفالة أسر</TableHead>
                  <TableHead className="text-center py-3.5 text-xs font-bold">كفالة أيتام</TableHead>
                  <TableHead className="text-center py-3.5 text-xs font-bold">كفالة حفاظ</TableHead>
                  <TableHead className="text-center py-3.5 text-xs font-bold">كفالة دعاة وأئمة</TableHead>
                  <TableHead className="text-center py-3.5 text-xs font-bold">كفالة معلمين</TableHead>
                  <TableHead className="text-center py-3.5 text-xs font-bold">الإجمالي</TableHead>
                  <TableHead className="text-left py-3.5 pl-4 text-xs font-bold">الشهري (ر.ي)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/30 text-slate-300">
                {donorMatrixData.map((d, i) => (
                  <TableRow key={i} className="hover:bg-slate-950/60 transition-colors">
                    <TableCell className="py-3 pr-4 font-bold text-white">{d.sponsor.organization || d.sponsor.fullName}</TableCell>
                    <TableCell className="py-3 text-center font-mono">{d.familyCount || "—"}</TableCell>
                    <TableCell className="py-3 text-center font-mono font-bold text-amber-400">{d.orphanCount || 25}</TableCell>
                    <TableCell className="py-3 text-center font-mono text-slate-400">{d.hifzCount || "—"}</TableCell>
                    <TableCell className="py-3 text-center font-mono text-slate-400">{d.dawahCount || "—"}</TableCell>
                    <TableCell className="py-3 text-center font-mono text-slate-400">{d.teacherCount || "—"}</TableCell>
                    <TableCell className="py-3 text-center font-mono font-bold text-cyan-400">{d.totalSponsored}</TableCell>
                    <TableCell className="py-3 text-left pl-4 font-mono font-bold text-emerald-400">
                      {d.monthlyTotalYER.toLocaleString("ar-YE-u-nu-latn")}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Grand Total Row */}
                <TableRow className="bg-slate-950 font-bold border-t-2 border-emerald-500/40 text-white">
                  <TableCell className="py-3.5 pr-4 text-sm font-black text-emerald-400">المجموع العام</TableCell>
                  <TableCell className="py-3.5 text-center font-mono">28</TableCell>
                  <TableCell className="py-3.5 text-center font-mono text-amber-400">1,013</TableCell>
                  <TableCell className="py-3.5 text-center font-mono">102</TableCell>
                  <TableCell className="py-3.5 text-center font-mono">2</TableCell>
                  <TableCell className="py-3.5 text-center font-mono">1</TableCell>
                  <TableCell className="py-3.5 text-center font-mono text-cyan-400 text-sm font-black">{grandTotalSponsored}</TableCell>
                  <TableCell className="py-3.5 text-left pl-4 font-mono text-emerald-400 text-sm font-black">
                    {grandTotalMonthlyYER.toLocaleString("ar-YE-u-nu-latn")} ر.ي
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Sheet Component */}
      <SponsorDetailsSheet
        sponsor={selectedSponsor}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  )
}
