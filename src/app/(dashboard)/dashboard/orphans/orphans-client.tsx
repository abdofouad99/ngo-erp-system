"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Baby,
  Eye,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Loader2,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  AlertCircle
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
import { AddOrphanSheet } from "@/components/orphans/add-orphan-sheet"
import { TagBadge, TagFilterPills, TagSelector } from "@/components/tags/tag-components"
import type { TagData } from "@/components/tags/tag-components"
import { approveOrphan, rejectOrphan, deleteOrphan, sendBulkOrphanWhatsApp } from "@/app/actions/orphan-actions"
import { exportToExcel } from "@/lib/excel-export"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"


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
  gender: string
  birthdate: Date
  nationalId: string | null
  category: string
  orphanCode: string | null
  kuraimiAccountYemeni: string | null
  kuraimiAccount: string | null
  kuraimiAccountOld: string | null
  kuraimiAccountHolder: string | null
  mumaiyo: string | null
  educationLevel: string | null
  schoolName: string | null
  educationalStage: string | null
  averageGrade: number | null
  educationalNeeds: string | null
  healthStatus: string | null
  disabilityType: string | null
  disability: boolean
  disabilityDetails: string | null
  orphanType: string | null
  fatherDeathDate: Date | null
  fatherDeathCause: string | null
  motherDeathDate: Date | null
  motherName: string | null
  verificationStatus: string
  verifiedBy: string | null
  isActive: boolean
  notes: string | null
  family: Family
  sponsorships: Sponsorship[]
}

interface OrphansClientProps {
  initialOrphans: any[]
  allTags?: TagData[]
  families?: { id: string; headFullName: string }[]
  currentUserRole?: string
  currentUserId?: string
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

export function OrphansClient({ 
  initialOrphans, 
  allTags = [], 
  families = [],
  currentUserRole,
  currentUserId,
}: OrphansClientProps) {
  const orphans = initialOrphans as any[]
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false)
  const [messageTemplate, setMessageTemplate] = useState("يرجى حضور معيل اليتيم {name} (كود: {code}) إلى مقر المؤسسة لاستلام المساعدات المالية والغذائية في أقرب وقت. شكراً لكم.")
  const [isSending, setIsSending] = useState(false)
  const [isRetryingBrowser, setIsRetryingBrowser] = useState(false)
  const [sendResults, setSendResults] = useState<{
    successCount: number
    failCount: number
    details: {
      id: string
      name: string
      code: string | null
      phone: string | null
      contactName: string | null
      message: string | null
      status: "SUCCESS" | "FAILED"
      reason: string
      source?: string
    }[]
  } | null>(null)

  const firstSelectedOrphan = selectedIds.length > 0
    ? orphans.find(o => o.id === selectedIds[0])
    : null

  const getLivePreview = () => {
    if (!firstSelectedOrphan) return ""
    
    let contactName = "غير محدد"
    const primaryGuardian = firstSelectedOrphan.guardians?.find((g: any) => g.isPrimary)
    if (primaryGuardian?.phone1) {
      contactName = primaryGuardian.fullName
    } else if (firstSelectedOrphan.family?.headPhoneNumber) {
      contactName = firstSelectedOrphan.family.headFullName
    } else if (firstSelectedOrphan.family?.headAltPhone) {
      contactName = firstSelectedOrphan.family.headFullName
    } else if (primaryGuardian?.phone2) {
      contactName = primaryGuardian.fullName
    } else {
      const anyGuardian = firstSelectedOrphan.guardians?.find((g: any) => g.phone1)
      if (anyGuardian) {
        contactName = anyGuardian.fullName
      }
    }

    return messageTemplate
      .replace(/{name}/g, firstSelectedOrphan.fullName)
      .replace(/{code}/g, firstSelectedOrphan.orphanCode || "غير محدد")
      .replace(/{guardian}/g, contactName)
  }

