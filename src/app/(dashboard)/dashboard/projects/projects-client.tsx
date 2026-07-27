"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Eye,
  Edit,
  Folder,
  Layers,
  ShoppingBag,
  Trash2,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Download,
  Printer,
  Building2,
  Target,
  Percent,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportProjectsToExcel, exportDistributionsToExcel } from "@/lib/excel-export"
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
import { ProjectDetailsSheet } from "@/components/projects/project-details-sheet"
import { ProjectFormSheet } from "@/components/projects/project-form-sheet"
import {
  updateDistributionStatus,
  deleteDistribution,
} from "@/app/actions/project-actions"

// ─────────────────────────────────────────────────────────────
// Sponsor name map (keyed by project name substring)
// ─────────────────────────────────────────────────────────────
const SPONSOR_BADGES: { match: string; label: string; color: string }[] = [
  { match: "بيت الزكاة",  label: "بيت الزكاة الكويتي", color: "bg-amber-500/15 text-amber-400 border-amber-500/30"  },
  { match: "النجاة",      label: "جمعية النجاة",         color: "bg-sky-500/15 text-sky-400 border-sky-500/30"      },
  { match: "الصفا",       label: "جمعية الصفا",          color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  { match: "تنمية",       label: "جمعية تنمية",          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { match: "الحياة",      label: "مؤسسة الحياة",         color: "bg-rose-500/15 text-rose-400 border-rose-500/30"   },
]

function getSponsorBadge(projectName: string) {
  const match = SPONSOR_BADGES.find((s) => projectName.includes(s.match))
  if (!match) return null
  return (
    <Badge className={`${match.color} border text-[9px] px-1.5 py-0.5 font-bold flex items-center gap-1`}>
      <Building2 className="h-2.5 w-2.5" />
      {match.label}
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────
// Print delivery voucher for a single project
// ─────────────────────────────────────────────────────────────
function printDeliveryVoucher(project: any) {
  const totalTarget = project.targetCount || 0
  const deliveredLinks = project.beneficiaryLinks?.filter((l: any) => l.isDelivered) || []
  const beneficiaryRows = project.beneficiaryLinks?.map((l: any, i: number) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:6px 8px; text-align:center;">${i + 1}</td>
      <td style="padding:6px 8px; font-weight:bold;">${l.beneficiary?.fullName || "-"}</td>
      <td style="padding:6px 8px; text-align:center;">دفعة ${l.batchNumber}</td>
      <td style="padding:6px 8px;">${l.deliveredItem}</td>
      <td style="padding:6px 8px; text-align:center;">${l.quantity}</td>
      <td style="padding:6px 8px; text-align:center;">${l.unitValue ? `${l.unitValue} ${l.currency}` : "-"}</td>
      <td style="padding:6px 8px; text-align:center;">${l.isDelivered ? "✅ تم الاستلام" : "⏳ انتظار"}</td>
      <td style="padding:6px 8px; border:1px solid #ccc; min-width:80px;"></td>
    </tr>
  `).join("") || "<tr><td colspan='8' style='text-align:center; padding:20px; color:#999;'>لا توجد توزيعات مسجلة</td></tr>"

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <title>سند استلام مساعدة - ${project.name}</title>
  <style>
    body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; color: #1a202c; font-size: 13px; }
    .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 20px; }
    .org-name { font-size: 20px; font-weight: bold; color: #1c355e; }
    .doc-title { font-size: 15px; color: #10b981; font-weight: bold; margin-top: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; background: #f7fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-item { font-size: 12px; }
    .meta-label { color: #718096; font-size: 11px; margin-bottom: 2px; }
    .meta-value { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #1c355e; color: white; }
    th { padding: 8px 6px; }
    .footer { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .sign-box { text-align: center; border-top: 1px solid #cbd5e0; padding-top: 8px; font-size: 11px; color: #718096; }
    .stats-bar { display: flex; gap: 12px; margin-bottom: 16px; }
    .stat { background: #f0fdf4; border: 1px solid #d1fae5; padding: 8px 14px; border-radius: 8px; text-align: center; }
    .stat-num { font-size: 20px; font-weight: bold; color: #059669; }
    .stat-label { font-size: 10px; color: #6b7280; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-name">🕊️ منظمة إغاثة وتنمية المجتمع - اليمن</div>
    <div class="doc-title">سند استلام مساعدات ميدانية</div>
    <div style="font-size:11px; color:#718096; margin-top:4px;">تاريخ الطباعة: ${new Date().toLocaleDateString("ar-YE-u-nu-latn")}</div>
  </div>

  <div class="meta">
    <div class="meta-item"><div class="meta-label">اسم المشروع</div><div class="meta-value">${project.name}</div></div>
    <div class="meta-item"><div class="meta-label">تصنيف المشروع</div><div class="meta-value">${project.category === "CASH" ? "نقدي (حوالات)" : project.category === "IN_KIND" ? "عيني (مواد)" : project.category}</div></div>
    <div class="meta-item"><div class="meta-label">الحالة التنفيذية</div><div class="meta-value">${project.status === "COMPLETED" ? "مكتمل ✅" : project.status === "ACTIVE" ? "نشط ⚡" : project.status}</div></div>
    <div class="meta-item"><div class="meta-label">الميزانية الإجمالية</div><div class="meta-value">${project.budget ? `${Number(project.budget).toLocaleString("en-US")} ${project.currency}` : "غير محدد"}</div></div>
  </div>

  <div class="stats-bar">
    <div class="stat"><div class="stat-num">${totalTarget}</div><div class="stat-label">إجمالي المستهدفين</div></div>
    <div class="stat"><div class="stat-num">${deliveredLinks.length}</div><div class="stat-label">تم التسليم</div></div>
    <div class="stat"><div class="stat-num">${totalTarget > 0 ? Math.round((deliveredLinks.length / totalTarget) * 100) : 100}%</div><div class="stat-label">نسبة الإنجاز</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>اسم المستفيد</th><th>رقم الدفعة</th><th>المساعدة المسلمة</th><th>الكمية</th><th>القيمة</th><th>حالة الاستلام</th><th>التوقيع</th>
      </tr>
    </thead>
    <tbody>${beneficiaryRows}</tbody>
  </table>

  <div class="footer">
    <div class="sign-box">توقيع مسؤول التوزيع<br/><br/><br/>_________________</div>
    <div class="sign-box">ختم المنظمة<br/><br/><br/>_________________</div>
    <div class="sign-box">توقيع الجهة الممولة<br/><br/><br/>_________________</div>
  </div>
</body>
</html>`

  const win = window.open("", "_blank", "width=900,height=700")
  if (win) {
    win.document.write(html)
    win.document.close()
    win.print()
  }
}

// ─────────────────────────────────────────────────────────────
// Export bank transfer file (Kuraimi format)
// ─────────────────────────────────────────────────────────────
function exportBankTransferFile(project: any) {
  const links = project.beneficiaryLinks || []
  const rows = [
    ["م", "اسم المستفيد", "رقم الحساب البنكي", "رقم الهاتف", "المبلغ", "العملة", "رقم الدفعة", "الملاحظات"],
    ...links.map((l: any, i: number) => [
      i + 1,
      l.beneficiary?.fullName || "-",
      l.beneficiary?.bankAccountNumber || l.beneficiary?.family?.accountNumber || "-",
      l.beneficiary?.family?.headPhoneNumber || "-",
      l.unitValue || "-",
      l.currency || project.currency || "YER",
      l.batchNumber,
      l.deliveredItem || "",
    ])
  ]

  const csvContent = "\uFEFF" + rows.map((r: (string | number)[]) => r.map((v: string | number) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `كشف_تحويلات_${project.name.slice(0, 30)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────
interface ProjectsClientProps {
  initialProjects: any[]
  initialDistributions: any[]
  activeBeneficiaries: any[]
}

export function ProjectsClient({
  initialProjects,
  initialDistributions,
  activeBeneficiaries,
}: ProjectsClientProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState("projects")

  // Search & Filter States
  const [projectSearch, setProjectSearch] = useState("")
  const [distributionSearch, setDistributionSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState("ALL")

  // Details Sheet State
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Loading States
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Filter Projects ──────────────────────────────────────────
  const filteredProjects = useMemo(() => initialProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(projectSearch.toLowerCase()))

    const matchesCategory = selectedCategory === "ALL" || project.category === selectedCategory
    const matchesStatus   = selectedStatus === "ALL" || project.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  }), [initialProjects, projectSearch, selectedCategory, selectedStatus])

  // ── Dynamic KPI Cards (react to filter) ─────────────────────
  const dynamicKPIs = useMemo(() => {
    const count   = filteredProjects.length
    const target  = filteredProjects.reduce((acc, p) => acc + (p.targetCount || 0), 0)
    const delivered = filteredProjects.reduce((acc, p) => {
      const d = p.beneficiaryLinks?.filter((l: any) => l.isDelivered).length || 0
      return acc + (d > 0 ? d : (p.targetCount || 0))
    }, 0)
    const progress = target > 0 ? Math.min(100, Math.round((delivered / target) * 100)) : (count > 0 ? 100 : 0)
    const budget   = filteredProjects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0)
    const currencies = [...new Set(filteredProjects.map(p => p.currency).filter(Boolean))]
    return { count, target, delivered, progress, budget, currencies }
  }, [filteredProjects])

  // ── Filter Distributions ─────────────────────────────────────
  const filteredDistributions = useMemo(() => initialDistributions.filter((dist) => {
    const matchesSearch =
      dist.project?.name.toLowerCase().includes(distributionSearch.toLowerCase()) ||
      dist.beneficiary?.fullName.toLowerCase().includes(distributionSearch.toLowerCase()) ||
      dist.deliveredItem.toLowerCase().includes(distributionSearch.toLowerCase())

    const matchesDelivery =
      selectedDeliveryStatus === "ALL" ||
      (selectedDeliveryStatus === "DELIVERED" && dist.isDelivered) ||
      (selectedDeliveryStatus === "PENDING" && !dist.isDelivered)

    return matchesSearch && matchesDelivery
  }), [initialDistributions, distributionSearch, selectedDeliveryStatus])

  // ── Handlers ─────────────────────────────────────────────────
  const handleOpenDetails = (project: any) => {
    setSelectedProject(project)
    setIsDetailsOpen(true)
  }

  const handleToggleDelivery = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    const result = await updateDistributionStatus(id, !currentStatus)
    if (!result.success) alert(result.error || "فشل تحديث حالة تسليم المساعدة الميدانية.")
    setTogglingId(null)
  }

  const handleDeleteDistribution = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف سجل التوزيع هذا نهائياً من قاعدة البيانات؟")) return
    setDeletingId(id)
    const result = await deleteDistribution(id)
    if (!result.success) alert(result.error || "فشل حذف سجل التوزيع.")
    setDeletingId(null)
  }

  // ── Translators & Styles ─────────────────────────────────────
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":     return <Badge className="bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-800 font-bold px-2 py-0.5">مسودة</Badge>
      case "ACTIVE":    return <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold px-2 py-0.5">نشط</Badge>
      case "COMPLETED": return <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 font-bold px-2 py-0.5">مكتمل ✅</Badge>
      case "SUSPENDED": return <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold px-2 py-0.5">موقوف مؤقتاً</Badge>
      case "CANCELLED": return <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold px-2 py-0.5">ملغى</Badge>
      default:          return <Badge className="bg-slate-800 text-slate-300 border border-slate-700">{status}</Badge>
    }
  }

  const translateCategory = (category: string) => {
    switch (category) {
      case "IN_KIND":  return "عيني (مواد)"
      case "CASH":     return "نقدي (حوالات)"
      case "MEDICAL":  return "طبي (علاج)"
      case "TRAINING": return "تمكين وتأهيل"
      default:         return category
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="projects" dir="rtl" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-1 mb-6 flex-shrink-0 gap-1 sm:w-auto w-full justify-start">
          <TabsTrigger
            value="projects"
            className="text-xs py-2 px-4 transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold text-slate-300"
          >
            <Folder className="h-3.5 w-3.5 ml-1.5" />
            إدارة المشاريع الإغاثية
          </TabsTrigger>
          <TabsTrigger
            value="distributions"
            className="text-xs py-2 px-4 transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold text-slate-300"
          >
            <CheckCircle className="h-3.5 w-3.5 ml-1.5" />
            سجل التوزيع والمسح الميداني
          </TabsTrigger>
        </TabsList>

        {/* ===================================================================
            TAB 1: PROJECTS LIST
            =================================================================== */}
        <TabsContent value="projects" className="space-y-4 outline-none">
          {/* Search controls */}
          <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-md shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Search query */}
                <div className="relative md:col-span-1">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="البحث باسم المشروع أو الوصف..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="pr-9 bg-slate-900/50 border-slate-800/80 focus-visible:bg-slate-900 focus-visible:ring-emerald-500 text-right placeholder-slate-500 text-sm text-white focus:border-emerald-500"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-right text-slate-200 font-medium cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-950 text-white">كل التصنيفات</option>
                  <option value="IN_KIND" className="bg-slate-950 text-white">عيني (سلل، ملابس)</option>
                  <option value="CASH" className="bg-slate-950 text-white">نقدي (حوالات مالية)</option>
                  <option value="MEDICAL" className="bg-slate-950 text-white">طبي (عمليات، علاج)</option>
                  <option value="TRAINING" className="bg-slate-950 text-white">تأهيل وتمكين</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-right text-slate-200 font-medium cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-950 text-white">كل الحالات التنفيذية</option>
                  <option value="DRAFT" className="bg-slate-950 text-white">تخطيط ومسودات</option>
                  <option value="ACTIVE" className="bg-slate-950 text-white">نشط (قيد التنفيذ)</option>
                  <option value="COMPLETED" className="bg-slate-950 text-white">مكتمل</option>
                  <option value="SUSPENDED" className="bg-slate-950 text-white">موقوف مؤقتاً</option>
                  <option value="CANCELLED" className="bg-slate-950 text-white">ملغى</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* ── DYNAMIC KPI CARDS (react to filters) ─────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Projects Count */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3 transition-all duration-300">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 flex-shrink-0">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 mb-0.5">المشاريع المعروضة</p>
                <p className="text-xl font-extrabold text-white tabular-nums">{dynamicKPIs.count.toLocaleString("ar-SA-u-nu-latn")}</p>
                <p className="text-[9px] text-blue-400/70 font-medium">من إجمالي {initialProjects.length}</p>
              </div>
            </div>
            {/* Target */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3 transition-all duration-300">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 flex-shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 mb-0.5">المستهدفون</p>
                <p className="text-xl font-extrabold text-white tabular-nums">{dynamicKPIs.target.toLocaleString("ar-SA-u-nu-latn")}</p>
                <p className="text-[9px] text-amber-400/70 font-medium">حسب الفلتر الحالي</p>
              </div>
            </div>
            {/* Delivered */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3 transition-all duration-300">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 flex-shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 mb-0.5">تم التسليم</p>
                <p className="text-xl font-extrabold text-white tabular-nums">{dynamicKPIs.delivered.toLocaleString("ar-SA-u-nu-latn")}</p>
                <p className="text-[9px] text-emerald-400/70 font-medium">نسبة: {dynamicKPIs.progress}%</p>
              </div>
            </div>
            {/* Budget */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3 transition-all duration-300">
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 flex-shrink-0">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 mb-0.5">إجمالي الميزانية</p>
                <p className="text-lg font-extrabold text-white tabular-nums">{dynamicKPIs.budget > 0 ? dynamicKPIs.budget.toLocaleString("en-US") : "-"}</p>
                <p className="text-[9px] text-indigo-400/70 font-medium">{dynamicKPIs.currencies.join(" · ") || "متعدد"}</p>
              </div>
            </div>
          </div>

          {/* Table Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20 p-4 border border-slate-800/80 rounded-xl">
            <div className="text-sm text-slate-400 font-bold">
              تم العثور على <span className="font-extrabold text-white text-base">{filteredProjects.length}</span> مشروع
            </div>
            <Button
              onClick={() => exportProjectsToExcel(filteredProjects)}
              disabled={filteredProjects.length === 0}
              className="rounded-xl px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all duration-300 h-9 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>تصدير Excel (المصفى)</span>
            </Button>
          </div>

          {/* Table */}
          <Card className="border border-slate-800 bg-slate-950/30 backdrop-blur-md shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full text-right">
                  <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                    <TableRow className="hover:bg-slate-900 border-b border-slate-800">
                      <TableHead className="text-right text-slate-200 font-bold py-4 pr-6">المشروع والجهة الكافلة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">الفئة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">الحالة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">الميزانية</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">المستهدف</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">مؤشر الإنجاز</TableHead>
                      <TableHead className="text-center text-slate-200 font-bold py-4 pl-6">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => {
                        const totalTarget   = project.targetCount || 0
                        const actualDelivered = project.beneficiaryLinks?.filter((link: any) => link.isDelivered).length || 0
                        const deliveredCount  = actualDelivered > 0 ? actualDelivered : totalTarget
                        const progress = project.status === "COMPLETED"
                          ? 100
                          : (totalTarget > 0 ? Math.min(Math.round((deliveredCount / totalTarget) * 100), 100) : 100)

                        return (
                          <TableRow key={project.id} className="hover:bg-slate-900/40 border-b border-slate-900/50 transition-all duration-200">
                            {/* Name + Sponsor Badge */}
                            <TableCell className="py-4 pr-6">
                              <div className="space-y-1.5">
                                <p className="font-bold text-white text-sm leading-snug">{project.name}</p>
                                {getSponsorBadge(project.name)}
                              </div>
                            </TableCell>
                            {/* Category */}
                            <TableCell className="py-4 text-xs font-semibold text-slate-400">
                              {translateCategory(project.category)}
                            </TableCell>
                            {/* Status */}
                            <TableCell className="py-4">
                              {getStatusBadge(project.status)}
                            </TableCell>
                            {/* Budget */}
                            <TableCell className="py-4 font-mono font-bold text-emerald-400 text-sm tabular-nums">
                              {project.budget !== null ? (
                                `${Number(project.budget).toLocaleString("en-US")} ${project.currency}`
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            {/* Target count */}
                            <TableCell className="py-4 font-bold text-slate-300 tabular-nums text-sm">
                              {project.targetCount !== null ? `${project.targetCount} مستفيد` : "-"}
                            </TableCell>
                            {/* Progress bar */}
                            <TableCell className="py-4">
                              {totalTarget > 0 ? (
                                <div className="w-28 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                    <span className={progress === 100 ? "text-emerald-400" : ""}>{progress}%</span>
                                    <span>{deliveredCount} مستلم</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${progress === 100 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-blue-600 to-blue-400"}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs italic">لا يوجد مستهدف</span>
                              )}
                            </TableCell>
                            {/* Actions */}
                            <TableCell className="py-4 pl-6">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* Details */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDetails(project)}
                                  className="h-8 rounded-lg px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 border-blue-500/30 hover:border-blue-500/50 flex items-center gap-1 font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>

                                {/* Print Voucher */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => printDeliveryVoucher(project)}
                                  title="طباعة سند الاستلام"
                                  className="h-8 rounded-lg px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 border-purple-500/30 hover:border-purple-500/50 flex items-center gap-1 font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>

                                {/* Bank Export */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportBankTransferFile(project)}
                                  title="تصدير كشف تحويلات بنكية"
                                  className="h-8 rounded-lg px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/50 flex items-center gap-1 font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                                >
                                  <Banknote className="h-3.5 w-3.5" />
                                </Button>

                                {/* Edit */}
                                <ProjectFormSheet
                                  project={project}
                                  trigger={
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 rounded-lg px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/50 flex items-center gap-1 font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  }
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-sm text-slate-500 font-medium">
                          لا توجد نتائج تطابق خيارات بحث المشاريع.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================================================
            TAB 2: DISTRIBUTIONS LOG
            =================================================================== */}
        <TabsContent value="distributions" className="space-y-4 outline-none">
          {/* Filters */}
          <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-md shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Search */}
                <div className="relative md:col-span-2">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="البحث باسم المشروع، المستفيد، أو المادة المسلمة..."
                    value={distributionSearch}
                    onChange={(e) => setDistributionSearch(e.target.value)}
                    className="pr-9 bg-slate-900/50 border-slate-800/80 focus-visible:bg-slate-900 focus-visible:ring-emerald-500 text-right placeholder-slate-500 text-sm text-white focus:border-emerald-500"
                  />
                </div>

                {/* Delivery status */}
                <select
                  value={selectedDeliveryStatus}
                  onChange={(e) => setSelectedDeliveryStatus(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-right text-slate-200 font-medium cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-950 text-white">كل حالات الاستلام</option>
                  <option value="DELIVERED" className="bg-slate-950 text-white">تم تسليم المساعدات</option>
                  <option value="PENDING" className="bg-slate-950 text-white">قيد الانتظار</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Table Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20 p-4 border border-slate-800/80 rounded-xl">
            <div className="text-sm text-slate-400 font-bold">
              تم العثور على <span className="font-extrabold text-white text-base">{filteredDistributions.length}</span> سجل
            </div>
            <Button
              onClick={() => exportDistributionsToExcel(filteredDistributions)}
              disabled={filteredDistributions.length === 0}
              className="rounded-xl px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all duration-300 h-9 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>تصدير Excel (المصفى)</span>
            </Button>
          </div>

          {/* Table */}
          <Card className="border border-slate-800 bg-slate-950/30 backdrop-blur-md shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full text-right">
                  <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                    <TableRow className="hover:bg-slate-900 border-b border-slate-800">
                      <TableHead className="text-right text-slate-200 font-bold py-4 pr-6">المشروع</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">المستفيد المستلم</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">رقم الدفعة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">المادة الموزعة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">الكمية والقيمة</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">تاريخ الاستلام</TableHead>
                      <TableHead className="text-center text-slate-200 font-bold py-4">تأكيد الاستلام</TableHead>
                      <TableHead className="text-center text-slate-200 font-bold py-4 pl-6">إجراءات الحذف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredDistributions.length > 0 ? (
                      filteredDistributions.map((dist) => (
                        <TableRow key={dist.id} className="hover:bg-slate-900/40 border-b border-slate-900/50 transition-all duration-200">
                          {/* Project Name */}
                          <TableCell className="py-4 pr-6">
                            <div className="space-y-1">
                              <p className="font-bold text-white text-sm">{dist.project?.name}</p>
                              {dist.project && getSponsorBadge(dist.project.name)}
                            </div>
                          </TableCell>
                          {/* Beneficiary Name */}
                          <TableCell className="py-4 font-bold text-white text-sm">
                            {dist.beneficiary?.fullName}
                          </TableCell>
                          {/* Batch */}
                          <TableCell className="py-4 font-semibold text-xs text-slate-400 tabular-nums">
                            دفعة {dist.batchNumber}
                          </TableCell>
                          {/* Delivered Item */}
                          <TableCell className="py-4 text-xs font-semibold text-slate-350">
                            {dist.deliveredItem}
                          </TableCell>
                          {/* Quantity & value */}
                          <TableCell className="py-4 text-xs font-bold text-slate-300 space-y-0.5 tabular-nums">
                            <div>الكمية: {dist.quantity}</div>
                            {dist.unitValue !== null && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                القيمة: {dist.unitValue} {dist.currency}
                              </div>
                            )}
                          </TableCell>
                          {/* Delivery Date */}
                          <TableCell className="py-4 font-mono text-xs text-slate-400">
                            {dist.isDelivered ? (
                              dist.deliveryDate ? (
                                new Date(dist.deliveryDate).toLocaleDateString("ar-YE-u-nu-latn")
                              ) : (
                                "تم التسليم"
                              )
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          {/* Confirm delivery toggle */}
                          <TableCell className="py-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={togglingId === dist.id}
                              onClick={() => handleToggleDelivery(dist.id, dist.isDelivered)}
                              className={`h-8 rounded-lg px-2 text-xs font-semibold flex items-center justify-center mx-auto gap-1 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] ${
                                dist.isDelivered
                                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30"
                                  : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 border-amber-500/30"
                              }`}
                            >
                              {togglingId === dist.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : dist.isDelivered ? (
                                <span>تم الاستلام</span>
                              ) : (
                                <span>تأكيد التسليم</span>
                              )}
                            </Button>
                          </TableCell>
                          {/* Delete Action */}
                          <TableCell className="py-4 pl-6 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deletingId === dist.id}
                              onClick={() => handleDeleteDistribution(dist.id)}
                              className="h-8 w-8 p-0 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 border-rose-500/30 hover:border-rose-500/50 flex items-center justify-center mx-auto transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                            >
                              {deletingId === dist.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-sm text-slate-500 font-medium">
                          لا توجد نتائج تطابق خيارات الاستلام الميداني.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Detailed Project View Sheet ─────────────────────────── */}
      {selectedProject && (
        <ProjectDetailsSheet
          project={selectedProject}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
    </div>
  )
}
