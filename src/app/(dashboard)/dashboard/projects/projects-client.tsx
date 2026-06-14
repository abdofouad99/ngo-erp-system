"use client"

import { useState } from "react"
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

  // Filter Projects
  const filteredProjects = initialProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(projectSearch.toLowerCase()))

    const matchesCategory =
      selectedCategory === "ALL" || project.category === selectedCategory

    const matchesStatus =
      selectedStatus === "ALL" || project.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Filter Distributions
  const filteredDistributions = initialDistributions.filter((dist) => {
    const matchesSearch =
      dist.project?.name.toLowerCase().includes(distributionSearch.toLowerCase()) ||
      dist.beneficiary?.fullName.toLowerCase().includes(distributionSearch.toLowerCase()) ||
      dist.deliveredItem.toLowerCase().includes(distributionSearch.toLowerCase())

    const matchesDelivery =
      selectedDeliveryStatus === "ALL" ||
      (selectedDeliveryStatus === "DELIVERED" && dist.isDelivered) ||
      (selectedDeliveryStatus === "PENDING" && !dist.isDelivered)

    return matchesSearch && matchesDelivery
  })

  // Handlers
  const handleOpenDetails = (project: any) => {
    setSelectedProject(project)
    setIsDetailsOpen(true)
  }

  const handleToggleDelivery = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    const result = await updateDistributionStatus(id, !currentStatus)
    if (!result.success) {
      alert(result.error || "فشل تحديث حالة تسليم المساعدة الميدانية.")
    }
    setTogglingId(null)
  }

  const handleDeleteDistribution = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف سجل التوزيع هذا نهائياً من قاعدة البيانات؟")) return
    setDeletingId(id)
    const result = await deleteDistribution(id)
    if (!result.success) {
      alert(result.error || "فشل حذف سجل التوزيع.")
    }
    setDeletingId(null)
  }

  // Translators & Styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge className="bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-800 font-bold px-2 py-0.5">مسودة</Badge>
      case "ACTIVE":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold px-2 py-0.5">نشط</Badge>
      case "COMPLETED":
        return <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 font-bold px-2 py-0.5">مكتمل</Badge>
      case "SUSPENDED":
        return <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold px-2 py-0.5">موقوف مؤقتاً</Badge>
      case "CANCELLED":
        return <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold px-2 py-0.5">ملغى</Badge>
      default:
        return <Badge className="bg-slate-800 text-slate-300 border border-slate-700">{status}</Badge>
    }
  }

  const translateCategory = (category: string) => {
    switch (category) {
      case "IN_KIND":
        return "عيني (مواد)"
      case "CASH":
        return "نقدي (حوالات)"
      case "MEDICAL":
        return "طبي (علاج)"
      case "TRAINING":
        return "تمكين وتأهيل"
      default:
        return category
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="projects" className="w-full" onValueChange={setActiveTab}>
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

        {/* =====================================================================
            TAB 1: PROJECTS LIST
            ===================================================================== */}
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
                      <TableHead className="text-right text-slate-200 font-bold py-4 pr-6">المشروع</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold py-4">الفئة والتصنيف</TableHead>
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
                        const totalTarget = project.targetCount || 0
                        const deliveredCount = project.beneficiaryLinks?.filter((link: any) => link.isDelivered).length || 0
                        const progress = totalTarget > 0 ? Math.min(Math.round((deliveredCount / totalTarget) * 100), 100) : 0

                        return (
                          <TableRow key={project.id} className="hover:bg-slate-900/40 border-b border-slate-900/50 transition-all duration-200">
                            {/* Name */}
                            <td className="py-4 pr-6 font-bold text-white text-sm">
                              {project.name}
                            </td>
                            {/* Category */}
                            <td className="py-4 text-xs font-semibold text-slate-400">
                              {translateCategory(project.category)}
                            </td>
                            {/* Status */}
                            <td className="py-4">
                              {getStatusBadge(project.status)}
                            </td>
                            {/* Budget */}
                            <td className="py-4 font-mono font-bold text-emerald-400 text-sm tabular-nums">
                              {project.budget !== null ? (
                                `${project.budget.toLocaleString()} ${project.currency}`
                              ) : (
                                "-"
                              )}
                            </td>
                            {/* Target count */}
                            <td className="py-4 font-bold text-slate-300 tabular-nums text-sm">
                              {project.targetCount !== null ? `${project.targetCount} مستفيد` : "-"}
                            </td>
                            {/* Progress bar */}
                            <td className="py-4">
                              {totalTarget > 0 ? (
                                <div className="w-28 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                    <span>{progress}%</span>
                                    <span>{deliveredCount} مستلم</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-450 rounded-full transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs italic">لا يوجد مستهدف</span>
                              )}
                            </td>
                            {/* Actions */}
                            <td className="py-4 pl-6">
                              <div className="flex items-center justify-center gap-2">
                                {/* Open Details */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDetails(project)}
                                  className="h-8 rounded-lg px-2.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 border-blue-500/30 hover:border-blue-500/50 flex items-center gap-1 font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>تفاصيل الاستلام</span>
                                </Button>

                                {/* Edit Project */}
                                <ProjectFormSheet
                                  project={project}
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
                        )
                      })
                    ) : (
                      <TableRow>
                        <td colSpan={7} className="text-center py-12 text-sm text-slate-500 font-medium">
                          لا توجد نتائج تطابق خيارات بحث المشاريع.
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
            TAB 2: DISTRIBUTIONS LOG
            ===================================================================== */}
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
                          <td className="py-4 pr-6 font-bold text-white text-sm">
                            {dist.project?.name}
                          </td>
                          {/* Beneficiary Name */}
                          <td className="py-4 font-bold text-white text-sm">
                            {dist.beneficiary?.fullName}
                          </td>
                          {/* Batch */}
                          <td className="py-4 font-semibold text-xs text-slate-400 tabular-nums">
                            دفعة {dist.batchNumber}
                          </td>
                          {/* Delivered Item */}
                          <td className="py-4 text-xs font-semibold text-slate-350">
                            {dist.deliveredItem}
                          </td>
                          {/* Quantity & value */}
                          <td className="py-4 text-xs font-bold text-slate-300 space-y-0.5 tabular-nums">
                            <div>الكمية: {dist.quantity}</div>
                            {dist.unitValue !== null && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                القيمة: {dist.unitValue} {dist.currency}
                              </div>
                            )}
                          </td>
                          {/* Delivery Date */}
                          <td className="py-4 font-mono text-xs text-slate-400">
                            {dist.isDelivered ? (
                              dist.deliveryDate ? (
                                new Date(dist.deliveryDate).toLocaleDateString("ar-YE")
                              ) : (
                                "تم التسليم"
                              )
                            ) : (
                              "-"
                            )}
                          </td>
                          {/* Confirm delivery toggle */}
                          <td className="py-4 text-center">
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
                          </td>
                          {/* Delete Action */}
                          <td className="py-4 pl-6 text-center">
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
                          </td>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <td colSpan={8} className="text-center py-12 text-sm text-slate-500 font-medium">
                          لا توجد نتائج تطابق خيارات الاستلام الميداني.
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
