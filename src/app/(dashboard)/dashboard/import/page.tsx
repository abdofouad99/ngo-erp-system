"use client"

import { useState } from "react"
import { importFamiliesBulk, importOrphansBulk } from "@/app/actions/import-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  RefreshCw,
  Users,
  Baby,
  Play,
  XCircle,
  Info
} from "lucide-react"

// Headers Mapping Maps
const FAMILY_HEADER_MAP: Record<string, string> = {
  "الاسم الكامل لرب الأسرة": "headFullName",
  "الرقم الوطني لرب الأسرة": "headNationalId",
  "الجنس (ذكر/أنثى)": "headGender",
  "الهاتف الأساسي": "headPhoneNumber",
  "الهاتف البديل": "headAltPhone",
  "تاريخ الميلاد (YYYY-MM-DD)": "headBirthdate",
  "العنوان بالتفصيل": "addressDetail",
  "اسم الحي/العزلة": "subDistrictName",
  "درجة الهشاشة (0-100)": "vulnerabilityScore",
  "مستوى الفقر (شديد/متوسط/منخفض)": "povertyLevel",
  "عدد أفراد الأسرة": "familyMembersCount",
  "الدخل الشهري": "monthlyIncome",
  "نوع السكن": "housingType",
  "حالة السكن": "housingCondition",
  "اسم الوصي": "guardianName",
  "رقم الوصي": "guardianPhone",
  "ملاحظات": "notes",
}

