"use client"

import { useState } from "react"
import {
  Search,
  Eye,
  Edit,
  Loader2,
  Stethoscope,
  AlertTriangle,
  Activity,
  DollarSign,
  ChevronDown,
  ChevronUp,
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
import { PatientFormSheet } from "@/components/patients/patient-form-sheet"
import { PatientDetailsSheet } from "@/components/patients/patient-details-sheet"
import { togglePatientActive } from "@/app/actions/patient-actions"

interface PatientsClientProps {
  initialPatients: any[]
  geography: any[]
  currentUserRole?: string
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return <Badge className="bg-red-900/40 text-red-300 border border-red-700/40 text-[10px]">🔴 حرج</Badge>
    case "SERIOUS":
      return <Badge className="bg-orange-900/40 text-orange-300 border border-orange-700/40 text-[10px]">🟠 خطير</Badge>
    case "MODERATE":
      return <Badge className="bg-yellow-900/40 text-yellow-300 border border-yellow-700/40 text-[10px]">🟡 متوسط</Badge>
    case "STABLE":
      return <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 text-[10px]">🟢 مستقر</Badge>
    default:
      return <Badge className="text-[10px]">{severity}</Badge>
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-blue-900/40 text-blue-300 border border-blue-700/40 text-[10px]">🩺 قيد العلاج</Badge>
    case "RECOVERED":
      return <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 text-[10px]">✅ تعافى</Badge>
    case "DECEASED":
      return <Badge className="bg-slate-700/40 text-slate-400 border border-slate-600/40 text-[10px]">⬛ متوفى</Badge>
    case "SUSPENDED":
      return <Badge className="bg-slate-700/40 text-slate-400 border border-slate-600/40 text-[10px]">⏸ معلق</Badge>
    default:
      return <Badge className="text-[10px]">{status}</Badge>
  }
}