  const handleSendBulkMessages = async () => {
    if (selectedIds.length === 0) return
    setIsSending(true)
    setSendResults(null)
    try {
      const isRemote = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      const res = await sendBulkOrphanWhatsApp(selectedIds, messageTemplate, isRemote)
      if (res.success && res.results) {
        if (isRemote) {
          const itemsToSend = res.results.filter(r => r.phone)
          const updatedDetails = res.results.map(r => ({
            ...r,
            status: "FAILED" as "SUCCESS" | "FAILED",
            reason: r.phone ? "جاري الإرسال عبر المتصفح..." : r.reason
          }))

          setSendResults({
            successCount: 0,
            failCount: res.results.length,
            details: updatedDetails
          })

          let currentSuccess = 0
          let currentFail = res.results.length

          for (const item of itemsToSend) {
            let cleaned = item.phone!.replace(/\D/g, "")
            if (cleaned.startsWith("0")) {
              cleaned = "967" + cleaned.substring(1)
            } else if (cleaned.length === 9) {
              cleaned = "967" + cleaned
            }

            try {
              const response = await fetch("http://127.0.0.1:5005/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: cleaned, message: item.message }),
                mode: "cors"
              })

              const detailIndex = updatedDetails.findIndex(d => d.id === item.id)
              if (response.ok) {
                if (detailIndex !== -1) {
                  updatedDetails[detailIndex].status = "SUCCESS"
                  updatedDetails[detailIndex].reason = "تم الإرسال بنجاح"
                  currentSuccess++
                  currentFail--
                }
              } else {
                if (detailIndex !== -1) {
                  updatedDetails[detailIndex].reason = `فشل عبر المتصفح (رمز: ${response.status})`
                }
              }
            } catch (err) {
              console.error("Auto browser send error:", err)
              const detailIndex = updatedDetails.findIndex(d => d.id === item.id)
              if (detailIndex !== -1) {
                updatedDetails[detailIndex].reason = "تعذر الاتصال بالبوت المحلي (تأكد من تشغيله)"
              }
            }

            // Realtime update
            setSendResults({
              successCount: currentSuccess,
              failCount: currentFail,
              details: [...updatedDetails]
            })
          }
        } else {
          // Local environment, server action handled everything
          const successCount = res.results.filter(r => r.status === "SUCCESS").length
          const failCount = res.results.filter(r => r.status === "FAILED").length
          setSendResults({
            successCount,
            failCount,
            details: res.results
          })
        }
      } else {
        alert(res.error || "فشل إرسال الرسائل الجماعية")
      }
    } catch (err) {
      console.error(err)
      alert("حدث خطأ غير متوقع أثناء عملية الإرسال.")
    } finally {
      setIsSending(false)
    }
  }

  const handleSendFailedViaBrowser = async () => {
    if (!sendResults) return
    const failedItems = sendResults.details.filter(d => d.status === "FAILED" && d.phone)
    if (failedItems.length === 0) return
    
    setIsRetryingBrowser(true)
    const newDetails = [...sendResults.details]
    let successCount = sendResults.successCount
    let failCount = sendResults.failCount

    for (const item of failedItems) {
      if (!item.phone || !item.message) continue
      
      let cleaned = item.phone.replace(/\D/g, "")
      if (cleaned.startsWith("0")) {
        cleaned = "967" + cleaned.substring(1)
      } else if (cleaned.length === 9) {
        cleaned = "967" + cleaned
      }

      try {
        const response = await fetch("http://127.0.0.1:5005/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleaned, message: item.message }),
          mode: "cors"
        })

        const detailIndex = newDetails.findIndex(d => d.id === item.id)
        if (response.ok) {
          if (detailIndex !== -1 && newDetails[detailIndex].status === "FAILED") {
            newDetails[detailIndex].status = "SUCCESS"
            newDetails[detailIndex].reason = "تم الإرسال بنجاح عبر المتصفح"
            successCount++
            failCount--
          }
        } else {
          if (detailIndex !== -1) {
            newDetails[detailIndex].reason = `فشل الإرسال عبر المتصفح (رمز: ${response.status})`
          }
        }
      } catch (err) {
        console.error("Browser direct send error:", err)
        const detailIndex = newDetails.findIndex(d => d.id === item.id)
        if (detailIndex !== -1) {
          newDetails[detailIndex].reason = "تعذر الاتصال بالبوت المحلي من المتصفح (تأكد من تشغيل البوت)"
        }
      }
    }

    setSendResults({
      successCount,
      failCount,
      details: newDetails
    })
    setIsRetryingBrowser(false)
  }

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAllToggle = () => {
    const allVisibleSelected = filteredOrphans.length > 0 && filteredOrphans.every(o => selectedIds.includes(o.id));
    if (allVisibleSelected) {
      const visibleIds = filteredOrphans.map(o => o.id);
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = filteredOrphans.map(o => o.id);
      setSelectedIds(prev => {
        const next = [...prev];
        visibleIds.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  }

  const handleExportSelected = () => {
    const targets = selectedIds.length > 0
      ? orphans.filter(o => selectedIds.includes(o.id))
      : filteredOrphans;

    const data = targets.map((o) => {
      const primaryGuardian = o.guardians?.find((g: any) => g.isPrimary) || o.guardians?.[0] || {};
      
      const row: any = {
        "كود اليتيم": o.orphanCode || "",
        "الاسم الكامل": o.fullName || "",
        "الاسم المختصر للكشوفات": o.shortName || "",
        "الجنس": o.gender === "MALE" ? "ذكر" : "أنثى",
        "تاريخ الميلاد": o.birthdate ? new Date(o.birthdate).toLocaleDateString("ar-YE") : "",
        "الرقم الوطني / شهادة الميلاد": o.nationalId || "",
        "الديانة": o.religion || "",
        "اسم الوالد رباعياً": o.fatherFullName || "",
        "اسم الأم": o.motherName || "",
        "رقم حساب الكريمي اليمني": o.kuraimiAccountYemeni || "",
        "رقم حساب الكريمي السعودي": o.kuraimiAccount || "",
        "رقم المميز / المميو": o.mumaiyo || "",
        "اسم صاحب حساب الكريمي": o.kuraimiAccountHolder || "",
        "رقم حساب الكريمي القديم": o.kuraimiAccountOld || "",
        "رقم بيت الزكاة": o.baitZakatNumber || "",
        "الشركة الراعية / الكافل": o.sponsorships?.[0]?.sponsor?.fullName || "",
        "بلد الكافل": o.sponsorships?.[0]?.sponsorCountry || o.sponsorships?.[0]?.sponsor?.country || "",
        "عدد أشهر الكفالة": o.sponsorships?.[0]?.sponsorshipMonths || "",
        "حصة اليتيم كويتي (KWD)": o.sponsorships?.[0]?.shareOrphanKWD || "",
        "حصة الجهة كويتي (KWD)": o.sponsorships?.[0]?.shareOrgKWD || "",
        "إجمالي المبلغ كويتي (KWD)": o.sponsorships?.[0]?.totalAmountKWD || "",
        "حصة اليتيم سعودي (SAR)": o.sponsorships?.[0]?.shareOrphanSAR || "",
        "حصة الجهة سعودي (SAR)": o.sponsorships?.[0]?.shareOrgSAR || "",
        "إجمالي المبلغ سعودي (SAR)": o.sponsorships?.[0]?.totalAmountSAR || "",
        "حصة اليتيم الفعلية": o.sponsorships?.[0]?.orphanShare || "",
        "حصة اليتيم بالتقريب": o.sponsorships?.[0]?.orphanShareRounded || "",
        "حصة الدار": o.sponsorships?.[0]?.houseShare || "",
        "المرحلة الدراسية": o.educationalStage || "",
        "الصف الدراسي": o.educationLevel || "",
        "اسم المدرسة": o.schoolName || "",
        "مقدار الحفظ من القرآن": o.quranMemorization || "",
        "وضع السكن": o.housingStatus || "",
        "التغذية": o.nutritionStatus || "",
        "الحالة الصحية": o.healthStatus || "",
        "يعاني من إعاقة؟": o.disability ? "نعم" : "لا",
        "نوع الإعاقة": o.disabilityType || "",
        "تفاصيل الإعاقة": o.disabilityDetails || "",
        "نوع اليتيم": o.orphanType === "FATHER" ? "يتيم الأب" : o.orphanType === "MOTHER" ? "يتيم الأم" : o.orphanType === "BOTH" ? "يتيم الأبوين" : "",
        "تاريخ وفاة الأب": o.fatherDeathDate ? new Date(o.fatherDeathDate).toLocaleDateString("ar-YE") : "",
        "سبب وفاة الأب": o.fatherDeathCause || "",
        "تاريخ وفاة الأم": o.motherDeathDate ? new Date(o.motherDeathDate).toLocaleDateString("ar-YE") : "",
        "محافظة الميلاد": o.birthGovernorate || "",
        "مديرية الميلاد": o.birthDistrict || "",
        "عزلة الميلاد": o.birthVillage || "",
        "منطقة الميلاد": o.birthArea || "",
        "اسم المعرِّف": o.referrerName || "",
        "هاتف المعرِّف 1": o.referrerPhone1 || "",
        "هاتف المعرِّف 2": o.referrerPhone2 || "",
        "الجهة المسوَّق لها": o.marketedToOrg || "",
        "الملاحظات": o.notes || "",
        "اسم المعيل الأساسي": primaryGuardian.fullName || "",
        "رقم هوية المعيل الأساسي": primaryGuardian.nationalId || "",
        "صلة قرابة المعيل الأساسي": primaryGuardian.relation || "",
        "عمل المعيل الأساسي": primaryGuardian.occupation || "",
        "هاتف المعيل الأساسي 1": primaryGuardian.phone1 || "",
        "هاتف المعيل الأساسي 2": primaryGuardian.phone2 || "",
        "هاتف المعيل الأساسي 3": primaryGuardian.phone3 || "",
        "هاتف المعيل الأساسي 4": primaryGuardian.phone4 || "",
      };

      for (let i = 0; i < 7; i++) {
        const sib = o.siblings?.[i] || {};
        row[`اسم الأخ ${i + 1}`] = sib.fullName || "";
        row[`جنس الأخ ${i + 1}`] = sib.gender === "MALE" ? "ذكر" : sib.gender === "FEMALE" ? "أنثى" : "";
        row[`مؤهل الأخ ${i + 1}`] = sib.qualification || "";
        row[`تاريخ ميلاد الأخ ${i + 1}`] = sib.birthdate ? new Date(sib.birthdate).toLocaleDateString("ar-YE") : "";
        row[`الحالة الاجتماعية للأخ ${i + 1}`] = sib.socialStatus || "";
      }

      return row;
    });

    exportToExcel(data, "تصدير_الأيتام", "الأيتام");
  };
  const router = useRouter()
  const [selectedGender, setSelectedGender] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [selectedFundingTagId, setSelectedFundingTagId] = useState<string | null>(null)
  const [selectedOrphan, setSelectedOrphan] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteOrphan = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف اليتيم (${name}) ونقل ملفه إلى سلة المهملات؟`)) return
    setDeletingId(id)
    try {
      const res = await deleteOrphan(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || "فشل حذف اليتيم.")
      }
    } catch (err) {
      console.error(err)
      alert("حدث خطأ غير متوقع.")
    } finally {
      setDeletingId(null)
    }
  }

  // Cast initial orphans to local typed array (moved to top)

  // Tags filtered by category
  const operationalTags = allTags.filter((t) => t.category === "ORPHAN_OPERATIONAL_STATUS")
  const fundingTags = allTags.filter((t) => t.category === "FUNDING_SOURCE")

  const filteredOrphans = orphans.filter((orphan) => {
    const matchesSearch =
      orphan.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orphan.family?.headFullName && orphan.family.headFullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.nationalId && orphan.nationalId.includes(searchTerm)) ||
      (orphan.orphanCode && orphan.orphanCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.kuraimiAccountYemeni && orphan.kuraimiAccountYemeni.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.kuraimiAccount && orphan.kuraimiAccount.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.kuraimiAccountOld && orphan.kuraimiAccountOld.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.kuraimiAccountHolder && orphan.kuraimiAccountHolder.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.mumaiyo && orphan.mumaiyo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.marketedToOrg && orphan.marketedToOrg.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (orphan.tags && orphan.tags.some((bt: any) => bt.tag?.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (orphan.sponsorships && orphan.sponsorships.some((s: any) => s.sponsor?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesGender = selectedGender === "ALL" || orphan.gender === selectedGender
    const matchesStatus = selectedStatus === "ALL" || orphan.verificationStatus === selectedStatus

    const orphanTagIds = (orphan.tags || []).map((bt: any) => bt.tagId)
    const matchesStatusTag = !selectedTagId || orphanTagIds.includes(selectedTagId)
    const matchesFundingTag = !selectedFundingTagId || orphanTagIds.includes(selectedFundingTagId)

    return matchesSearch && matchesGender && matchesStatus && matchesStatusTag && matchesFundingTag
  })

  const handleApprove = async (id: string) => {
    const res = await approveOrphan(id)
    if (res.success) {
      // Fallback: send WhatsApp from browser if server couldn't reach local bot
      if (res.notifyMarketer && res.notifyMarketer.phone) {
        const { phone, orphanName } = res.notifyMarketer
        let cleaned = phone.replace(/\D/g, "")
        if (cleaned.startsWith("0")) cleaned = "967" + cleaned.substring(1)
        else if (cleaned.length === 9) cleaned = "967" + cleaned
        const msg = `🎉 بشرى سارة! تم اعتماد وقبول ملف اليتيم: *${orphanName}* بنجاح في النظام من قبل الإدارة. شكراً لجهودك! 🌹`
        try {
          await fetch("http://127.0.0.1:5005/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: cleaned, message: msg }),
            mode: "cors"
          })
        } catch (e) { console.warn("WhatsApp bot unreachable", e) }
      }
      router.refresh()
    }
    return res
  }

  const handleReject = async (id: string, reason: string) => {
    const res = await rejectOrphan(id, reason)
    if (res.success) {
      // Fallback: send WhatsApp from browser if server couldn't reach local bot
      if (res.notifyMarketer && res.notifyMarketer.phone) {
        const { phone, orphanName } = res.notifyMarketer
        let cleaned = phone.replace(/\D/g, "")
        if (cleaned.startsWith("0")) cleaned = "967" + cleaned.substring(1)
        else if (cleaned.length === 9) cleaned = "967" + cleaned
        const msg = `⚠️ تنبيه: تم إرجاع/رفض ملف اليتيم: *${orphanName}* من قبل الإدارة لإجراء تعديلات.\n\n📝 *سبب الرفض:*\n${reason}\n\n🔗 يرجى الدخول لحسابك وتحديث البيانات:\nhttps://ngo-erp-system.vercel.app/login`
        try {
          await fetch("http://127.0.0.1:5005/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: cleaned, message: msg }),
            mode: "cors"
          })
        } catch (e) { console.warn("WhatsApp bot unreachable", e) }
      }
      router.refresh()
    }
    return res
  }

  const handleOpenDetails = (orphan: Orphan) => {
    router.push(`/dashboard/orphans/${orphan.id}`)
  }

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

  return (
    <div className="space-y-6">
      {/* ── Filter & Search Bar ────────────────────────────────────── */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="البحث باسم اليتيم أو الرقم الوطني أو كود الملف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 bg-slate-900/40 border-border/80 focus-visible:bg-slate-900/60 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 text-white text-right placeholder-slate-400 text-sm"
              />
            </div>
            {/* Filter Buttons */}
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Gender Filter Group */}
              <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl border border-border/60">
                <Button
                  onClick={() => setSelectedGender("ALL")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedGender === "ALL"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  الكل (الجنس)
                </Button>
                <Button
                  onClick={() => setSelectedGender("MALE")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedGender === "MALE"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  ذكور
                </Button>
                <Button
                  onClick={() => setSelectedGender("FEMALE")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedGender === "FEMALE"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  إناث
                </Button>
              </div>

              {/* Verification Status Filter Group */}
              <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl border border-border/60">
                <Button
                  onClick={() => setSelectedStatus("ALL")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedStatus === "ALL"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  الكل (الاعتماد)
                </Button>
                <Button
                  onClick={() => setSelectedStatus("APPROVED")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedStatus === "APPROVED"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  معتمد ومقبول
                </Button>
                <Button
                  onClick={() => setSelectedStatus("PENDING")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedStatus === "PENDING"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  طلبات معلقة
                </Button>
                <Button
                  onClick={() => setSelectedStatus("REJECTED")}
                  variant="ghost"
                  className={`rounded-lg h-8 px-3.5 text-xs font-bold transition-all duration-300 ${
                    selectedStatus === "REJECTED"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  طلبات مرفوضة
                </Button>
              </div>

              {/* Bulk Message Button */}
              {selectedIds.length > 0 && (
                <Button
                  onClick={() => {
                    setSendResults(null)
                    setIsBulkMessageOpen(true)
                  }}
                  className="rounded-xl px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-all duration-300 h-9 active:scale-[0.98] border border-emerald-500/30"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>إرسال رسالة جماعية ({selectedIds.length})</span>
                </Button>
              )}

              {/* Export Button */}
              <Button
                onClick={handleExportSelected}
                disabled={filteredOrphans.length === 0}
                className="rounded-xl px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all duration-300 h-9 active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>تصدير Excel ({selectedIds.length > 0 ? `${selectedIds.length} محدد` : "الكل"})</span>
              </Button>
            </div>
          </div>

          {/* Tag Filters Row */}
          {(operationalTags.length > 0 || fundingTags.length > 0) && (
            <div className="space-y-2 pt-1 border-t border-white/5">
              {operationalTags.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-white/40 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> الحالة
                  </span>
                  <TagFilterPills
                    tags={operationalTags}
                    selectedId={selectedTagId}
                    onSelect={setSelectedTagId}
                    placeholder="جميع الحالات"
                  />
                </div>
              )}
              {fundingTags.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-white/40 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> جهة التمويل
                  </span>
                  <TagFilterPills
                    tags={fundingTags}
                    selectedId={selectedFundingTagId}
                    onSelect={setSelectedFundingTagId}
                    placeholder="جميع الجهات"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Data Table ──────────────────────────────────────────── */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="w-12 text-center py-3.5 pr-4">
                  <input
                    type="checkbox"
                    checked={filteredOrphans.length > 0 && filteredOrphans.every(o => selectedIds.includes(o.id))}
                    onChange={handleSelectAllToggle}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900/40 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5 pr-2">كود اليتيم</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الاسم الكامل</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">اسم رب الأسرة</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الجنس</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">العمر</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">التصنيفات</TableHead>
                <TableHead className="text-right font-bold text-slate-200 py-3.5">الحالة</TableHead>
                <TableHead className="text-center font-bold text-slate-200 py-3.5 pl-6">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrphans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                    لا توجد نتائج تطابق خيارات البحث والتصفية.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrphans.map((orphan) => (
                  <TableRow
                    key={orphan.id}
                    className="hover:bg-slate-800/30 border-border/40 transition-colors duration-150"
                  >
                    <TableCell className="text-center py-3.5 pr-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(orphan.id)}
                        onChange={() => handleSelectRow(orphan.id)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900/40 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-emerald-400 tabular-nums pr-2">
                      {orphan.orphanCode || "—"}
                    </TableCell>
                    <TableCell className="font-bold text-white">{orphan.fullName}</TableCell>
                    <TableCell className="text-slate-300 font-medium">{orphan.family.headFullName}</TableCell>
                    <TableCell>
                      {orphan.gender === "MALE" ? (
                        <Badge className="badge-premium-blue">
                          ذكر
                        </Badge>
                      ) : (
                        <Badge className="badge-premium-rose">
                          أنثى
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300 tabular-nums font-semibold">
                      {calculateAge(orphan.birthdate).toLocaleString("ar-SA")} سنة
                    </TableCell>
                    {/* Tags Column */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(orphan.tags || []).slice(0, 3).map((bt: any) => (
                          <TagBadge key={bt.tagId} tag={bt.tag} />
                        ))}
                        {(orphan.tags || []).length > 3 && (
                          <span className="text-[10px] text-white/40">+{(orphan.tags || []).length - 3}</span>
                        )}
                        {(orphan.tags || []).length === 0 && allTags.length > 0 && (
                          <TagSelector
                            entityId={orphan.id}
                            entityType="beneficiary"
                            allTags={allTags}
                            selectedTagIds={[]}
                            label="+ تصنيف"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {orphan.verificationStatus === "APPROVED" && (
                        <Badge className="badge-premium-emerald">
                          معتمد
                        </Badge>
                      )}
                      {orphan.verificationStatus === "PENDING" && (
                        <Badge className="badge-premium-orange">
                          قيد المراجعة
                        </Badge>
                      )}
                      {orphan.verificationStatus === "REJECTED" && (
                        <Badge className="badge-premium-rose">
                          مرفوض
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pl-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* عرض التفاصيل */}
                        <Button
                          onClick={() => handleOpenDetails(orphan)}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg px-2.5 text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>التفاصيل</span>
                        </Button>

                        <AddOrphanSheet
                          families={families}
                          orphan={orphan}
                          userRole={currentUserRole}
                          createdById={currentUserId}
                          isMarketer={currentUserRole === "MARKETER"}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg px-2.5 text-xs bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-50 hover:text-white hover:border-amber-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>تعديل</span>
                            </Button>
                          }
                        />

                        {/* حذف/تعطيل */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingId === orphan.id}
                          onClick={() => handleDeleteOrphan(orphan.id, orphan.fullName)}
                          className="h-8 rounded-lg px-2.5 text-xs bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-50 hover:text-white hover:border-rose-500 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-1 font-semibold"
                        >
                          {deletingId === orphan.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>حذف</span>
                            </>
                          )}
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

      {/* ── Bulk Messaging Sheet ──────────────────────────────────── */}
      <Sheet open={isBulkMessageOpen} onOpenChange={setIsBulkMessageOpen}>
        <SheetContent
          className="w-full sm:max-w-2xl bg-slate-950/95 border-l border-white/10 text-white overflow-y-auto text-right p-6"
          dir="rtl"
        >
          <SheetHeader className="text-right space-y-2 mb-6">
            <SheetTitle className="text-xl font-bold text-white flex items-center gap-2 justify-start">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              <span>إرسال رسائل جماعية عبر الواتساب</span>
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-400">
              إرسال رسالة جماعية مخصصة إلى ({selectedIds.length}) من الأيتام/الأسر المحددة. سيقوم النظام باستبدال المتغيرات تلقائياً لكل مستلم.
            </SheetDescription>
          </SheetHeader>

          {/* Form / Report Toggle */}
          {!sendResults ? (
            <div className="space-y-6">
              {/* Variables Instructions */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300">المتغيرات المتاحة للاستخدام في الرسالة:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div 
                    onClick={() => setMessageTemplate(prev => prev + " {name}")}
                    className="cursor-pointer bg-slate-950 hover:bg-slate-800/80 border border-white/5 rounded-lg p-2 text-center transition-all duration-200"
                  >
                    <code className="text-emerald-400 font-mono text-xs block">{`{name}`}</code>
                    <span className="text-[10px] text-slate-400 mt-1 block">اسم اليتيم الكامل</span>
                  </div>
                  <div 
                    onClick={() => setMessageTemplate(prev => prev + " {code}")}
                    className="cursor-pointer bg-slate-950 hover:bg-slate-800/80 border border-white/5 rounded-lg p-2 text-center transition-all duration-200"
                  >
                    <code className="text-emerald-400 font-mono text-xs block">{`{code}`}</code>
                    <span className="text-[10px] text-slate-400 mt-1 block">كود ملف اليتيم</span>
                  </div>
                  <div 
                    onClick={() => setMessageTemplate(prev => prev + " {guardian}")}
                    className="cursor-pointer bg-slate-950 hover:bg-slate-800/80 border border-white/5 rounded-lg p-2 text-center transition-all duration-200"
                  >
                    <code className="text-emerald-400 font-mono text-xs block">{`{guardian}`}</code>
                    <span className="text-[10px] text-slate-400 mt-1 block">اسم المستلم (المعيل/رب الأسرة)</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  💡 انقر على أي متغير أعلاه لإضافته مباشرة إلى نهاية نص الرسالة.
                </p>
              </div>

              {/* Message Template Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">نص الرسالة (القالب):</label>
                <Textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="اكتب نص الرسالة هنا..."
                  className="min-h-[140px] bg-slate-900/40 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 resize-y text-right text-sm"
                />
              </div>

              {/* Live Preview Card */}
              {firstSelectedOrphan && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">معاينة حية لشكل الرسالة (لليتيم الأول):</label>
                  <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3 relative overflow-hidden">
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded-full border border-white/5">
                      <span className="text-[9px] font-bold text-emerald-400">معاينة</span>
                    </div>
                    {/* Chat Bubble Simulation */}
                    <div className="flex flex-col gap-1 items-start mt-2">
                      <div className="bg-emerald-950/40 border border-emerald-500/20 text-slate-200 p-3.5 rounded-2xl rounded-tr-none max-w-[90%] text-sm leading-relaxed text-right relative">
                        <p className="whitespace-pre-line">{getLivePreview()}</p>
                        <span className="text-[9px] text-slate-400 block text-left mt-1.5">الآن</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 pr-2">
                        سيتم إرسالها إلى: <span className="font-bold text-white">{firstSelectedOrphan.fullName}</span> (المستلم: {
                          firstSelectedOrphan.guardians?.find((g: any) => g.isPrimary)?.fullName || firstSelectedOrphan.family?.headFullName || "غير محدد"
                        })
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <Button
                  onClick={handleSendBulkMessages}
                  disabled={isSending || !messageTemplate.trim()}
                  className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm gap-2 transition-all duration-300 active:scale-[0.98]"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جاري إرسال الرسائل...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      <span>بدء الإرسال الجماعي ({selectedIds.length} رسالة)</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsBulkMessageOpen(false)}
                  variant="outline"
                  className="rounded-xl h-11 border-white/10 hover:bg-white/5 text-slate-300"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            /* Results & Report View */
            <div className="space-y-6">
              {/* Summary Stats Card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <span className="text-2xl font-bold text-emerald-400 block tabular-nums">{sendResults.successCount}</span>
                  <span className="text-xs text-emerald-500/70 font-semibold mt-1 block">رسائل نجحت</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center">
                  <span className="text-2xl font-bold text-rose-400 block tabular-nums">{sendResults.failCount}</span>
                  <span className="text-xs text-rose-500/70 font-semibold mt-1 block">رسائل فشلت</span>
                </div>
              </div>

              {/* Browser direct send trigger (if there are failures) */}
              {sendResults.failCount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2 justify-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-400">فشل في إرسال بعض الرسائل</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        قد يرجع ذلك لعدم اتصال الخادم بالبوت المحلي (الواتساب) أو عدم وجود رقم هاتف. يمكنك محاولة إرسال الرسائل الفاشلة مباشرة من متصفحك الحالي عبر البوت المحلي.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendFailedViaBrowser}
                    disabled={isRetryingBrowser || sendResults.details.filter(d => d.status === "FAILED" && d.phone).length === 0}
                    className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 gap-2 transition-all duration-300"
                  >
                    {isRetryingBrowser ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>جاري المحاولة عبر المتصفح...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" />
                        <span>محاولة إرسال الأرقام الفاشلة عبر المتصفح</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Detailed Results List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 block">تفاصيل نتائج الإرسال:</h4>
                <div className="border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5 bg-slate-900/20 max-h-[300px] overflow-y-auto">
                  {sendResults.details.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-white/5 transition-colors">
                      <div className="space-y-1 text-right">
                        <span className="font-bold text-white block">{item.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {item.phone ? (
                            <span className="font-mono">{item.phone}</span>
                          ) : (
                            <span className="text-rose-400">بدون هاتف</span>
                          )}
                          {item.source && (
                            <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-white/5 text-[9px] text-slate-500">
                              {item.source}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === "SUCCESS" ? (
                          <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 gap-1 rounded-lg py-0.5 px-2">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>مكتمل</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 border border-rose-500/20 text-rose-400 gap-1 rounded-lg py-0.5 px-2">
                            <XCircle className="h-3 w-3" />
                            <span>فشل</span>
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-400 max-w-[120px] truncate" title={item.reason}>
                          {item.reason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-4 border-t border-white/5">
                <Button
                  onClick={() => {
                    setIsBulkMessageOpen(false)
                    setSelectedIds([])
                    setSendResults(null)
                  }}
                  className="w-full rounded-xl h-11 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                >
                  إغلاق وتفريغ التحديد
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  )
}