const ORPHAN_HEADER_MAP: Record<string, string> = {
  "الاسم الكامل لليتيم": "fullName",
  "تاريخ الميلاد (YYYY-MM-DD)": "birthdate",
  "الجنس (ذكر/أنثى)": "gender",
  "الرقم الوطني لليتيم": "nationalId",
  "الرقم الوطني لرب الأسرة": "familyNationalId",
  "كود ملف اليتيم": "orphanCode",
  "حساب الكريمي": "kuraimiAccount",
  "المرحلة الدراسية": "educationalStage",
  "المدرسة": "schoolName",
  "المعدل الدراسي": "averageGrade",
  "الاحتياجات التعليمية": "educationalNeeds",
  "الوضع الصحي": "healthStatus",
  "هل لديه إعاقة (نعم/لا)": "disability",
  "تفاصيل الإعاقة": "disabilityDetails",
  "نوع اليتم (أب/أم/كلاهما)": "orphanType",
  "تاريخ وفاة الأب": "fatherDeathDate",
  "سبب وفاة الأب": "fatherDeathCause",
  "اسم الأم": "motherName",
  "ملاحظات": "notes",
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState("families")
  const [parsedData, setParsedData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  // CSV Template Generators
  const downloadFamilyTemplate = () => {
    const cols = Object.keys(FAMILY_HEADER_MAP)
    const csvContent = "\uFEFF" + cols.join(",") + "\n" +
      "أحمد محمد علي,100100200,ذكر,777123456,,1980-05-15,شارع حدة - خلف بريد حدة,الأصبحي,45,شديد,5,250000,شقة إيجار,مقبول,علي محمد علي,777999888,أسرة متضررة بحاجة لكفالة معيشية\n" +
      "فاطمة صالح حسن,200300400,أنثى,733444555,,1985-09-20,حي المعلا - جوار مسجد الغفار,المعلا,60,SEVERE,4,150000,منزل شعبي,متدهور,,,أرملة تعول أيتام"
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", "ngo_families_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadOrphanTemplate = () => {
    const cols = Object.keys(ORPHAN_HEADER_MAP)
    const csvContent = "\uFEFF" + cols.join(",") + "\n" +
      "صالح أحمد محمد علي,2012-08-10,ذكر,,100100200,ORP-2026-0050,,الخامس ابتدائي,مدرسة الوحدة,85,,سليم,لا,,أب,2022-04-12,مرض طبيعي,أمينة صالح علي,يتيم متفوق دراسياً\n" +
      "علي أحمد محمد علي,2015-11-04,ذكر,,100100200,ORP-2026-0051,,الثاني ابتدائي,مدرسة الوحدة,90,,يعاني من حساسية صدرية,لا,,أب,2022-04-12,مرض طبيعي,أمينة صالح علي,"
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", "ngo_orphans_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Pure JS CSV Parser that handles double quotes safely
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/)
    if (lines.length === 0 || !lines[0]) return { headers: [], data: [] }
    
    // Parse Headers
    const rawHeaders = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
    const parsedRows: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cells: string[] = []
      let currentCell = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          cells.push(currentCell.trim().replace(/^"|"$/g, ""))
          currentCell = ""
        } else {
          currentCell += char
        }
      }
      cells.push(currentCell.trim().replace(/^"|"$/g, ""))

      const rowObj: any = {}
      rawHeaders.forEach((h, idx) => {
        rowObj[h] = cells[idx] || ""
      })
      parsedRows.push(rowObj)
    }

    return { headers: rawHeaders, data: parsedRows }
  }

  // Handle File Upload & Mapping
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { headers: rawHeaders, data: rawData } = parseCSV(text)
      
      setHeaders(rawHeaders)

      // Map raw data using header translation
      const mapSchema = activeTab === "families" ? FAMILY_HEADER_MAP : ORPHAN_HEADER_MAP
      const mapped = rawData.map((row) => {
        const mappedRow: any = {}
        Object.entries(row).forEach(([rawHeader, val]) => {
          const engKey = mapSchema[rawHeader]
          if (engKey) {
            mappedRow[engKey] = val
          } else {
            // Keep original if not matched for troubleshooting
            mappedRow[rawHeader] = val
          }
        })
        return mappedRow
      })

      setParsedData(mapped)
    }
    reader.readAsText(file, "UTF-8")
  }

  const handleClear = () => {
    setParsedData([])
    setHeaders([])
    setFileName("")
    setImportResult(null)
  }

  const triggerImport = async () => {
    if (parsedData.length === 0) return
    setLoading(true)
    
    let result: any = null
    if (activeTab === "families") {
      result = await importFamiliesBulk(parsedData)
    } else {
      result = await importOrphansBulk(parsedData)
    }

    if (result && result.success) {
      setImportResult(result)
      setParsedData([]) // Clear on success
    } else {
      alert(result?.error || "فشل استيراد البيانات.")
    }
    setLoading(false)
  }

  // Quick Row Validation for Preview Grid
  const getRowValidation = (row: any) => {
    if (activeTab === "families") {
      if (!row.headFullName || !row.headNationalId) {
        return { valid: false, label: "نقص حقول مطلوبة", style: "bg-red-950/40 text-red-400 border-red-900/50" }
      }
      return { valid: true, label: "جاهز للاستيراد", style: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" }
    } else {
      if (!row.fullName || !row.birthdate || !row.familyNationalId) {
        return { valid: false, label: "نقص حقول مطلوبة", style: "bg-red-950/40 text-red-400 border-red-900/50" }
      }
      return { valid: true, label: "جاهز للاستيراد", style: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" }
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto text-right" dir="rtl">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
          استيراد البيانات مجمعاً (Excel / CSV Batch Ingestion)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          وفر وقت الإدخال اليدوي، ارفع السجلات بالكامل للأسر والأيتام، وعاينها وصححها مباشرة من لوحة التحكم.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val)
          handleClear()
        }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 backdrop-blur-md">
          <TabsList className="bg-slate-950 p-1 rounded-lg border border-slate-800/50">
            <TabsTrigger value="families" className="rounded-md text-xs font-bold gap-1 px-4 py-1.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              استيراد ملف الأسر المستفيدة
            </TabsTrigger>
            <TabsTrigger value="orphans" className="rounded-md text-xs font-bold gap-1 px-4 py-1.5 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Baby className="h-4 w-4" />
              استيراد ملف الأيتام وشؤونهم
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={activeTab === "families" ? downloadFamilyTemplate : downloadOrphanTemplate}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold h-9 rounded-lg gap-1.5 border border-slate-700 hover:border-slate-600 transition-all hover:scale-[1.03] active:scale-[0.97]"
          >
            <Download className="h-3.5 w-3.5" />
            تحميل نموذج ملف الاستيراد الجاهز
          </Button>
        </div>

        {/* ── IMPORT RESULTS LOGGER SUMMARY ── */}
        {importResult && (
          <Card className="border-emerald-900/50 bg-emerald-950/20 rounded-2xl shadow-sm overflow-hidden backdrop-blur-md">
            <CardHeader className="bg-emerald-950/30 py-4 border-b border-emerald-900/40">
              <CardTitle className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500 animate-bounce" />
                اكتملت عملية الاستيراد المجمع بنجاح!
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-900/40 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 block">السجلات المستوردة بنجاح</span>
                  <span className="text-lg font-extrabold text-emerald-500 font-mono mt-1 block">
                    {importResult.importedCount}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-900/40 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 block">سجلات مكررة (تخطاها النظام)</span>
                  <span className="text-lg font-extrabold text-slate-400 font-mono mt-1 block">
                    {importResult.skippedCount}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-900/40 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 block">سجلات تحتوي أخطاء</span>
                  <span className="text-lg font-extrabold text-red-500 font-mono mt-1 block">
                    {importResult.errors?.length || 0}
                  </span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> سجل الأخطاء الفني أثناء المعالجة:
                  </span>
                  <div className="max-h-[150px] overflow-y-auto bg-red-950/20 border border-red-900/40 rounded-xl p-3 text-[11px] text-red-400 font-medium space-y-1">
                    {importResult.errors.map((err: string, i: number) => (
                      <div key={i} className="flex gap-1.5 items-start">
                        <span className="font-bold text-red-500">-</span>
                        <p>{err}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <TabsContent value="families" className="space-y-6">
          <ImportSection
            fileName={fileName}
            parsedData={parsedData}
            headers={headers}
            loading={loading}
            onUpload={handleFileUpload}
            onClear={handleClear}
            onImport={triggerImport}
            getRowValidation={getRowValidation}
            activeTab="families"
          />
        </TabsContent>

        <TabsContent value="orphans" className="space-y-6">
          <ImportSection
            fileName={fileName}
            parsedData={parsedData}
            headers={headers}
            loading={loading}
            onUpload={handleFileUpload}
            onClear={handleClear}
            onImport={triggerImport}
            getRowValidation={getRowValidation}
            activeTab="orphans"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ImportSectionProps {
  fileName: string
  parsedData: any[]
  headers: string[]
  loading: boolean
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  onImport: () => void
  getRowValidation: (row: any) => any
  activeTab: string
}

function ImportSection({
  fileName,
  parsedData,
  headers,
  loading,
  onUpload,
  onClear,
  onImport,
  getRowValidation,
  activeTab
}: ImportSectionProps) {
  const showPreview = parsedData.length > 0

  return (
    <div className="space-y-6">
      {/* ── Dropzone & Upload Panel ── */}
      {!showPreview ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/60 rounded-3xl p-12 bg-slate-900/20 hover:bg-slate-900/40 transition-colors text-center relative overflow-hidden">
          <input
            type="file"
            accept=".csv"
            onChange={onUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <Upload className="h-10 w-10 text-emerald-500 mb-4 animate-bounce" />
          <h3 className="text-sm font-extrabold text-white mb-1">
            اسحب وأسقط ملف الـ CSV المخصص للاستيراد هنا
          </h3>
          <p className="text-[11px] text-slate-400 max-w-sm mb-4 leading-relaxed">
            تأكد من اختيار وحفظ ملف إكسل بصيغة CSV (Comma Delimited) قبل الرفع لضمان سلاسة قراءة الملف بشكل سليم.
          </p>
          <div className="bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-700/50 text-[10px] text-slate-350 font-bold flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            يدعم الاستيراد فحص التكرار تلقائياً لمنع إدخال بيانات مكررة.
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-950/40 text-emerald-450 border border-emerald-900/50 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">الملف الجاهز للاستيراد: {fileName}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">تم العثور على ({parsedData.length}) سجل صالح للمعاينة والرفع.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onClear}
              variant="outline"
              className="border-slate-800 text-slate-300 hover:text-white h-9 px-4 rounded-lg text-xs font-bold hover:bg-slate-850/60 transition-all"
            >
              إلغاء الملف
            </Button>
            <Button
              onClick={onImport}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-5 rounded-lg text-xs font-bold gap-1.5 shadow-md shadow-emerald-900/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {loading ? "جاري معالجة الاستيراد..." : "بدء استيراد السجلات في النظام"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Live Preview Table Grid ── */}
      {showPreview && (
        <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-800/60">
            <CardTitle className="text-xs font-extrabold text-white">
              معاينة حية وتفقد السجلات المستخرجة (أول 10 سجلات للمعاينة)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 border-b border-slate-800">
                <tr className="hover:bg-slate-950 border-0">
                  <th className="p-3 text-slate-200 font-bold pr-4">رقم الصف</th>
                  <th className="p-3 text-slate-200 font-bold">التحقق</th>
                  {activeTab === "families" ? (
                    <>
                      <th className="p-3 text-slate-200 font-bold">الاسم الكامل لرب الأسرة</th>
                      <th className="p-3 text-slate-200 font-bold">الرقم الوطني</th>
                      <th className="p-3 text-slate-200 font-bold">الجنس</th>
                      <th className="p-3 text-slate-200 font-bold">الحي/العزلة</th>
                      <th className="p-3 text-slate-200 font-bold">مستوى الفقر</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 text-slate-200 font-bold">الاسم الكامل لليتيم</th>
                      <th className="p-3 text-slate-200 font-bold">تاريخ الميلاد</th>
                      <th className="p-3 text-slate-200 font-bold">هوية رب الأسرة</th>
                      <th className="p-3 text-slate-200 font-bold">نوع اليتيم</th>
                      <th className="p-3 text-slate-200 font-bold">كود اليتيم</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-transparent text-slate-350">
                {parsedData.slice(0, 10).map((row, idx) => {
                  const validation = getRowValidation(row)
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 pr-4 font-mono font-bold text-slate-450">{idx + 1}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${validation.style}`}>
                          {validation.label}
                        </span>
                      </td>
                      {activeTab === "families" ? (
                        <>
                          <td className="p-3 font-bold text-white">{row.headFullName || "-"}</td>
                          <td className="p-3 font-mono font-bold text-slate-300">{row.headNationalId || "-"}</td>
                          <td className="p-3 font-semibold text-slate-350">{row.headGender || "-"}</td>
                          <td className="p-3 text-slate-400 font-medium">{row.subDistrictName || "-"}</td>
                          <td className="p-3 font-bold text-slate-300">{row.povertyLevel || "-"}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-bold text-white">{row.fullName || "-"}</td>
                          <td className="p-3 font-mono font-semibold text-slate-350">{row.birthdate || "-"}</td>
                          <td className="p-3 font-mono font-bold text-slate-300">{row.familyNationalId || "-"}</td>
                          <td className="p-3 font-semibold text-slate-350">{row.orphanType || "-"}</td>
                          <td className="p-3 font-mono text-slate-450">{row.orphanCode || "-"}</td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
