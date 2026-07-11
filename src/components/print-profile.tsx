"use client"

import { useRef } from "react"
import { Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PrintProfileProps {
  type: "orphan" | "family"
  data: Record<string, any>
  onClose?: () => void
}

export function PrintProfile({ type, data, onClose }: PrintProfileProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current?.innerHTML
    if (!content) return

    const win = window.open("", "_blank", "width=800,height=600")
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>ملف ${type === "orphan" ? "اليتيم" : "الأسرة"}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            direction: rtl;
            color: #1e293b;
            background: #fff;
            padding: 40px;
          }
          .header {
            border-bottom: 3px solid #10b981;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .org-name {
            font-size: 22px;
            font-weight: 800;
            color: #10b981;
          }
          .doc-title {
            font-size: 16px;
            font-weight: 600;
            color: #475569;
          }
          .date {
            font-size: 12px;
            color: #94a3b8;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #10b981;
            border-right: 4px solid #10b981;
            padding-right: 10px;
            margin-bottom: 12px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .field {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
          }
          .field-label {
            font-size: 11px;
            color: #94a3b8;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .field-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          .footer {
            margin-top: 32px;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94a3b8;
          }
          .badge {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            border-radius: 6px;
            padding: 3px 10px;
            font-size: 12px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 300)
  }

  const printDate = new Date().toLocaleDateString("en-GB")

  const orphanFields = [
    { label: "الاسم الكامل", key: "fullName" },
    { label: "تاريخ الميلاد", key: "birthDate" },
    { label: "الجنس", key: "gender", map: { MALE: "ذكر", FEMALE: "أنثى" } },
    { label: "حالة اليتم", key: "orphanStatus", map: { FATHER_DEAD: "فاقد الأب", BOTH_DEAD: "فاقد الوالدين", MOTHER_DEAD: "فاقد الأم" } },
    { label: "الحالة الصحية", key: "healthStatus" },
    { label: "المستوى الدراسي", key: "educationLevel" },
    { label: "المحافظة", key: "governorateName" },
    { label: "رقم الملف", key: "sequentialNumber" },
  ]

  const familyFields = [
    { label: "رب الأسرة", key: "headOfFamily" },
    { label: "رقم الهاتف", key: "phone" },
    { label: "مستوى الفقر", key: "povertyLevel", map: { SEVERE: "شديد", MEDIUM: "متوسط", LOW: "منخفض" } },
    { label: "عدد الأفراد", key: "membersCount" },
    { label: "الحالة الاجتماعية", key: "socialStatus" },
    { label: "المحافظة", key: "governorateName" },
    { label: "عدد الأيتام", key: "orphansCount" },
    { label: "رقم السجل", key: "sequentialNumber" },
  ]

  const fields = type === "orphan" ? orphanFields : familyFields
  const title = type === "orphan" ? "ملف يتيم" : "ملف أسرة"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative bg-slate-900 border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Toolbar */}
        <div className="sticky top-0 bg-slate-900 border-b border-border/50 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Printer className="h-4 w-4 text-emerald-400" />
            {title}
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          <div ref={printRef}>
            {/* Header */}
            <div className="header" style={{ borderBottom: "3px solid #10b981", paddingBottom: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="org-name" style={{ fontSize: "22px", fontWeight: 800, color: "#10b981" }}>نظام إدارة المنظمة</div>
                <div className="doc-title" style={{ fontSize: "16px", fontWeight: 600, color: "#475569" }}>{title}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div className="date" style={{ fontSize: "12px", color: "#94a3b8" }}>تاريخ الطباعة: {printDate}</div>
                {data.sequentialNumber && (
                  <div className="badge" style={{ display: "inline-block", background: "#dcfce7", color: "#166534", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 700 }}>
                    #{data.sequentialNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="section" style={{ marginBottom: "20px" }}>
              <div className="section-title" style={{ fontSize: "14px", fontWeight: 700, color: "#10b981", borderRight: "4px solid #10b981", paddingRight: "10px", marginBottom: "12px" }}>
                البيانات الأساسية
              </div>
              <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {fields.map((field) => {
                  const rawVal = data[field.key]
                  const displayVal = field.map
                    ? (field.map as any)[rawVal] || rawVal || "—"
                    : rawVal || "—"

                  return (
                    <div key={field.key} className="field" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px" }}>
                      <div className="field-label" style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}>{field.label}</div>
                      <div className="field-value" style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{displayVal}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            {data.notes && (
              <div className="section" style={{ marginBottom: "20px" }}>
                <div className="section-title" style={{ fontSize: "14px", fontWeight: 700, color: "#10b981", borderRight: "4px solid #10b981", paddingRight: "10px", marginBottom: "12px" }}>
                  ملاحظات
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", fontSize: "13px", color: "#475569", lineHeight: 1.7 }}>
                  {data.notes}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="footer" style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
              <span>نظام إدارة المنظمة — NGO ERP</span>
              <span>وثيقة سرية — للاستخدام الداخلي فقط</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