export function PatientsClient({ initialPatients, geography, currentUserRole }: PatientsClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterGov, setFilterGov] = useState("ALL")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editPatient, setEditPatient] = useState<any | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Filter logic
  const filteredPatients = initialPatients.filter(p => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nationalId && p.nationalId.includes(searchTerm)) ||
      (p.phoneNumber && p.phoneNumber.includes(searchTerm)) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSeverity = filterSeverity === "ALL" || p.severity === filterSeverity
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus
    const matchesGov = filterGov === "ALL" || p.subDistrict?.district?.governorate?.id?.toString() === filterGov

    return matchesSearch && matchesSeverity && matchesStatus && matchesGov
  })

  async function handleToggleActive(patient: any) {
    setTogglingId(patient.id)
    const result = await togglePatientActive(patient.id, patient.isActive)
    if (result.success) {
      alert(patient.isActive ? "تم إيقاف الملف" : "تم تفعيل الملف")
    } else {
      alert("فشل في تغيير الحالة")
    }
    setTogglingId(null)
  }

  // Stats
  const totalCount = filteredPatients.length
  const criticalCount = filteredPatients.filter(p => p.severity === "CRITICAL" || p.severity === "SERIOUS").length
  const activeCount = filteredPatients.filter(p => p.status === "ACTIVE").length
  const totalCost = filteredPatients.reduce((acc, p) => acc + (p.monthlyCost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-950/60 to-rose-900/30 border border-rose-800/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-300">إجمالي المرضى</p>
                <p className="mt-1 text-2xl font-black text-rose-100 tabular-nums">{totalCount}</p>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5">
                <Stethoscope className="h-5 w-5 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-950/60 to-red-900/30 border border-red-800/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-300">حالات حرجة وخطيرة</p>
                <p className="mt-1 text-2xl font-black text-red-100 tabular-nums">{criticalCount}</p>
              </div>
              <div className="rounded-xl bg-red-500/10 p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-950/60 to-blue-900/30 border border-blue-800/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-300">قيد العلاج حالياً</p>
                <p className="mt-1 text-2xl font-black text-blue-100 tabular-nums">{activeCount}</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2.5">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-950/60 to-emerald-900/30 border border-emerald-800/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-300">التكلفة الشهرية الإجمالية</p>
                <p className="mt-1 text-xl font-black text-emerald-100 tabular-nums">${totalCost.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-border/60 bg-slate-900/30 shadow-none">
        <CardContent className="p-4 space-y-4">
          {/* Search + Basic Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم، الرقم الوطني، رقم الهاتف، أو التشخيص..."
                className="pr-9 bg-slate-900/60 border-border text-slate-100 placeholder:text-slate-600 text-right"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="bg-slate-900/60 border border-border text-slate-300 text-right rounded-md px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="CRITICAL">🔴 حرج</option>
              <option value="SERIOUS">🟠 خطير</option>
              <option value="MODERATE">🟡 متوسط</option>
              <option value="STABLE">🟢 مستقر</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-900/60 border border-border text-slate-300 text-right rounded-md px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="ALL">جميع الملفات</option>
              <option value="ACTIVE">🩺 قيد العلاج</option>
              <option value="RECOVERED">✅ تعافى</option>
              <option value="DECEASED">⬛ متوفى</option>
              <option value="SUSPENDED">⏸ معلق</option>
            </select>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showAdvanced ? "إخفاء الفلاتر المتقدمة" : "عرض الفلاتر المتقدمة"}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1.5">المحافظة</p>
                <select
                  value={filterGov}
                  onChange={e => setFilterGov(e.target.value)}
                  className="w-full bg-slate-900/60 border border-border text-slate-300 text-right rounded-md px-3 py-2 text-xs"
                >
                  <option value="ALL">جميع المحافظات</option>
                  {geography.map((g: any) => (
                    <option key={g.id} value={g.id.toString()}>{g.nameAr}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>عدد النتائج: <span className="font-bold text-slate-200">{filteredPatients.length}</span> مريض</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-border/60 bg-slate-900/20 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 bg-slate-900/50 hover:bg-slate-900/50">
                <TableHead className="text-right text-xs font-bold text-slate-300 py-3 px-4">المريض</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-300 py-3 px-4">التشخيص</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-300 py-3 px-4">المنطقة</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-300 py-3 px-4">درجة الخطورة</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-300 py-3 px-4">حالة الملف</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-300 py-3 px-4">التكلفة / شهر</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-300 py-3 px-4">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-14 text-slate-500 text-sm">
                    <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">لا توجد سجلات مرضى مطابقة</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map(patient => (
                  <TableRow key={patient.id} className="border-border/30 hover:bg-slate-900/30 transition-colors">
                    <TableCell className="py-3 px-4">
                      <div className="font-semibold text-slate-100 text-sm">{patient.fullName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{patient.phoneNumber || "—"}</div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="text-sm text-slate-200 font-medium">{patient.diagnosis}</div>
                      {patient.diseaseType && (
                        <div className="text-[10px] text-slate-500 mt-0.5">{patient.diseaseType}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-slate-400">
                      {patient.subDistrict?.district?.governorate?.nameAr || "—"}
                      {patient.subDistrict?.district?.nameAr && (
                        <span className="block text-[10px] text-slate-600">
                          {patient.subDistrict.district.nameAr}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {getSeverityBadge(patient.severity)}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {getStatusBadge(patient.status)}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {patient.monthlyCost ? (
                        <span className="text-sm font-bold text-emerald-400">${patient.monthlyCost.toLocaleString()}</span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedPatient(patient); setIsDetailsOpen(true) }}
                          className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditPatient(patient); setIsEditOpen(true) }}
                          className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(patient)}
                          disabled={togglingId === patient.id}
                          className={`h-8 px-2 rounded-lg text-[10px] font-bold transition-all ${patient.isActive ? "text-rose-400 hover:bg-rose-900/20" : "text-emerald-400 hover:bg-emerald-900/20"}`}
                        >
                          {togglingId === patient.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : patient.isActive ? "إيقاف" : "تفعيل"}
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

      {/* Details Sheet */}
      {selectedPatient && (
        <PatientDetailsSheet
          patient={selectedPatient}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}

      {/* Edit Sheet */}
      {editPatient && (
        <PatientFormSheet
          geography={geography}
          patient={editPatient}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </div>
  )
}
