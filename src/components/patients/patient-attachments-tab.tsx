"use client"

import { useState, useRef, useTransition } from "react"
import { Paperclip, Upload, Trash2, FileText, Image, Download, Loader2, Eye } from "lucide-react"
import { uploadPatientAttachment, deleteAttachment } from "@/app/actions/attachment-actions"

// Document type translations
const DOC_TYPES: Record<string, string> = {
  NATIONAL_ID: "بطاقة الهوية الوطنية",
  BIRTH_CERTIFICATE: "شهادة الميلاد",
  MEDICAL_REPORT: "تقرير طبي",
  PRESCRIPTION: "وصفة طبية",
  REFERRAL_LETTER: "خطاب إحالة",
  LAB_RESULT: "نتائج مختبر",
  IMAGING: "صورة أشعة",
  DEATH_CERTIFICATE: "شهادة الوفاة",
  FAMILY_BOOK: "دفتر العائلة",
  OTHER: "مستند آخر",
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-blue-400" />
  return <FileText className="h-5 w-5 text-rose-400" />
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PatientAttachmentsTabProps {
  patientId: string
  initialAttachments: any[]
}

export function PatientAttachmentsTab({ patientId, initialAttachments }: PatientAttachmentsTabProps) {
  const [attachments, setAttachments] = useState<any[]>(initialAttachments)
  const [isPending, startTransition] = useTransition()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [docType, setDocType] = useState("OTHER")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploadError(null)

    const formData = new FormData()
    formData.set("patientId", patientId)
    formData.set("file", selectedFile)
    formData.set("documentType", docType)
    formData.set("description", description)

    startTransition(async () => {
      const result = await uploadPatientAttachment(formData)
      if (result.success && result.attachment) {
        setAttachments(prev => [...prev, result.attachment])
        setSelectedFile(null)
        setDescription("")
        setDocType("OTHER")
        if (fileRef.current) fileRef.current.value = ""
      } else {
        setUploadError(result.error || "فشل رفع الملف")
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذا المرفق؟")) return
    setDeletingId(id)
    const result = await deleteAttachment(id)
    if (result.success) {
      setAttachments(prev => prev.filter(a => a.id !== id))
    } else {
      alert("فشل حذف المرفق")
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-5">
      {/* Upload Area */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Upload className="h-4 w-4 text-rose-400" /> رفع مرفق جديد
        </h4>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? "border-rose-500 bg-rose-500/10" : "border-border/60 bg-slate-900/30 hover:border-rose-500/50 hover:bg-rose-500/5"
          }`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              {getFileIcon(selectedFile.type)}
              <div className="text-right">
                <p className="text-sm font-bold text-slate-100">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500">{formatBytes(selectedFile.size)}</p>
              </div>
            </div>
          ) : (
            <div>
              <Paperclip className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">اسحب الملف هنا أو انقر للاختيار</p>
              <p className="text-[11px] text-slate-600 mt-1">PDF, JPG, PNG — حد أقصى 5 ميغابايت</p>
            </div>
          )}
        </div>

        {/* Doc type + description */}
        {selectedFile && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">نوع المستند</p>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full bg-slate-900/60 border border-border text-slate-100 text-right rounded-md px-3 py-2 text-xs"
              >
                {Object.entries(DOC_TYPES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">وصف الملف (اختياري)</p>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="وصف مختصر..."
                className="w-full bg-slate-900/60 border border-border text-slate-100 text-right rounded-md px-3 py-2 text-xs placeholder:text-slate-600"
              />
            </div>
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 px-3 py-2 rounded-lg">⚠️ {uploadError}</p>
        )}

        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={isPending}
            className="w-full bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> جاري الرفع...</>
            ) : (
              <><Upload className="h-4 w-4" /> رفع الملف</>
            )}
          </button>
        )}
      </div>

      {/* Attachments List */}
      <div>
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
          <Paperclip className="h-4 w-4 text-rose-400" /> المرفقات ({attachments.length})
        </h4>

        {attachments.length === 0 ? (
          <div className="text-center py-10 text-slate-600">
            <Paperclip className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-xs font-medium">لا توجد مرفقات بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map(att => (
              <div key={att.id} className="flex items-center justify-between bg-slate-900/50 border border-border/50 rounded-xl px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(att.mimeType)}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{att.fileName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {DOC_TYPES[att.documentType] || att.documentType}
                      {att.sizeBytes ? ` • ${formatBytes(att.sizeBytes)}` : ""}
                    </p>
                    {att.description && (
                      <p className="text-[10px] text-slate-400">{att.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a href={att.fileUrl} target="_blank" rel="noreferrer"
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-900/20 transition-all">
                    {att.mimeType.startsWith("image/") ? <Eye className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  </a>
                  <button
                    onClick={() => handleDelete(att.id)}
                    disabled={deletingId === att.id}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                  >
                    {deletingId === att.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
