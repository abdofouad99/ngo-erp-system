"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getOrphanAttachments, getSignedDownloadUrl } from "@/app/actions/attachment-actions"
import { translateDocumentType } from "@/lib/attachment-utils"
import { generateOrphanUpdateToken } from "@/app/actions/update-request-actions"
import { approveOrphan, rejectOrphan } from "@/app/actions/orphan-actions"

import {
  Baby,
  Heart,
  User,
  Users,
  GraduationCap,
  Home as HomeIcon,
  CreditCard,
  Phone,
  FileText,
  Activity,
  AlertCircle,
  Globe,
  Calendar,
  MapPin,
  Paperclip,
  Download,
  Eye,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Check,
  Share2,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { AuditTimeline } from "@/components/dashboard/audit-timeline"
import { CaseActivityTab } from "@/components/shared/case-activity-tab"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  shortName: string | null
  gender: string
  birthdate: Date
  nationalId: string | null
  religion: string | null
  category: string
  // حسابات
  orphanCode: string | null
  kuraimiAccount: string | null
  kuraimiAccountOld: string | null
  kuraimiAccountHolder: string | null
  mumaiyo: string | null
  baitZakatNumber: string | null
  // تعليم
  educationLevel: string | null
  schoolName: string | null
  educationalStage: string | null
  averageGrade: number | null
  educationalNeeds: string | null
  quranMemorization: string | null
  // صحة
  healthStatus: string | null
  disabilityType: string | null
  disability: boolean
  disabilityDetails: string | null
  // معيشة
  nutritionStatus: string | null
  housingStatus: string | null
  // تيتم
  orphanType: string | null
  fatherFullName: string | null
  fatherDeathDate: Date | null
  fatherDeathCause: string | null
  motherDeathDate: Date | null
  motherName: string | null
  // مكان الميلاد
  birthGovernorate: string | null
  birthDistrict: string | null
  birthVillage: string | null
  birthArea: string | null
  // معرِّف
  referrerName: string | null
  referrerPhone1: string | null
  referrerPhone2: string | null
  // تسويق
  marketedToOrg: string | null
  // تحقق
  verificationStatus: string
  verifiedBy: string | null
  rejectionReason: string | null
  createdById: string | null
  isActive: boolean
  notes: string | null
  // علاقات
  family: Family
  sponsorships: Sponsorship[]
  guardians?: { id: string; fullName: string; nationalId: string | null; relation: string | null; occupation: string | null; phone1: string | null; phone2: string | null; phone3: string | null; phone4: string | null; isPrimary: boolean }[]
  siblings?: { id: string; fullName: string; qualification: string | null; birthdate: Date | null; socialStatus: string | null; gender: string | null; siblingOrder: number }[]
}

interface OrphanDetailsClientProps {
  initialOrphan: Orphan
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

function renderValue(value: any, placeholder = "-") {
  if (value === null || value === undefined || value === "" || value === false) {
    return <span className="text-slate-500 font-normal">{placeholder}</span>
  }
  if (value === true) return "نعم"
  return <span className="font-semibold text-white">{value}</span>
}

function formatWhatsAppNumber(phone: string) {
  if (!phone) return ""
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2)
  }
  if (cleaned.startsWith("0")) {
    cleaned = "967" + cleaned.substring(1)
  } else if (cleaned.length === 9 && (cleaned.startsWith("7") || cleaned.startsWith("1"))) {
    cleaned = "967" + cleaned
  }
  return cleaned
}

const sendWhatsAppLocal = async (phone: string, message: string) => {
  try {
    const res = await fetch("http://127.0.0.1:5005/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
      mode: "cors"
    });
    return res.ok;
  } catch (error) {
    console.warn("⚠️ Local WhatsApp API is not running or unreachable:", error);
    return false;
  }
}

