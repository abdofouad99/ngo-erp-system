"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  X,
  RefreshCw 
} from "lucide-react"
import { bulkImportFamilies } from "@/app/actions/family-actions"

interface ExcelImportSheetProps {
  currentUserRole?: string
}

export function ExcelImportSheet({ currentUserRole }: ExcelImportSheetProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    importedCount?: number
    skippedCount?: number
    skippedNationalIds?: string[]
    error?: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Map header titles to schema keys
  const fieldMapping: Record<string, string> = {
    "الاسم الرباعي للزوج (رب الأسرة)": "headFullName",
    "الاسم الكامل": "headFullName",
    "الاسم": "headFullName",
    "اللقب": "headLastName",
    "رقم الهوية / الجواز": "headNationalId",
    "رقم الهوية": "headNationalId",
    "رقم البطاقة": "headNationalId",
    "الهوية الوطنية": "headNationalId",
    "نوع الهوية": "headIdType",
    "تاريخ إصدار الهوية": "headIdIssueDate",
    "مكان الإصدار": "headIdIssuePlace",
    "تاريخ الميلاد": "headBirthdate",
    "العمر الحالي": "headAge",
    "الجنس": "headGender",
    "الحالة الاجتماعية": "socialStatus",
    "رقم الجوال الأساسي": "headPhoneNumber",
    "رقم الجوال": "headPhoneNumber",
    "الجوال": "headPhoneNumber",
    "رقم الجوال البديل": "headAltPhone",
    "رقم الواتساب": "headWhatsApp",
    "الواتساب": "headWhatsApp",
    "المستوى التعليمي": "headEducationLevel",
    "المهنة الحالية": "headOccupation",
    "اسم الزوجة الرباعي": "spouseName",
    "رقم هوية الزوجة": "spouseIdNumber",
    "نوع هوية الزوجة": "spouseIdType",
    "تاريخ ميلاد الزوجة": "spouseBirthdate",
    "عمر الزوجة": "spouseAge",
    "المستوى التعليمي للزوجة": "spouseEducationLevel",
    "هل توجد زوجة أخرى؟": "hasAnotherSpouse",
    "إجمالي عدد أفراد الأسرة": "manualMembersCount",
    "عدد الذكور": "manualMalesCount",
    "عدد الإناث": "manualFemalesCount",
    "أطفال (أقل من 5": "kidsUnder5Count",
    "أطفال (5 - 17": "kids5To17Count",
    "بالغين (18 - 59": "adults18To59Count",
    "كبار السن": "elderlyAbove60Count",
    "عدد ذوي الاحتياجات": "specialNeedsCount",
    "نوع الإعاقة": "disabilityType",
    "المحافظة": "governorateName",
    "المديرية": "districtName",
    "العزلة": "subDistrictName",
    "الحي": "subDistrictName",
    "اسم القرية / الحارة": "addressDetail",
    "أقرب معلم بارز": "nearestLandmark",
    "نوع السكن": "housingType",
    "حالة السكن": "housingCondition",
    "قيمة الإيجار": "rentAmount",
    "مصدر مياه الشرب": "waterSource",
    "مصدر الكهرباء": "electricitySource",
    "ملاحظات عامة عن السكن": "housingNotes",
    "ملاحظات عامة عن وضع الأسرة": "notes",
    "متوسط الدخل الشهري": "monthlyIncome",
    "هل الأسرة تكفل أيتام؟": "hasOrphans",
    "عدد الأيتام": "orphansCount",
    "هل يوجد أرملة بالأسرة؟": "hasWidow",
    "هل يوجد عاطلين عن العمل": "hasUnemployed",
    "الاحتياجات العاجلة": "urgentNeeds",
    "هل الأسرة نازحة؟": "isDisplaced",
    "محافظة النزوح": "displacementGov",
    "مديرية النزوح": "displacementDist",
    "تاريخ النزوح": "displacementDate",
    "سبب النزوح": "displacementReason",
    "هل استلمت الأسرة مساعدات سابقة؟": "receivedAidBefore",
    "نوع المساعدة المستلمة": "aidType",
    "الجهة المانحة": "aidDonor",
    "تاريخ آخر مساعدة": "lastAidDate",
    "طريقة التسليم": "deliveryMethod",
    "رقم حساب الكريمي (يمني)": "kuraimiAccountYemeni",
    "رقم حساب الكريمي (سعودي)": "kuraimiAccountSaudi",
    "اسم معرف الأسرة": "referrerName",
    "صلة القرابة برب الأسرة / الصفة": "referrerRelation"
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]

      if (rawRows.length === 0) {
        alert("ملف Excel فارغ أو غير صالح.")
        return
      }

      // Find header row dynamically
      let headerRowIndex = -1
      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i]
        if (Array.isArray(row) && row.some(cell => {
          const val = String(cell);
          return val.includes("الاسم الرباعي") || val.includes("رب الأسرة") || val.includes("رقم الهوية");
        })) {
          headerRowIndex = i
          break
        }
      }

      if (headerRowIndex === -1) {
        alert("لم يتم العثور على عمود الاسم أو الهوية في الملف للتطابق.")
        return
      }

      const headers = rawRows[headerRowIndex].map((h: any) => String(h || "").trim())
      const dataRows = rawRows.slice(headerRowIndex + 1)

      const formatted: any[] = []

      dataRows.forEach((row) => {
        if (!row || row.length === 0 || !row[0]) return

        const item: any = {}
        headers.forEach((header: string, index: number) => {
          let fieldKey = ""
          for (const key in fieldMapping) {
            if (header.includes(key)) {
              fieldKey = fieldMapping[key]
              break
            }
          }
          if (fieldKey) {
            item[fieldKey] = row[index]
          }
        })

        if (item.headFullName && item.headNationalId) {
          formatted.push(item)
        }
      })

      setParsedData(formatted)
    }

    reader.readAsArrayBuffer(uploadedFile)
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return
    setLoading(true)
    setImportResult(null)

    const result = await bulkImportFamilies(parsedData)
    setImportResult(result as any)
    setLoading(false)

    if (result.success) {
      setFile(null)
      setParsedData([])
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          disabled={currentUserRole === "VIEWER"}
          className="rounded-xl px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all duration-300 h-9 active:scale-[0.98]"
        >
          <Upload className="h-4 w-4" />
          <span>استيراد من Excel</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full sm:max-w-2xl bg-slate-950 border-r border-border text-white overflow-y-auto">
        <SheetHeader className="text-right">
          <SheetTitle className="text-lg font-bold text-white flex items-center gap-2 justify-start">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            استيراد الأسر المستفيدة من ملف Excel
          </SheetTitle>
        </SheetHeader>

        <Separator className="my-4 border-border/40" />

        <div className="space-y-6 text-right">
          {/* تعليمات الملف */}
          <div className="rounded-xl border border-border/50 bg-slate-900/40 p-4 text-xs leading-relaxed space-y-2 text-slate-300">
            <p className="font-bold text-slate-200">📌 تعليمات استيراد ملف Excel:</p>
            <ul className="list-disc pr-4 space-y-1">
              <li>يجب أن يحتوي الملف على عمود لـ <strong className="text-emerald-400">الاسم الكامل لرب الأسرة</strong> وعمود لـ <strong className="text-emerald-400">رقم الهوية الوطنية</strong>.</li>
              <li>يقوم النظام تلقائياً بالتعرف على الأعمدة وتجاهل الأسطر التعريفية العلوية بالملف.</li>
              <li>سيتم تلقائياً تصفية وتخطي الأرقام الوطنية المكررة أو المسجلة مسبقاً في النظام لضمان نظافة السجلات.</li>
              <li>سيتم ربط التوزيع الجغرافي (المحافظة/المديرية/العزلة) في الملف تلقائياً بالمعرفات الرسمية في قاعدة البيانات.</li>
            </ul>
          </div>

          {/* منطقة الرفع */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">اختر ملف Excel (.xlsx, .xls)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl bg-slate-900/20 hover:bg-slate-900/40 p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3"
            >
              <Upload className="h-8 w-8 text-slate-400" />
              <div className="text-xs text-slate-300 font-bold">
                {file ? file.name : "اسحب ملف Excel أو انقر للتصفح والرفع"}
              </div>
              <div className="text-[10px] text-slate-500">
                حجم أقصى 5 ميغابايت
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* المعاينة وجاهزية الاستيراد */}
          {parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-450">مستعد للاستيراد</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                  {parsedData.length} أسرة جاهزة
                </span>
              </div>

              <div className="rounded-xl border border-border overflow-hidden max-h-60 overflow-y-auto bg-slate-900/30">
                <table className="w-full text-[11px] text-right">
                  <thead className="bg-slate-900/60 sticky top-0 border-b border-border">
                    <tr>
                      <th className="p-2 text-slate-300">الاسم الكامل لرب الأسرة</th>
                      <th className="p-2 text-slate-300">رقم الهوية</th>
                      <th className="p-2 text-slate-300">رقم الهاتف</th>
                      <th className="p-2 text-slate-300">العزلة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-slate-900/20">
                        <td className="p-2 text-slate-200 truncate max-w-[150px]">{row.headFullName}</td>
                        <td className="p-2 text-slate-300 font-mono">{row.headNationalId}</td>
                        <td className="p-2 text-slate-400 font-mono">{row.headPhoneNumber || "—"}</td>
                        <td className="p-2 text-slate-400">{row.subDistrictName || "غير محدد"}</td>
                      </tr>
                    ))}
                    {parsedData.length > 10 && (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-slate-500 italic">
                          و {parsedData.length - 10} أسرة أخرى...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 active:scale-[0.98] w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري استيراد البيانات لقاعدة البيانات...
                    </>
                  ) : (
                    "تأكيد وحفظ الاستيراد الجماعي"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* نتيجة الاستيراد */}
          {importResult && (
            <div className="space-y-3 pt-2">
              {importResult.success ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-slate-200">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle className="h-5 w-5" />
                    تم الانتهاء من عملية الاستيراد الجماعي بنجاح!
                  </div>
                  <div className="text-[11px] space-y-1">
                    <p>✓ تم استيراد وحفظ: <strong className="text-emerald-400 text-sm">{importResult.importedCount}</strong> أسرة جديدة بنجاح.</p>
                    <p>⚠ تم تخطي: <strong className="text-amber-400 text-sm">{importResult.skippedCount}</strong> أسرة مكررة أو بدون بيانات أساسية.</p>
                  </div>

                  {importResult.skippedNationalIds && importResult.skippedNationalIds.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold">قائمة الأرقام الوطنية التي تم تخطيها لتكرارها:</p>
                      <div className="max-h-20 overflow-y-auto text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded-lg border border-border flex flex-wrap gap-1.5">
                        {importResult.skippedNationalIds.map((id, idx) => (
                          <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded border border-border">{id}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-3 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="h-5 w-5" />
                  {importResult.error || "حدث خطأ غير متوقع أثناء استيراد البيانات."}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