export function OrphanDetailsClient({ initialOrphan }: OrphanDetailsClientProps) {
  const router = useRouter()
  const [orphan, setOrphan] = useState<Orphan>(initialOrphan)
  const [rejectionReasonInput, setRejectionReasonInput] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const [updateUrl, setUpdateUrl] = useState<string | null>(null)
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  
  const [selectedPhone, setSelectedPhone] = useState<string>("")
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  // Fetch attachments on mount
  useEffect(() => {
    if (orphan.id) {
      getOrphanAttachments(orphan.id).then(res => {
        if (res.success) setAttachments(res.attachments)
      })
    }
  }, [orphan.id])

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

  const handleAutoSend = async (phone: string, url: string) => {
    if (!phone || !url) return
    setIsSendingWhatsApp(true)
    setSendSuccess(false)
    const msg = `السلام عليكم، يرجى استخدام هذا الرابط لتحديث بيانات اليتيم ${orphan.fullName}:\n\n${url}`
    const success = await sendWhatsAppLocal(phone, msg)
    if (success) {
      setSendSuccess(true)
      setTimeout(() => setSendSuccess(false), 3000)
    } else {
      alert("تعذر الاتصال ببوت واتساب المحلي. يرجى التأكد من تشغيله، أو استخدام الإرسال اليدوي.")
    }
    setIsSendingWhatsApp(false)
  }

  const handleApprove = async () => {
    setIsSubmittingAction(true)
    try {
      const res = await approveOrphan(orphan.id)
      if (res?.success) {
        setOrphan(prev => ({ ...prev, verificationStatus: "APPROVED" }))
        // Fallback: send WhatsApp from browser if server couldn't reach local bot
        if (res.notifyMarketer && res.notifyMarketer.phone) {
          const { phone, orphanName } = res.notifyMarketer
          let cleaned = phone.replace(/\D/g, "")
          if (cleaned.startsWith("0")) cleaned = "967" + cleaned.substring(1)
          else if (cleaned.length === 9) cleaned = "967" + cleaned
          const msg = `🎉 بشرى سارة! تم اعتماد وقبول ملف اليتيم: *${orphanName}* بنجاح في النظام من قبل الإدارة. شكراً لجهودك! 🌹`
          await sendWhatsAppLocal(cleaned, msg)
        }
        router.refresh()
      } else {
        alert(res?.error || "فشل اعتماد الطلب.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReasonInput.trim()) return
    setIsSubmittingAction(true)
    try {
      const res = await rejectOrphan(orphan.id, rejectionReasonInput)
      if (res?.success) {
        setOrphan(prev => ({ ...prev, verificationStatus: "REJECTED", rejectionReason: rejectionReasonInput }))
        setIsRejecting(false)
        setRejectionReasonInput("")
        // Fallback: send WhatsApp from browser if server couldn't reach local bot
        if (res.notifyMarketer && res.notifyMarketer.phone) {
          const { phone, orphanName, reason } = res.notifyMarketer
          let cleaned = phone.replace(/\D/g, "")
          if (cleaned.startsWith("0")) cleaned = "967" + cleaned.substring(1)
          else if (cleaned.length === 9) cleaned = "967" + cleaned
          const msg = `⚠️ تنبيه: تم إرجاع/رفض ملف اليتيم: *${orphanName}* من قبل الإدارة لإجراء تعديلات.\n\n📝 *سبب الرفض/الإرجاع:*\n${reason}\n\n🔗 يرجى الدخول لحسابك وتحديث البيانات المطلوبة وإعادة الإرسال:\nhttps://ngo-erp-system.vercel.app/login`
          await sendWhatsAppLocal(cleaned, msg)
        }
        router.refresh()
      } else {
        alert(res?.error || "فشل رفض الطلب.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ── Page Header / Go Back ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/dashboard/orphans")}
            variant="outline"
            size="icon"
            className="rounded-xl border-slate-800 bg-slate-900/40 text-slate-350 hover:bg-slate-800"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gradient md:text-2xl">تفاصيل اليتيم</h2>
            <p className="mt-0.5 text-xs text-muted-foreground font-medium">
              الاستعلام الكامل وتدقيق ومراجعة كافة البيانات المسجلة لليتيم.
            </p>
          </div>
        </div>
      </div>

      {/* ── Header Banner Card ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-500 to-teal-600 p-6 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5 animate-pulse" />
        <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-inner">
              <Baby className="h-9 w-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold md:text-2xl">{orphan.fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-emerald-100">
                <span className="flex items-center gap-1">
                  <span>كود اليتيم:</span>
                  <span className="font-mono bg-white/15 px-2 py-0.5 rounded-md font-semibold">
                    {orphan.orphanCode || "غير محدد"}
                  </span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-350"></span>
                <span>العمر: {calculateAge(orphan.birthdate).toLocaleString("ar-SA")} سنة</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-350"></span>
                <span>الجنس: {orphan.gender === "MALE" ? "ذكر" : "أنثى"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {orphan.verificationStatus === "APPROVED" && (
              <Badge className="bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 px-3 py-1 text-xs font-bold rounded-xl">
                ✓ معتمد ومقبول
              </Badge>
            )}
            {orphan.verificationStatus === "PENDING" && (
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-bold rounded-xl animate-pulse">
                ⏰ قيد المراجعة والتحقق
              </Badge>
            )}
            {orphan.verificationStatus === "REJECTED" && (
              <Badge className="bg-rose-500/20 text-rose-350 border border-rose-500/30 px-3 py-1 text-xs font-bold rounded-xl">
                ✕ مرفوض ومسترجع
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card border-slate-800 bg-slate-950/40 p-5">
            <Tabs defaultValue="personal" dir="rtl" className="w-full flex flex-col">
              <TabsList className="bg-slate-900/60 rounded-xl p-1 mb-6 flex-wrap h-auto gap-1 justify-start">
                <TabsTrigger value="personal" className="text-xs py-2 flex-1 md:flex-initial">
                  <User className="h-3.5 w-3.5 ml-1.5" />
                  الشخصية والدراسية
                </TabsTrigger>
                <TabsTrigger value="family" className="text-xs py-2 flex-1 md:flex-initial">
                  <HomeIcon className="h-3.5 w-3.5 ml-1.5" />
                  الأسرة والوصي
                </TabsTrigger>
                <TabsTrigger value="orphanhood" className="text-xs py-2 flex-1 md:flex-initial">
                  <FileText className="h-3.5 w-3.5 ml-1.5" />
                  بيانات الوفاة
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-xs py-2 flex-1 md:flex-initial">
                  <CreditCard className="h-3.5 w-3.5 ml-1.5" />
                  المالية والكفالة
                </TabsTrigger>
                <TabsTrigger value="activities" className="text-xs py-2 flex-1 md:flex-initial">
                  <Calendar className="h-3.5 w-3.5 ml-1.5" />
                  الزيارات والمتابعة
                </TabsTrigger>
                <TabsTrigger value="attachments" className="text-xs py-2 flex-1 md:flex-initial">
                  <Paperclip className="h-3.5 w-3.5 ml-1.5" />
                  المستندات ({attachments.length})
                </TabsTrigger>
                <TabsTrigger value="audit" className="text-xs py-2 flex-1 md:flex-initial">
                  <FileText className="h-3.5 w-3.5 ml-1.5" />
                  سجل الحركة
                </TabsTrigger>
              </TabsList>

              <div className="mt-2 min-h-[400px]">
                {/* TAB 1: Personal & Educational */}
                <TabsContent value="personal" className="space-y-6 outline-none animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <User className="h-4 w-4" /> البيانات الشخصية الأساسية
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الرقم الوطني / شهادة الميلاد</p>
                        <p className="text-sm font-mono font-bold text-white tabular-nums">{renderValue(orphan.nationalId)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ الميلاد</p>
                        <p className="text-sm font-bold text-white tabular-nums">{formatDate(orphan.birthdate)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الاسم المختصر للكشوفات</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.shortName)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الديانة</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.religion)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">اسم الوالد رباعياً</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.fatherFullName)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">اسم الأم بالكامل</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.motherName)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-850" />
                  
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" /> التحصيل الدراسي والتعليم
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">المرحلة الدراسية</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.educationalStage)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الصف الدراسي</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.educationLevel)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">اسم المدرسة</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.schoolName)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">مقدار الحفظ من القرآن</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.quranMemorization)}</p>
                      </div>
                      {/* حقول مضافة حديثاً */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">المعدل الدراسي (%)</p>
                        <p className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                          {orphan.averageGrade !== null ? `${orphan.averageGrade.toLocaleString("ar-YE")}%` : renderValue(null)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الاحتياجات التعليمية</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.educationalNeeds)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-850" />

                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <Activity className="h-4 w-4" /> الوضع المعيشي والصحي
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الحالة الصحية العامة</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.healthStatus, "سليم / طبيعي")}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">هل يعاني من إعاقة؟</p>
                        <p className="text-sm font-semibold">
                          {orphan.disability ? (
                            <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">نعم</Badge>
                          ) : (
                            <span className="text-slate-500 font-normal">لا</span>
                          )}
                        </p>
                      </div>
                      {/* حقل مضاف حديثاً */}
                      {orphan.disability && (
                        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 col-span-1 sm:col-span-2 space-y-2">
                          <div>
                            <p className="text-xs text-red-400 font-semibold mb-1">نوع الإعاقة</p>
                            <p className="text-sm font-bold text-red-200">{renderValue(orphan.disabilityType)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-red-400 font-semibold mb-1">تفاصيل وتوجيهات الإعاقة</p>
                            <p className="text-sm text-red-100">{renderValue(orphan.disabilityDetails)}</p>
                          </div>
                        </div>
                      )}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الحالة التغذوية</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.nutritionStatus)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">وضع السكن الحالي</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.housingStatus)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-850" />

                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> مكان الميلاد والتسجيل جغرافيّاً
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[["المحافظة", orphan.birthGovernorate], ["المديرية", orphan.birthDistrict], ["العزلة", orphan.birthVillage], ["المنطقة", orphan.birthArea]].map(([label, val]) => (
                        <div key={label as string} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                          <p className="text-xs text-gray-400 font-semibold mb-1">{label as string}</p>
                          <p className="text-xs font-bold text-white">{renderValue(val)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-slate-850" />

                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <Globe className="h-4 w-4" /> المعرِّف والتسويق
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">اسم المعرِّف</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.referrerName)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">هاتف المعرِّف 1</p>
                        <p className="text-sm font-mono font-bold text-white">{renderValue(orphan.referrerPhone1)}</p>
                      </div>
                      {/* حقل مضاف حديثاً */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">هاتف المعرِّف 2</p>
                        <p className="text-sm font-mono font-bold text-white">{renderValue(orphan.referrerPhone2)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 col-span-1 sm:col-span-3">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الجهة المسوَّق لها</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.marketedToOrg)}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: Family & Guardian */}
                <TabsContent value="family" className="space-y-6 outline-none animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <User className="h-4 w-4" /> بيانات الوصي والمسؤول القانوني
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">اسم الوصي</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.family.guardianName)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">صلة القرابة باليتيم</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.family.guardianRelation)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">رقم هاتف الوصي</p>
                        <p className="text-sm font-mono font-bold text-white tabular-nums">{renderValue(orphan.family.guardianPhone)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-850" />

                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <HomeIcon className="h-4 w-4" /> حالة الأسرة والظروف المعيشية
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">رب الأسرة</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.family.headFullName)}</p>
                      </div>
                      {/* حقول مضافة حديثاً لرب الأسرة */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الرقم الوطني لرب الأسرة</p>
                        <p className="text-sm font-mono font-bold text-white">{renderValue(orphan.family.headNationalId)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">هاتف رب الأسرة البديل</p>
                        <p className="text-sm font-mono font-bold text-white">{renderValue(orphan.family.headAltPhone)}</p>
                      </div>


                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">عدد أفراد الأسرة</p>
                        <p className="text-sm tabular-nums font-bold text-white">
                          {orphan.family.familyMembersCount !== null ? `${orphan.family.familyMembersCount.toLocaleString("ar-YE")} أفراد` : renderValue(null)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">مستوى فقر الأسرة</p>
                        <p className="text-sm font-bold">
                          {orphan.family.povertyLevel ? (
                            orphan.family.povertyLevel === "SEVERE" ? (
                              <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 px-2 py-0.5 rounded-md text-xs">شديد الفقر</Badge>
                            ) : orphan.family.povertyLevel === "MEDIUM" ? (
                              <Badge className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20 px-2 py-0.5 rounded-md text-xs">فقر متوسط</Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 px-2 py-0.5 rounded-md text-xs">فقر منخفض</Badge>
                            )
                          ) : (
                            renderValue(null)
                          )}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">الدخل الشهري للأسرة</p>
                        <p className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                          {orphan.family.monthlyIncome !== null ? formatCurrency(orphan.family.monthlyIncome) : renderValue(null)}
                        </p>
                      </div>
                      {/* حقل مضاف حديثاً */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">مؤشر الهشاشة والضعف (Score)</p>
                        <p className="text-sm font-bold text-purple-400 font-mono tabular-nums">
                          {orphan.family.vulnerabilityScore !== null ? `${orphan.family.vulnerabilityScore} / 100` : renderValue(null)}
                        </p>
                      </div>
                      
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">نوع السكن</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.family.housingType)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">حالة السكن</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.family.housingCondition)}</p>
                      </div>
                      <div className="col-span-1 sm:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">تفاصيل عنوان السكن والحي</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.family.addressDetail)}</p>
                      </div>
                    </div>
                  </div>

                  {/* معيلو اليتيم */}
                  {orphan.guardians && orphan.guardians.length > 0 && (
                    <>
                      <Separator className="bg-slate-850" />
                      <div>
                        <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                          <User className="h-4 w-4" /> تفاصيل المعيلين المسجلين في الملف ({orphan.guardians.length})
                        </h3>
                        {orphan.guardians.map((g, i) => (
                          <div key={g.id} className="rounded-xl border border-amber-500/10 bg-amber-950/5 p-4 mb-3">
                            <p className="text-xs font-extrabold text-amber-500 mb-3 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              {g.isPrimary ? "المعيل الأساسي والقانوني" : `معيل احتياطي (${i + 1})`}
                            </p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {[["الاسم الكامل", g.fullName], ["رقم الهوية", g.nationalId], ["العلاقة", g.relation], ["المهنة", g.occupation], ["هاتف 1", g.phone1], ["هاتف 2", g.phone2], ["هاتف 3", g.phone3], ["هاتف 4", g.phone4]].filter(([, v]) => v).map(([label, val]) => (
                                <div key={label as string} className="rounded-lg bg-slate-950/45 p-2">
                                  <p className="text-[10px] text-gray-400 mb-0.5">{label as string}</p>
                                  <p className="text-xs font-semibold text-white font-mono">{val as string}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* إخوة اليتيم */}
                  {orphan.siblings && orphan.siblings.length > 0 && (
                    <>
                      <Separator className="bg-slate-850" />
                      <div>
                        <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                          <Users className="h-4 w-4" /> بيانات إخوة اليتيم ({orphan.siblings.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {orphan.siblings.sort((a, b) => a.siblingOrder - b.siblingOrder).map((s) => (
                            <div key={s.id} className="rounded-xl border border-blue-500/10 bg-blue-950/5 p-3 flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-400 font-mono">
                                {s.siblingOrder}
                              </div>
                              <div className="flex-1 min-w-0 grid grid-cols-2 gap-1.5">
                                <div className="col-span-2">
                                  <p className="text-[10px] text-gray-400">الاسم بالكامل</p>
                                  <p className="text-xs font-bold text-white break-words">{s.fullName}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400">الجنس</p>
                                  <p className="text-xs text-white">{s.gender === "MALE" ? "ذكر" : s.gender === "FEMALE" ? "أنثى" : "-"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400">تاريخ الميلاد</p>
                                  <p className="text-xs font-mono text-white">{s.birthdate ? new Date(s.birthdate).toLocaleDateString("ar-YE") : "-"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400">المؤهل</p>
                                  <p className="text-xs text-white break-words">{s.qualification || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400">الحالة</p>
                                  <p className="text-xs text-white break-words">{s.socialStatus || "-"}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* TAB 3: Death Details */}
                <TabsContent value="orphanhood" className="space-y-6 outline-none animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" /> تصنيف اليتم وتفاصيل الوفاة
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">تصنيف حالة اليتم</p>
                        <p className="text-sm font-extrabold text-emerald-400">{translateOrphanType(orphan.orphanType)}</p>
                      </div>
                      {(orphan.orphanType === "FATHER" || orphan.orphanType === "BOTH") && (
                        <>
                          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                            <p className="text-xs text-gray-400 font-semibold mb-1">اسم الأب المتوفي بالكامل</p>
                            <p className="text-sm font-bold text-white">{renderValue(orphan.fatherFullName)}</p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                            <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ وفاة الأب</p>
                            <p className="text-sm font-bold text-white font-mono">{orphan.fatherDeathDate ? formatDate(orphan.fatherDeathDate) : renderValue(null)}</p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                            <p className="text-xs text-gray-400 font-semibold mb-1">سبب وفاة الأب</p>
                            <p className="text-sm font-bold text-white">{renderValue(orphan.fatherDeathCause)}</p>
                          </div>
                        </>
                      )}
                      {(orphan.orphanType === "MOTHER" || orphan.orphanType === "BOTH") && (
                        <>
                          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                            <p className="text-xs text-gray-400 font-semibold mb-1">اسم الأم المتوفاة بالكامل</p>
                            <p className="text-sm font-bold text-white">{renderValue(orphan.motherName)}</p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                            <p className="text-xs text-gray-400 font-semibold mb-1">تاريخ وفاة الأم</p>
                            <p className="text-sm font-bold text-white font-mono">{orphan.motherDeathDate ? formatDate(orphan.motherDeathDate) : renderValue(null)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-slate-850" />

                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> ملاحظات البحث الميداني والاجتماعي
                    </h3>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{renderValue(orphan.notes, "لا توجد ملاحظات إضافية مسجلة.")}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 4: Financial & Sponsorship */}
                <TabsContent value="financial" className="space-y-6 outline-none animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4" /> الحسابات المالية وتفاصيل الصرف
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5">
                        <p className="text-xs text-emerald-400 font-semibold mb-1">حساب الكريمي الجديد</p>
                        <p className="text-sm font-mono font-bold text-white tabular-nums">{renderValue(orphan.kuraimiAccount)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">حساب الكريمي القديم</p>
                        <p className="text-sm font-mono font-bold text-white tabular-nums">{renderValue(orphan.kuraimiAccountOld)}</p>
                      </div>
                      {/* حقل مضاف حديثاً */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">اسم صاحب حساب الكريمي</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.kuraimiAccountHolder)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">رقم المميو (كريمي مميز)</p>
                        <p className="text-sm font-mono font-bold text-white tabular-nums">{renderValue(orphan.mumaiyo)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">رقم بيت الزكاة</p>
                        <p className="text-sm font-mono font-bold text-white tabular-nums">{renderValue(orphan.baitZakatNumber)}</p>
                      </div>
                      
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                        <p className="text-xs text-gray-400 font-semibold mb-1">المسؤول عن مراجعة وتدقيق الملف</p>
                        <p className="text-sm font-bold text-white">{renderValue(orphan.verifiedBy || "لم يتم التحديد بعد")}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-850" />

                  <div>
                    <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-rose-500" fill="currentColor" /> تفاصيل الكفالة النشطة والجهات المانحة
                    </h3>

                    {orphan.sponsorships.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-850 p-8 text-center text-slate-500 space-y-1 bg-slate-900/10">
                        <p className="text-sm font-semibold">هذا اليتيم غير مكفول حالياً في النظام</p>
                        <p className="text-xs text-slate-600">الملف جاهز ومستوفي للاعتماد والربط مع المانحين.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orphan.sponsorships.map((spons) => (
                          <div key={spons.id} className="rounded-xl border border-slate-850 bg-slate-900/40 shadow-sm p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-400 font-semibold">اسم الكافل (المتبرع)</p>
                                <p className="text-sm font-bold text-white">{spons.sponsor.fullName}</p>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 text-xs">نشطة</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 pt-2">
                              <div>
                                <p className="text-xs text-gray-400 font-semibold">قيمة الكفالة</p>
                                <p className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                                  {Number(spons.amount).toLocaleString("ar-YE")} {spons.currency}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 font-semibold">دورة الدفع والتسليم</p>
                                <p className="text-sm font-medium text-white">{translatePaymentCycle(spons.paymentCycle)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 font-semibold">بلد الكافل</p>
                                <p className="text-sm font-medium text-white flex items-center gap-1">
                                  <Globe className="h-3.5 w-3.5 text-slate-500" />
                                  {renderValue(spons.sponsorCountry || spons.sponsor.country)}
                                </p>
                              </div>
                            </div>
                            
                            {spons.sponsorshipNotes && (
                              <div className="bg-slate-955 p-2 rounded-lg text-xs border border-slate-850">
                                <p className="text-slate-500 font-semibold mb-0.5">ملاحظات الكفالة:</p>
                                <p className="text-slate-350">{spons.sponsorshipNotes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 5: Activities */}
                <TabsContent value="activities" className="space-y-4 outline-none animate-fade-in">
                  <CaseActivityTab beneficiaryId={orphan.id} />
                </TabsContent>

                {/* TAB 6: Attachments */}
                <TabsContent value="attachments" className="space-y-4 outline-none animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <Paperclip className="h-4 w-4" /> المستندات والملفات المرفوعة
                    </h3>
                  </div>

                  {attachments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                      <Paperclip className="h-10 w-10 opacity-30" />
                      <p className="text-sm">لا توجد وثائق مرفوعة لهذا اليتيم بعد</p>
                      <p className="text-xs text-slate-600">بإمكان المدققين والمسوقين إضافة المرفقات عند تعديل الطلب.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {attachments.map((att) => {
                        const isImage = att.mimeType?.startsWith("image/")
                        return (
                          <div key={att.id} className="rounded-xl border border-slate-850 bg-slate-900/40 p-3.5 flex items-start gap-3.5">
                            {/* Preview */}
                            {isImage ? (
                              <button
                                onClick={() => setLightboxSrc(att.fileUrl)}
                                className="flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-800 hover:border-emerald-500 transition-colors"
                              >
                                <img
                                  src={att.fileUrl}
                                  alt={att.fileName}
                                  className="h-16 w-16 object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </button>
                            ) : (
                              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-850">
                                <FileText className="h-8 w-8 text-slate-500" />
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {translateDocumentType(att.documentType)}
                              </span>
                              <p className="text-xs font-bold text-white truncate" title={att.fileName}>{att.fileName}</p>
                              {att.description && <p className="text-[10px] text-slate-400 truncate">{att.description}</p>}
                              <p className="text-[10px] text-slate-650 font-mono">
                                {att.createdAt ? new Date(att.createdAt).toLocaleDateString("ar-YE") : ""}
                                {att.sizeBytes ? ` · ${(att.sizeBytes / 1024).toFixed(0)} KB` : ""}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1.5">
                              <button
                                title="عرض المستند"
                                onClick={() => window.open(att.fileUrl, "_blank")}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-850 hover:border-emerald-500 hover:text-emerald-400 text-slate-400 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="تحميل المستند"
                                onClick={async () => {
                                  const res = await getSignedDownloadUrl(att.storagePath)
                                  if (res.success && res.url) {
                                    const a = document.createElement("a")
                                    a.href = res.url
                                    a.download = att.fileName
                                    a.click()
                                  }
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-850 hover:border-blue-500 hover:text-blue-400 text-slate-400 transition-colors cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Lightbox */}
                  {lightboxSrc && (
                    <div
                      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
                      onClick={() => setLightboxSrc(null)}
                    >
                      <img src={lightboxSrc} alt="" className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl border border-white/5" />
                      <button className="absolute top-4 left-4 text-white text-2xl font-bold bg-black/40 rounded-full h-10 w-10 flex items-center justify-center hover:bg-black/60 cursor-pointer">
                        ✕
                      </button>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 7: Audit Logs */}
                <TabsContent value="audit" className="space-y-4 outline-none animate-fade-in">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                    <FileText className="h-4.5 w-4.5 text-emerald-600" /> سجل التغييرات التاريخي وتدقيق البيانات
                  </h3>
                  <AuditTimeline entityType="BENEFICIARY" entityId={orphan.id} />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar Actions (Col 3) */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="glass-card border-slate-800 bg-slate-950/40 p-5">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm font-bold text-slate-350 flex items-center gap-2">
                <Baby className="h-4.5 w-4.5 text-emerald-500" /> بطاقة الحالة السريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-900/60">
                <span className="text-slate-450">رقم الملف:</span>
                <span className="font-mono font-bold text-white">{orphan.orphanCode || "—"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900/60">
                <span className="text-slate-450">حالة التحقق:</span>
                <span className="font-bold">
                  {orphan.verificationStatus === "APPROVED" ? (
                    <span className="text-emerald-400">معتمد</span>
                  ) : orphan.verificationStatus === "REJECTED" ? (
                    <span className="text-rose-400">مرفوض</span>
                  ) : (
                    <span className="text-amber-400">تحت التدقيق</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900/60">
                <span className="text-slate-450">تاريخ التسجيل:</span>
                <span className="font-bold text-white">{new Date(orphan.birthdate).toLocaleDateString("ar-YE")}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-450">تاريخ الإنشاء بالنظام:</span>
                <span className="font-bold text-white">
                  {orphan.notes && orphan.notes.includes("تم استيراده") ? (
                    <span className="text-purple-400">تصدير من إكسل</span>
                  ) : (
                    "إدخال يدوي"
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Verification Card */}
          {orphan.verificationStatus === "PENDING" && (
            <Card className="glass-card border-slate-800 bg-slate-950/40 p-5">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-bold text-slate-350 flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-500" /> إجراءات المراجعة والاعتماد
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {!isRejecting ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmittingAction}
                      className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all duration-300 py-5 active:scale-[0.98] shadow-sm shadow-emerald-500/10"
                    >
                      {isSubmittingAction ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          <span>جاري الاعتماد والموافقة...</span>
                        </>
                      ) : (
                        "اعتماد وقبول طلب اليتيم"
                      )}
                    </Button>
                    <Button
                      onClick={() => setIsRejecting(true)}
                      disabled={isSubmittingAction}
                      className="w-full rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-all duration-300 py-5 active:scale-[0.98]"
                    >
                      رفض الطلب ومسترجعه للمسوق
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-red-400">الرجاء إدخال سبب الرفض/الإرجاع بالتفصيل:</p>
                    <textarea
                      value={rejectionReasonInput}
                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                      placeholder="مثال: يرجى رفع صورة واضحة لشهادة الميلاد..."
                      className="w-full h-24 rounded-xl bg-slate-900/60 border border-red-500/20 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 p-3 text-xs text-white text-right resize-none placeholder-slate-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReject}
                        disabled={isSubmittingAction || !rejectionReasonInput.trim()}
                        className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all duration-300 py-4 active:scale-[0.98]"
                      >
                        {isSubmittingAction ? "جاري الحفظ..." : "تأكيد الرفض"}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsRejecting(false)
                          setRejectionReasonInput("")
                        }}
                        disabled={isSubmittingAction}
                        className="rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 px-4 py-4"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rejected Details Card */}
          {orphan.verificationStatus === "REJECTED" && orphan.rejectionReason && (
            <Card className="border-red-500/20 bg-red-955/15 p-5 rounded-2xl shadow-inner">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> تم رفض هذا الملف مسبقاً
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-1.5 text-xs">
                <p className="text-slate-400 font-semibold">سبب الرفض والتعليق الإداري:</p>
                <p className="text-red-200 font-bold bg-slate-950/45 p-3 rounded-xl border border-red-500/10 leading-relaxed">
                  {orphan.rejectionReason}
                </p>
                <p className="text-[10px] text-slate-500 pt-1">
                  ملاحظة: بانتظار قيام المسوق بتحديث البيانات المطلوبة وإعادة الإرسال.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Self-Update Link / WhatsApp Card */}
          {orphan.verificationStatus === "APPROVED" && (() => {
            const primaryGuardian = orphan.guardians?.find(g => g.isPrimary) || orphan.guardians?.[0]
            const phones = Array.from(new Set([
              primaryGuardian?.phone1 || "",
              primaryGuardian?.phone2 || "",
              primaryGuardian?.phone3 || "",
              primaryGuardian?.phone4 || "",
            ].map(p => (p || "").trim()).filter(p => p !== "")))

            const chosenPhone = selectedPhone || phones[0] || ""

            return (
              <Card className="glass-card border-slate-800 bg-slate-950/40 p-5">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-sm font-bold text-slate-350 flex items-center gap-2">
                    <LinkIcon className="h-4.5 w-4.5 text-emerald-450" /> رابط تحديث البيانات وبث الواتساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  {!updateUrl ? (
                    <Button
                      onClick={async () => {
                        setIsGeneratingUrl(true)
                        try {
                          const res = await generateOrphanUpdateToken(orphan.id)
                          if (res.success && res.url) {
                            setUpdateUrl(res.url)
                          }
                        } catch (err) {
                          console.error(err)
                        } finally {
                          setIsGeneratingUrl(false)
                        }
                      }}
                      disabled={isGeneratingUrl}
                      className="w-full rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-white font-bold transition-all duration-300 py-5 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {isGeneratingUrl ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          <span>جاري توليد الرابط...</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 text-emerald-400" />
                          <span>توليد رابط التحديث الذاتي للمعيل</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400">رابط تحديث البيانات للمعيل:</p>
                        <button
                          onClick={() => {
                            setUpdateUrl(null)
                            setCopySuccess(false)
                            setSelectedPhone("")
                            setSendSuccess(false)
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                        >
                          إغلاق الرابط
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={updateUrl}
                          className="flex-1 rounded-xl bg-slate-900/60 border border-slate-850 focus:outline-none p-3 text-xs text-slate-350 text-left font-mono"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <Button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(updateUrl)
                              setCopySuccess(true)
                              setTimeout(() => setCopySuccess(false), 2000)
                            } catch (err) {
                              console.error(err)
                            }
                          }}
                          className={`rounded-xl px-4 py-5 font-bold transition-all duration-300 active:scale-[0.98] ${
                            copySuccess ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-800 border border-slate-750 hover:bg-slate-700 text-slate-200"
                          }`}
                        >
                          {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* اختيار رقم الهاتف للوصي */}
                      <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3 space-y-2 text-right">
                        <p className="text-[10px] font-bold text-slate-450 flex items-center gap-1.5 justify-start">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          الرقم المستهدف لإرسال الرسالة:
                        </p>
                        {phones.length > 0 ? (
                          <div className="flex flex-wrap gap-2 justify-start">
                            {phones.map((phone, idx) => {
                              const isSelected = chosenPhone === phone
                              let label = `رقم ${idx + 1}`
                              if (primaryGuardian) {
                                if (phone === primaryGuardian.phone1) label = "هاتف 1"
                                else if (phone === primaryGuardian.phone2) label = "هاتف 2"
                                else if (phone === primaryGuardian.phone3) label = "هاتف 3"
                                else if (phone === primaryGuardian.phone4) label = "هاتف 4"
                              }
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedPhone(phone)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-sm"
                                      : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                                  }`}
                                >
                                  <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                    isSelected ? "border-emerald-400" : "border-slate-700"
                                  }`}>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                  </span>
                                  <span>{phone}</span>
                                  <span className="text-[9px] opacity-60">({label})</span>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-500 font-semibold">
                            ⚠️ لا توجد أرقام هواتف مسجلة للمعيل.
                          </p>
                        )}
                      </div>

                      {/* أزرار الإرسال */}
                      <div className="flex flex-col gap-2">
                        {phones.length > 0 && (
                          <Button
                            onClick={() => handleAutoSend(chosenPhone, updateUrl)}
                            disabled={isSendingWhatsApp || !chosenPhone}
                            className={`w-full rounded-xl font-bold py-5 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] cursor-pointer ${
                              sendSuccess
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {isSendingWhatsApp ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                                <span>جاري الإرسال عبر البوت...</span>
                              </>
                            ) : sendSuccess ? (
                              <>
                                <Check className="h-4 w-4 text-white" />
                                <span>تم الإرسال بنجاح! ✅</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="h-4 w-4 text-emerald-400" />
                                <span>إرسال تلقائي واتساب ({chosenPhone})</span>
                              </>
                            )}
                          </Button>
                        )}

                        <div className="flex gap-2">
                          <Button
                            asChild
                            className="flex-1 rounded-xl bg-slate-850 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold transition-all duration-300 py-4 active:scale-[0.98] cursor-pointer"
                          >
                            <a
                              href={`https://wa.me/${formatWhatsAppNumber(chosenPhone)}?text=${encodeURIComponent(
                                `السلام عليكم، يرجى استخدام هذا الرابط لتحديث بيانات اليتيم ${orphan.fullName}:\n\n${updateUrl}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 text-xs"
                            >
                              <Share2 className="h-4 w-4 text-slate-400" />
                              <span>إرسال يدوي ويب</span>
                            </a>
                          </Button>
                          <Button
                            asChild
                            className="rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 px-4 py-4 cursor-pointer"
                          >
                            <a href={updateUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}
        </div>

      </div>
    </div>
  )
}
