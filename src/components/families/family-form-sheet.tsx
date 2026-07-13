"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Edit,
  User,
  MapPin,
  Home as HomeIcon,
  FileText,
  AlertCircle,
  Loader2,
  Users,
  Briefcase,
  DollarSign,
  Info,
  Upload,
  Trash2,
  Paperclip,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { createFamily, updateFamily } from "@/app/actions/family-actions"
import { uploadFamilyAttachment, getFamilyAttachments, deleteAttachment } from "@/app/actions/attachment-actions"
import { Separator } from "@/components/ui/separator"

// =============================================================================
// VALIDATION SCHEMA (Arabic UI Validation)
// =============================================================================

const formSchema = z.object({
  headFullName: z.string().min(3, "الاسم الكامل مطلوب ويجب ألا يقل عن 3 أحرف"),
  headNationalId: z.string().min(5, "رقم الهوية الوطنية مطلوب ويجب ألا يقل عن 5 رموز"),
  headGender: z.enum(["MALE", "FEMALE"], { errorMap: () => ({ message: "يرجى اختيار الجنس" }) }),
  headPhoneNumber: z.string().optional().nullable().or(z.literal("")),
  headAltPhone: z.string().optional().nullable().or(z.literal("")),
  headBirthdate: z.string().optional().nullable().or(z.literal("")),
  addressDetail: z.string().optional().nullable().or(z.literal("")),
  subDistrictId: z.string().min(1, "يرجى اختيار الحي/القرية السكنية"),
  vulnerabilityScore: z.string().optional().transform((val) => (val === "" || val === undefined ? 0 : Number(val))).refine((val) => val === null || (val >= 0 && val <= 100), {
    message: "درجة الهشاشة يجب أن تكون بين 0 و 100",
  }),
  notes: z.string().optional().nullable().or(z.literal("")),
  guardianName: z.string().optional().nullable().or(z.literal("")),
  guardianRelation: z.string().optional().nullable().or(z.literal("")),
  guardianPhone: z.string().optional().nullable().or(z.literal("")),
  familyMembersCount: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))).refine((val) => val === null || val >= 1, {
    message: "عدد أفراد الأسرة لا يقل عن 1 فرد",
  }),
  monthlyIncome: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))).refine((val) => val === null || val >= 0, {
    message: "الدخل الشهري لا يقل عن 0 ريال",
  }),
  housingType: z.string().optional().nullable().or(z.literal("")),
  housingCondition: z.string().optional().nullable().or(z.literal("")),
  povertyLevel: z.string().optional().nullable().or(z.literal("")),
  socialStatus: z.string().optional().nullable().or(z.literal("")),

  // New Fields
  headLastName: z.string().optional().nullable().or(z.literal("")),
  headIdType: z.string().optional().nullable().or(z.literal("")),
  headIdIssueDate: z.string().optional().nullable().or(z.literal("")),
  headIdIssuePlace: z.string().optional().nullable().or(z.literal("")),
  headAge: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  headWhatsApp: z.string().optional().nullable().or(z.literal("")),
  headEducationLevel: z.string().optional().nullable().or(z.literal("")),
  headOccupation: z.string().optional().nullable().or(z.literal("")),

  spouseName: z.string().optional().nullable().or(z.literal("")),
  spouseIdNumber: z.string().optional().nullable().or(z.literal("")),
  spouseIdType: z.string().optional().nullable().or(z.literal("")),
  spouseBirthdate: z.string().optional().nullable().or(z.literal("")),
  spouseAge: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  spouseEducationLevel: z.string().optional().nullable().or(z.literal("")),
  hasAnotherSpouse: z.preprocess((val) => val === "true" || val === true, z.boolean()),

  manualMembersCount: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  manualMalesCount: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  manualFemalesCount: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  kidsUnder5Count: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  kids5To17Count: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  adults18To59Count: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  elderlyAbove60Count: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  specialNeedsCount: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  disabilityType: z.string().optional().nullable().or(z.literal("")),

  nearestLandmark: z.string().optional().nullable().or(z.literal("")),
  rentAmount: z.string().optional().transform((val) => (val === "" || val === undefined ? null : Number(val))),
  waterSource: z.string().optional().nullable().or(z.literal("")),
  electricitySource: z.string().optional().nullable().or(z.literal("")),
  housingNotes: z.string().optional().nullable().or(z.literal("")),

  hasOrphans: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  orphansCount: z.string().optional().transform((val) => (val === "" || val === undefined ? 0 : Number(val))),
  hasWidow: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  hasUnemployed: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  urgentNeeds: z.string().optional().nullable().or(z.literal("")),

  isDisplaced: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  displacementGov: z.string().optional().nullable().or(z.literal("")),
  displacementDist: z.string().optional().nullable().or(z.literal("")),
  displacementDate: z.string().optional().nullable().or(z.literal("")),
  displacementReason: z.string().optional().nullable().or(z.literal("")),

  receivedAidBefore: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  aidType: z.string().optional().nullable().or(z.literal("")),
  aidDonor: z.string().optional().nullable().or(z.literal("")),
  lastAidDate: z.string().optional().nullable().or(z.literal("")),

  deliveryMethod: z.string().optional().nullable().or(z.literal("")),
  kuraimiAccountYemeni: z.string().optional().nullable().or(z.literal("")),
  kuraimiAccountSaudi: z.string().optional().nullable().or(z.literal("")),

  referrerName: z.string().optional().nullable().or(z.literal("")),
  referrerRelation: z.string().optional().nullable().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface FamilyFormSheetProps {
  family?: any // Present in edit mode
  geography: {
    id: number
    nameAr: string
    districts: {
      id: number
      nameAr: string
      subDistricts: {
        id: number
        nameAr: string
      }[]
    }[]
  }[]
  trigger?: React.ReactNode
  userRole?: string
}

export function FamilyFormSheet({ family, geography, trigger, userRole }: FamilyFormSheetProps) {
  const isEditMode = !!family
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Cascading Geography States
  const [govId, setGovId] = useState<number | "">("")
  const [districtId, setDistrictId] = useState<number | "">("")

  // Setup Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headFullName: "",
      headNationalId: "",
      headGender: "MALE",
      headPhoneNumber: "",
      headAltPhone: "",
      headBirthdate: "",
      addressDetail: "",
      subDistrictId: "",
      vulnerabilityScore: 0 as any,
      notes: "",
      guardianName: "",
      guardianRelation: "",
      guardianPhone: "",
      familyMembersCount: "" as any,
      monthlyIncome: "" as any,
      housingType: "",
      housingCondition: "",
      povertyLevel: "",
      socialStatus: "",

      headLastName: "",
      headIdType: "",
      headIdIssueDate: "",
      headIdIssuePlace: "",
      headAge: "" as any,
      headWhatsApp: "",
      headEducationLevel: "",
      headOccupation: "",

      spouseName: "",
      spouseIdNumber: "",
      spouseIdType: "",
      spouseBirthdate: "",
      spouseAge: "" as any,
      spouseEducationLevel: "",
      hasAnotherSpouse: false,

      manualMembersCount: "" as any,
      manualMalesCount: "" as any,
      manualFemalesCount: "" as any,
      kidsUnder5Count: "" as any,
      kids5To17Count: "" as any,
      adults18To59Count: "" as any,
      elderlyAbove60Count: "" as any,
      specialNeedsCount: "" as any,
      disabilityType: "",

      nearestLandmark: "",
      rentAmount: "" as any,
      waterSource: "",
      electricitySource: "",
      housingNotes: "",

      hasOrphans: false,
      orphansCount: "" as any,
      hasWidow: false,
      hasUnemployed: false,
      urgentNeeds: "",

      isDisplaced: false,
      displacementGov: "",
      displacementDist: "",
      displacementDate: "",
      displacementReason: "",

      receivedAidBefore: false,
      aidType: "",
      aidDonor: "",
      lastAidDate: "",

      deliveryMethod: "",
      kuraimiAccountYemeni: "",
      kuraimiAccountSaudi: "",

      referrerName: "",
      referrerRelation: "",
    },
  })

  // Watch displacement state
  const isDisplacedWatched = watch("isDisplaced")
  const hasOrphansWatched = watch("hasOrphans")
  const receivedAidWatched = watch("receivedAidBefore")

  // Attachment Management States
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<{
    file: File
    documentType: string
    description: string
    preview?: string
  }[]>([])
  const [newFileType, setNewFileType] = useState("NATIONAL_ID")
  const [newFileDesc, setNewFileDesc] = useState("")
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الملف يتجاوز الحد المسموح (5 ميغابايت)")
      return
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      alert("نوع الملف غير مدعوم. يُسمح بـ PDF, JPG, PNG فقط")
      return
    }
    let preview: string | undefined = undefined
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file)
    }
    setPendingFiles(prev => [...prev, { file, documentType: newFileType, description: newFileDesc, preview }])
    setNewFileDesc("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const [existingAttachments, setExistingAttachments] = useState<any[]>([])
  useEffect(() => {
    if (isEditMode && family && open) {
      getFamilyAttachments(family.id).then(res => {
        if (res.success && res.attachments) {
          setExistingAttachments(res.attachments)
        }
      })
    } else {
      setExistingAttachments([])
    }
  }, [family, isEditMode, open])

  // Load initial values for editing
  useEffect(() => {
    if (isEditMode && family) {
      let matchedGovId: number | "" = ""
      let matchedDistId: number | "" = ""

      for (const gov of geography) {
        for (const dist of gov.districts) {
          for (const sub of dist.subDistricts) {
            if (sub.id === family.subDistrictId) {
              matchedGovId = gov.id
              matchedDistId = dist.id
              break
            }
          }
        }
      }

      setGovId(matchedGovId)
      setDistrictId(matchedDistId)

      // Set form values
      reset({
        headFullName: family.headFullName,
        headNationalId: family.headNationalId,
        headGender: family.headGender,
        headPhoneNumber: family.headPhoneNumber || "",
        headAltPhone: family.headAltPhone || "",
        headBirthdate: family.headBirthdate ? new Date(family.headBirthdate).toISOString().split("T")[0] : "",
        addressDetail: family.addressDetail || "",
        subDistrictId: family.subDistrictId.toString(),
        vulnerabilityScore: family.vulnerabilityScore !== null ? family.vulnerabilityScore.toString() : ("0" as any),
        notes: family.notes || "",
        guardianName: family.guardianName || "",
        guardianRelation: family.guardianRelation || "",
        guardianPhone: family.guardianPhone || "",
        familyMembersCount: family.familyMembersCount !== null ? family.familyMembersCount.toString() : ("" as any),
        monthlyIncome: family.monthlyIncome !== null ? family.monthlyIncome.toString() : ("" as any),
        housingType: family.housingType || "",
        housingCondition: family.housingCondition || "",
        povertyLevel: family.povertyLevel || "",
        socialStatus: family.socialStatus || "",

        headLastName: family.headLastName || "",
        headIdType: family.headIdType || "",
        headIdIssueDate: family.headIdIssueDate || "",
        headIdIssuePlace: family.headIdIssuePlace || "",
        headAge: family.headAge !== null ? family.headAge.toString() : ("" as any),
        headWhatsApp: family.headWhatsApp || "",
        headEducationLevel: family.headEducationLevel || "",
        headOccupation: family.headOccupation || "",

        spouseName: family.spouseName || "",
        spouseIdNumber: family.spouseIdNumber || "",
        spouseIdType: family.spouseIdType || "",
        spouseBirthdate: family.spouseBirthdate ? new Date(family.spouseBirthdate).toISOString().split("T")[0] : "",
        spouseAge: family.spouseAge !== null ? family.spouseAge.toString() : ("" as any),
        spouseEducationLevel: family.spouseEducationLevel || "",
        hasAnotherSpouse: !!family.hasAnotherSpouse,

        manualMembersCount: family.manualMembersCount !== null ? family.manualMembersCount.toString() : ("" as any),
        manualMalesCount: family.manualMalesCount !== null ? family.manualMalesCount.toString() : ("" as any),
        manualFemalesCount: family.manualFemalesCount !== null ? family.manualFemalesCount.toString() : ("" as any),
        kidsUnder5Count: family.kidsUnder5Count !== null ? family.kidsUnder5Count.toString() : ("" as any),
        kids5To17Count: family.kids5To17Count !== null ? family.kids5To17Count.toString() : ("" as any),
        adults18To59Count: family.adults18To59Count !== null ? family.adults18To59Count.toString() : ("" as any),
        elderlyAbove60Count: family.elderlyAbove60Count !== null ? family.elderlyAbove60Count.toString() : ("" as any),
        specialNeedsCount: family.specialNeedsCount !== null ? family.specialNeedsCount.toString() : ("" as any),
        disabilityType: family.disabilityType || "",

        nearestLandmark: family.nearestLandmark || "",
        rentAmount: family.rentAmount !== null ? family.rentAmount.toString() : ("" as any),
        waterSource: family.waterSource || "",
        electricitySource: family.electricitySource || "",
        housingNotes: family.housingNotes || "",

        hasOrphans: !!family.hasOrphans,
        orphansCount: family.orphansCount !== null ? family.orphansCount.toString() : ("0" as any),
        hasWidow: !!family.hasWidow,
        hasUnemployed: !!family.hasUnemployed,
        urgentNeeds: family.urgentNeeds || "",

        isDisplaced: !!family.isDisplaced,
        displacementGov: family.displacementGov || "",
        displacementDist: family.displacementDist || "",
        displacementDate: family.displacementDate || "",
        displacementReason: family.displacementReason || "",

        receivedAidBefore: !!family.receivedAidBefore,
        aidType: family.aidType || "",
        aidDonor: family.aidDonor || "",
        lastAidDate: family.lastAidDate || "",

        deliveryMethod: family.deliveryMethod || "",
        kuraimiAccountYemeni: family.kuraimiAccountYemeni || "",
        kuraimiAccountSaudi: family.kuraimiAccountSaudi || "",

        referrerName: family.referrerName || "",
        referrerRelation: family.referrerRelation || "",
      })
    } else if (open) {
      reset({
        headFullName: "",
        headNationalId: "",
        headGender: "MALE",
        headPhoneNumber: "",
        headAltPhone: "",
        headBirthdate: "",
        addressDetail: "",
        subDistrictId: "",
        vulnerabilityScore: 0 as any,
        notes: "",
        guardianName: "",
        guardianRelation: "",
        guardianPhone: "",
        familyMembersCount: "" as any,
        monthlyIncome: "" as any,
        housingType: "",
        housingCondition: "",
        povertyLevel: "",
        socialStatus: "",

        headLastName: "",
        headIdType: "",
        headIdIssueDate: "",
        headIdIssuePlace: "",
        headAge: "" as any,
        headWhatsApp: "",
        headEducationLevel: "",
        headOccupation: "",

        spouseName: "",
        spouseIdNumber: "",
        spouseIdType: "",
        spouseBirthdate: "",
        spouseAge: "" as any,
        spouseEducationLevel: "",
        hasAnotherSpouse: false,

        manualMembersCount: "" as any,
        manualMalesCount: "" as any,
        manualFemalesCount: "" as any,
        kidsUnder5Count: "" as any,
        kids5To17Count: "" as any,
        adults18To59Count: "" as any,
        elderlyAbove60Count: "" as any,
        specialNeedsCount: "" as any,
        disabilityType: "",

        nearestLandmark: "",
        rentAmount: "" as any,
        waterSource: "",
        electricitySource: "",
        housingNotes: "",

        hasOrphans: false,
        orphansCount: "" as any,
        hasWidow: false,
        hasUnemployed: false,
        urgentNeeds: "",

        isDisplaced: false,
        displacementGov: "",
        displacementDist: "",
        displacementDate: "",
        displacementReason: "",

        receivedAidBefore: false,
        aidType: "",
        aidDonor: "",
        lastAidDate: "",

        deliveryMethod: "",
        kuraimiAccountYemeni: "",
        kuraimiAccountSaudi: "",

        referrerName: "",
        referrerRelation: "",
      })
      setGovId("")
      setDistrictId("")
    }
  }, [family, isEditMode, open, geography, reset])

  // cascading selects helpers
  const activeGovernorate = geography.find((g) => g.id === govId)
  const activeDistricts = activeGovernorate ? activeGovernorate.districts : []
  const activeDistrict = activeDistricts.find((d) => d.id === districtId)
  const activeSubDistricts = activeDistrict ? activeDistrict.subDistricts : []

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const result = isEditMode
      ? await updateFamily(family.id, values)
      : await createFamily(values)

    if (result.success) {
      const familyId = isEditMode ? family.id : result.family?.id
      if (familyId && pendingFiles.length > 0) {
        for (const pf of pendingFiles) {
          const fd = new FormData()
          fd.append("familyId", familyId)
          fd.append("file", pf.file)
          fd.append("documentType", pf.documentType)
          if (pf.description) {
            fd.append("description", pf.description)
          }
          await uploadFamilyAttachment(fd)
        }
        setPendingFiles([])
      }

      setSuccessMsg(
        isEditMode ? "تم تحديث بيانات الأسرة بنجاح!" : "تم تسجيل الأسرة الجديدة بنجاح!"
      )
      if (!isEditMode) reset()
      setTimeout(() => {
        setOpen(false)
        setSuccessMsg(null)
      }, 1500)
    } else {
      setErrorMsg(result.error || "حدث خطأ غير متوقع. يرجى مراجعة الحقول.")
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full sm:w-auto btn-premium gap-2">
            <Plus className="h-4 w-4" />
            <span>تسجيل أسرة جديدة</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="sm:max-w-3xl w-full p-0 flex flex-col h-full bg-slate-950 text-right border-l border-border shadow-2xl"
      >
        {/* Header Panel */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 to-teal-700 p-5 text-white flex-shrink-0">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-20 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <SheetTitle className="text-white text-base font-bold md:text-lg flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Edit className="h-5 w-5 text-emerald-100" />
                  تعديل سجل بيانات الأسرة المستفيدة
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-emerald-100" />
                  تسجيل أسرة مستفيدة جديدة في النظام
                </>
              )}
            </SheetTitle>
            <SheetDescription className="text-emerald-100 text-[11px] mt-1">
              أدخل كافة البيانات الشخصية لرب الأسرة والزوجة، وتفاصيل أفراد العائلة، السكن، والتقييم المالي.
            </SheetDescription>
          </div>
        </div>

        {/* Message Banner */}
        {successMsg && (
          <div className="bg-emerald-950/50 text-emerald-400 p-3 text-xs font-semibold flex items-center gap-2 border-b border-emerald-500/20">
            <AlertCircle className="h-4 w-4 text-emerald-400" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-950/50 text-red-400 p-3 text-xs font-semibold flex items-center gap-2 border-b border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Tabs defaultValue="head" className="w-full flex flex-col h-full">
              <TabsList className="bg-slate-900/60 border border-border/60 rounded-xl p-1 mb-6 flex-shrink-0 grid grid-cols-6 gap-1 w-full justify-between">
                <TabsTrigger value="head" className="text-[11px] py-1.5 px-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  رب الأسرة
                </TabsTrigger>
                <TabsTrigger value="spouse" className="text-[11px] py-1.5 px-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  الزوجة والتابعين
                </TabsTrigger>
                <TabsTrigger value="housing" className="text-[11px] py-1.5 px-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  السكن والنزوح
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-[11px] py-1.5 px-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  المالية والمعيشة
                </TabsTrigger>
                <TabsTrigger value="referrer" className="text-[11px] py-1.5 px-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  المعرف والوصي
                </TabsTrigger>
                <TabsTrigger value="attachments" className="text-[11px] py-1.5 px-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-slate-300">
                  المرفقات والوثائق
                </TabsTrigger>
              </TabsList>

              <fieldset disabled={userRole === "VIEWER"} className="w-full space-y-4">
                
                {/* 1) رب الأسرة */}
                <TabsContent value="head" className="space-y-4 outline-none">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-300">الاسم الرباعي للزوج (رب الأسرة) *</label>
                      <Input placeholder="الاسم الكامل لرب الأسرة بموجب البطاقة" className="bg-slate-900/40 border-border text-white" {...register("headFullName")} />
                      {errors.headFullName && (
                        <p className="text-xs font-semibold text-red-500 mt-1">{errors.headFullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">اللقب</label>
                      <Input placeholder="اللقب أو اسم العائلة" className="bg-slate-900/40 border-border text-white" {...register("headLastName")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">رقم الهوية / الجواز *</label>
                      <Input placeholder="رقم البطاقة الشخصية أو الجواز" className="bg-slate-900/40 border-border text-white" {...register("headNationalId")} />
                      {errors.headNationalId && (
                        <p className="text-xs font-semibold text-red-500 mt-1">{errors.headNationalId.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">نوع الهوية</label>
                      <select {...register("headIdType")} className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right">
                        <option value="" className="bg-slate-950 text-white">-- اختر --</option>
                        <option value="بطاقة شخصية" className="bg-slate-950 text-white">بطاقة شخصية</option>
                        <option value="جواز سفر" className="bg-slate-950 text-white">جواز سفر</option>
                        <option value="بطاقة عائلية" className="bg-slate-950 text-white">بطاقة عائلية</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">مكان الإصدار</label>
                      <Input placeholder="مكان إصدار البطاقة" className="bg-slate-900/40 border-border text-white" {...register("headIdIssuePlace")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">تاريخ إصدار الهوية</label>
                      <Input type="date" className="bg-slate-900/40 border-border text-white" {...register("headIdIssueDate")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">تاريخ الميلاد</label>
                      <Input type="date" className="bg-slate-900/40 border-border text-white" {...register("headBirthdate")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">العمر الحالي</label>
                      <Input type="number" placeholder="العمر بالسنوات" className="bg-slate-900/40 border-border text-white" {...register("headAge")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">الجنس</label>
                      <select {...register("headGender")} className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right">
                        <option value="MALE" className="bg-slate-950 text-white">ذكر</option>
                        <option value="FEMALE" className="bg-slate-950 text-white">أنثى</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">الحالة الاجتماعية</label>
                      <select {...register("socialStatus")} className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right">
                        <option value="" className="bg-slate-950 text-white">-- اختر --</option>
                        <option value="متزوج" className="bg-slate-950 text-white">متزوج</option>
                        <option value="أرمل" className="bg-slate-950 text-white">أرمل</option>
                        <option value="مطلق" className="bg-slate-950 text-white">مطلق</option>
                        <option value="متوفي" className="bg-slate-950 text-white">متوفي</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">المستوى التعليمي</label>
                      <Input placeholder="أمي، ابتدائي، جامعي..." className="bg-slate-900/40 border-border text-white" {...register("headEducationLevel")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">المهنة الحالية</label>
                      <Input placeholder="العمل أو الوظيفة الحالية" className="bg-slate-900/40 border-border text-white" {...register("headOccupation")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">رقم الجوال الأساسي</label>
                      <Input placeholder="مثال: 771234567" className="bg-slate-900/40 border-border text-white" {...register("headPhoneNumber")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">رقم الجوال البديل</label>
                      <Input placeholder="رقم جوال احتياطي" className="bg-slate-900/40 border-border text-white" {...register("headAltPhone")} />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-300">رقم الواتساب</label>
                      <Input placeholder="رقم الواتساب الفعال للأسرة" className="bg-slate-900/40 border-border text-white" {...register("headWhatsApp")} />
                    </div>
                  </div>
                </TabsContent>

                {/* 2) الزوجة والتابعين */}
                <TabsContent value="spouse" className="space-y-4 outline-none">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    بيانات الزوجة الرئيسية
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-300">اسم الزوجة الرباعي</label>
                      <Input placeholder="الاسم الكامل للزوجة بموجب الهوية" className="bg-slate-900/40 border-border text-white" {...register("spouseName")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">رقم هوية الزوجة</label>
                      <Input placeholder="رقم البطاقة الشخصية للزوجة" className="bg-slate-900/40 border-border text-white" {...register("spouseIdNumber")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">نوع هوية الزوجة</label>
                      <Input placeholder="شخصية، جواز..." className="bg-slate-900/40 border-border text-white" {...register("spouseIdType")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">تاريخ ميلاد الزوجة</label>
                      <Input type="date" className="bg-slate-900/40 border-border text-white" {...register("spouseBirthdate")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">عمر الزوجة</label>
                      <Input type="number" placeholder="العمر الحالي للزوجة" className="bg-slate-900/40 border-border text-white" {...register("spouseAge")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">المستوى التعليمي للزوجة</label>
                      <Input placeholder="امي، متوسط، جامعي..." className="bg-slate-900/40 border-border text-white" {...register("spouseEducationLevel")} />
                    </div>
                    <div className="space-y-1.5 flex items-center justify-end h-full">
                      <label className="text-xs font-bold text-slate-300 ml-2 cursor-pointer" htmlFor="hasAnotherSpouse">هل توجد زوجة أخرى؟</label>
                      <input type="checkbox" id="hasAnotherSpouse" className="rounded border-slate-700 bg-slate-900/40 text-emerald-500 h-4 w-4" {...register("hasAnotherSpouse")} />
                    </div>
                  </div>

                  <Separator className="my-2 border-border/40" />
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    بيانات وإحصائيات أفراد الأسرة (المعالين)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">إجمالي الأفراد *</label>
                      <Input type="number" placeholder="شاملاً الزوجين" className="bg-slate-900/40 border-border text-white" {...register("manualMembersCount")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">عدد الذكور</label>
                      <Input type="number" placeholder="ذكور" className="bg-slate-900/40 border-border text-white" {...register("manualMalesCount")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">عدد الإناث</label>
                      <Input type="number" placeholder="إناث" className="bg-slate-900/40 border-border text-white" {...register("manualFemalesCount")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">أطفال (أقل من 5)</label>
                      <Input type="number" className="bg-slate-900/40 border-border text-white" {...register("kidsUnder5Count")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">أطفال (5 - 17)</label>
                      <Input type="number" className="bg-slate-900/40 border-border text-white" {...register("kids5To17Count")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">بالغين (18 - 59)</label>
                      <Input type="number" className="bg-slate-900/40 border-border text-white" {...register("adults18To59Count")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">كبار سن (+60)</label>
                      <Input type="number" className="bg-slate-900/40 border-border text-white" {...register("elderlyAbove60Count")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">ذوي الاحتياجات</label>
                      <Input type="number" className="bg-slate-900/40 border-border text-white" {...register("specialNeedsCount")} />
                    </div>
                    <div className="space-y-1.5 col-span-4">
                      <label className="text-xs font-bold text-slate-300">نوع الإعاقة / الأمراض المزمنة لأفراد الأسرة</label>
                      <Input placeholder="مثال: شلل أطفال، مريض بالقلب..." className="bg-slate-900/40 border-border text-white" {...register("disabilityType")} />
                    </div>
                  </div>
                </TabsContent>

                {/* 3) السكن والنزوح */}
                <TabsContent value="housing" className="space-y-4 outline-none">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    الموقع الجغرافي والسكني للأسرة
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">المحافظة *</label>
                      <select
                        value={govId}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value)
                          setGovId(val)
                          setDistrictId("")
                          setValue("subDistrictId", "")
                        }}
                        className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                      >
                        <option value="" className="bg-slate-950 text-white">-- اختر --</option>
                        {geography.map((g) => (
                          <option key={g.id} value={g.id} className="bg-slate-950 text-white">{g.nameAr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">المديرية *</label>
                      <select
                        value={districtId}
                        disabled={!govId}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value)
                          setDistrictId(val)
                          setValue("subDistrictId", "")
                        }}
                        className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right disabled:opacity-50"
                      >
                        <option value="" className="bg-slate-950 text-white">-- اختر --</option>
                        {activeDistricts.map((d) => (
                          <option key={d.id} value={d.id} className="bg-slate-950 text-white">{d.nameAr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">العزلة / المنطقة *</label>
                      <select
                        {...register("subDistrictId")}
                        disabled={!districtId}
                        className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right disabled:opacity-50"
                      >
                        <option value="" className="bg-slate-950 text-white">-- اختر --</option>
                        {activeSubDistricts.map((s) => (
                          <option key={s.id} value={s.id.toString()} className="bg-slate-950 text-white">{s.nameAr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">القرية / الحارة</label>
                      <Input placeholder="القرية أو الحارة السكنية" className="bg-slate-900/40 border-border text-white" {...register("addressDetail")} />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-300">أقرب معلم بارز للعنوان</label>
                      <Input placeholder="مثال: جوار مدرسة الفوز، خلف البنك الأهلي" className="bg-slate-900/40 border-border text-white" {...register("nearestLandmark")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">نوع السكن</label>
                      <select {...register("housingType")} className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right">
                        <option value="" className="bg-slate-950 text-white">-- اختر --</option>
                        <option value="بيت" className="bg-slate-950 text-white">بيت</option>
                        <option value="شقة" className="bg-slate-950 text-white">شقة</option>
                        <option value="دكان" className="bg-slate-950 text-white">دكان</option>
                        <option value="خيمة" className="bg-slate-950 text-white">خيمة</option>
                        <option value="صندقة" className="bg-slate-950 text-white">صندقة</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">حالة السكن</label>
                      <select {...register("housingCondition")} className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right">
                        <option value="" className="bg-slate-950 text-white">-- اختر --</option>
                        <option value="ممتاز" className="bg-slate-950 text-white">ممتاز</option>
                        <option value="جيد" className="bg-slate-950 text-white">جيد</option>
                        <option value="مقبول" className="bg-slate-950 text-white">مقبول</option>
                        <option value="متهالك" className="bg-slate-950 text-white">متهالك</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">الإيجار الشهري (إن وجد)</label>
                      <Input type="number" placeholder="مثال: 50000" className="bg-slate-900/40 border-border text-white" {...register("rentAmount")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">مصدر المياه الرئيسي</label>
                      <Input placeholder="مشروع، وايتات، سبيل..." className="bg-slate-900/40 border-border text-white" {...register("waterSource")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">مصدر الإضاءة الرئيسي</label>
                      <Input placeholder="كهرباء، منظومة شمسية، اشتراك..." className="bg-slate-900/40 border-border text-white" {...register("electricitySource")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">ملاحظات سكنية إضافية</label>
                      <Input placeholder="أية ملاحظات بخصوص السكن والخدمات" className="bg-slate-900/40 border-border text-white" {...register("housingNotes")} />
                    </div>
                  </div>

                  <Separator className="my-2 border-border/40" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-end gap-2">
                      <label className="text-xs font-bold text-slate-300 cursor-pointer" htmlFor="isDisplaced">هل الأسرة نازحة؟</label>
                      <input type="checkbox" id="isDisplaced" className="rounded border-slate-700 bg-slate-900/40 text-emerald-500 h-4 w-4" {...register("isDisplaced")} />
                    </div>

                    {isDisplacedWatched && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-3 bg-slate-900/30 rounded-xl border border-border/40 animate-in fade-in duration-300">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">محافظة النزوح الأصلية</label>
                          <Input placeholder="من أين نزحت الأسرة" className="bg-slate-900/40 border-border text-white" {...register("displacementGov")} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">مديرية النزوح الأصلية</label>
                          <Input placeholder="المديرية الأصلية" className="bg-slate-900/40 border-border text-white" {...register("displacementDist")} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">تاريخ النزوح</label>
                          <Input placeholder="مثال: مارس 2024" className="bg-slate-900/40 border-border text-white" {...register("displacementDate")} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">سبب النزوح الرئيسي</label>
                          <Input placeholder="سبب النزوح" className="bg-slate-900/40 border-border text-white" {...register("displacementReason")} />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 4) المعيشة والمالية */}
                <TabsContent value="financial" className="space-y-4 outline-none">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    الوضع الاقتصادي ومصادر الدخل
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">مصدر الدخل الرئيسي للأسرة</label>
                      <Input placeholder="راتب، عمل بالأجر اليومي..." className="bg-slate-900/40 border-border text-white" {...register("notes")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">متوسط الدخل الشهري للأسرة</label>
                      <Input type="number" placeholder="المبلغ بالريال" className="bg-slate-900/40 border-border text-white" {...register("monthlyIncome")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">تصنيف فقر الأسرة</label>
                      <select {...register("povertyLevel")} className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right">
                        <option value="" className="bg-slate-950 text-white">-- اختر --</option>
                        <option value="SEVERE" className="bg-slate-950 text-white">شديد الاحتياج</option>
                        <option value="MEDIUM" className="bg-slate-950 text-white">متوسط الاحتياج</option>
                        <option value="LOW" className="bg-slate-950 text-white">مستقر نسبيًا</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-end gap-2 p-1">
                      <label className="text-xs font-bold text-slate-300 cursor-pointer" htmlFor="hasOrphans">هل الأسرة تعول أيتام؟</label>
                      <input type="checkbox" id="hasOrphans" className="rounded border-slate-700 bg-slate-900/40 text-emerald-500 h-4 w-4" {...register("hasOrphans")} />
                    </div>
                    {hasOrphansWatched && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">عدد الأيتام في الأسرة</label>
                        <Input type="number" placeholder="عدد الأيتام" className="bg-slate-900/40 border-border text-white" {...register("orphansCount")} />
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 p-1">
                      <label className="text-xs font-bold text-slate-300 cursor-pointer" htmlFor="hasWidow">هل تعول الأسرة أرملة؟</label>
                      <input type="checkbox" id="hasWidow" className="rounded border-slate-700 bg-slate-900/40 text-emerald-500 h-4 w-4" {...register("hasWidow")} />
                    </div>
                    <div className="flex items-center justify-end gap-2 p-1">
                      <label className="text-xs font-bold text-slate-300 cursor-pointer" htmlFor="hasUnemployed">هل يوجد بالأسرة عاطلون عن العمل؟</label>
                      <input type="checkbox" id="hasUnemployed" className="rounded border-slate-700 bg-slate-900/40 text-emerald-500 h-4 w-4" {...register("hasUnemployed")} />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-300">أهم الاحتياجات الحالية للأسرة</label>
                      <Input placeholder="غذاء، علاج، إيواء..." className="bg-slate-900/40 border-border text-white" {...register("urgentNeeds")} />
                    </div>
                  </div>

                  <Separator className="my-2 border-border/40" />
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    بيانات الاستلام المالي والحسابات البنكية
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">طريقة استلام المساعدات</label>
                      <Input placeholder="بنك الكريمي، تسليم يدا بيد..." className="bg-slate-900/40 border-border text-white" {...register("deliveryMethod")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">رقم حساب الكريمي (بالريال اليمني)</label>
                      <Input placeholder="رقم حساب الكريمي (يمني)" className="bg-slate-900/40 border-border text-white" {...register("kuraimiAccountYemeni")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">رقم حساب الكريمي (بالريال السعودي)</label>
                      <Input placeholder="رقم حساب الكريمي (سعودي)" className="bg-slate-900/40 border-border text-white" {...register("kuraimiAccountSaudi")} />
                    </div>
                  </div>

                  <Separator className="my-2 border-border/40" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-end gap-2">
                      <label className="text-xs font-bold text-slate-300 cursor-pointer" htmlFor="receivedAidBefore">هل استلمت الأسرة مساعدات سابقاً؟</label>
                      <input type="checkbox" id="receivedAidBefore" className="rounded border-slate-700 bg-slate-900/40 text-emerald-500 h-4 w-4" {...register("receivedAidBefore")} />
                    </div>

                    {receivedAidWatched && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 p-3 bg-slate-900/30 rounded-xl border border-border/40 animate-in fade-in duration-300">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">الجهة المانحة السابقة</label>
                          <Input placeholder="المنظمة المانحة" className="bg-slate-900/40 border-border text-white" {...register("aidDonor")} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">نوع المساعدة السابقة</label>
                          <Input placeholder="عيني، نقدي..." className="bg-slate-900/40 border-border text-white" {...register("aidType")} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">تاريخ آخر مساعدة</label>
                          <Input placeholder="مثال: 2024" className="bg-slate-900/40 border-border text-white" {...register("lastAidDate")} />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 5) المعرف والوصي */}
                <TabsContent value="referrer" className="space-y-4 outline-none">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Info className="h-4 w-4" />
                    بيانات المعرّف الاجتماعي للأسرة
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">اسم المعرّف الرباعي</label>
                      <Input placeholder="اسم عاقل الحارة، الشيخ..." className="bg-slate-900/40 border-border text-white" {...register("referrerName")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">صلة قرابة المعرّف بالأسرة</label>
                      <Input placeholder="مثال: عاقل الحارة، جار، قريب..." className="bg-slate-900/40 border-border text-white" {...register("referrerRelation")} />
                    </div>
                  </div>

                  <Separator className="my-2 border-border/40" />
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    بيانات الوصي البديل / الحاضن (إن وجد)
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">اسم الوصي الكامل</label>
                      <Input placeholder="اسم الوصي أو الحاضن البديل" className="bg-slate-900/40 border-border text-white" {...register("guardianName")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">صلة قرابته بالأسرة</label>
                      <Input placeholder="عم، خال، جد..." className="bg-slate-900/40 border-border text-white" {...register("guardianRelation")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">رقم هاتف الوصي</label>
                      <Input placeholder="رقم هاتف الوصي للاتصال" className="bg-slate-900/40 border-border text-white" {...register("guardianPhone")} />
                    </div>
                  </div>

                  <Separator className="my-2 border-border/40" />
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ملاحظات عامة وتوصيات الباحث الميداني</label>
                    <textarea
                      rows={4}
                      placeholder="سجل أية تفاصيل، انطباعات، أو توصيات إضافية عن وضع المعيشة..."
                      {...register("notes")}
                      className="flex w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                    />
                  </div>
                </TabsContent>

                {/* 6) المرفقات والوثائق */}
                <TabsContent value="attachments" className="space-y-4 outline-none animate-in fade-in duration-300">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4" />
                    المستندات والمرفقات المطلوبة
                  </h4>
                  
                  {/* نموذج إضافة مرفق */}
                  <div className="rounded-xl border border-border bg-slate-900/20 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300">نوع الوثيقة</label>
                        <select 
                          className="flex h-10 w-full rounded-xl border border-border bg-slate-900/40 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right"
                          value={newFileType} 
                          onChange={e => setNewFileType(e.target.value)}
                        >
                          <option value="NATIONAL_ID" className="bg-slate-950 text-white">صورة الهوية ( للزوج والزوجة)</option>
                          <option value="OTHER" className="bg-slate-950 text-white">كرت العائلة ( في حال عدم وجود هوية )</option>
                          <option value="MEDICAL_REPORT" className="bg-slate-950 text-white">تقارير طبية (إن وجدت)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300">وصف الملف (اختياري)</label>
                        <Input 
                          placeholder="مثال: صورة هوية الزوجة" 
                          className="bg-slate-900/40 border-border text-white" 
                          value={newFileDesc} 
                          onChange={e => setNewFileDesc(e.target.value)} 
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-slate-900/40 py-6 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-all duration-200 cursor-pointer"
                    >
                      <Upload className="h-6 w-6" />
                      <span className="text-xs font-bold">اضغط هنا لاختيار وتحميل ملف</span>
                      <span className="text-[10px] text-slate-500">مسموح بـ JPG, JPEG, PNG, PDF (الحد الأقصى 5 ميغابايت)</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* قائمة الملفات المعلقة */}
                  {pendingFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400">الملفات المختارة للرفع ({pendingFiles.length})</p>
                      {pendingFiles.map((pf, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-xl border border-border bg-slate-900/40 p-3">
                          {pf.preview ? (
                            <button type="button" onClick={() => setLightboxSrc(pf.preview || null)} className="flex-shrink-0">
                              <img src={pf.preview} alt="" className="h-10 w-10 rounded-lg object-cover border border-slate-700" />
                            </button>
                          ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-border">
                              <FileText className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-xs font-bold text-white truncate">{pf.file.name}</p>
                            <p className="text-[10px] text-emerald-400">
                              {pf.documentType === "NATIONAL_ID" ? "صورة الهوية" : pf.documentType === "MEDICAL_REPORT" ? "تقارير طبية" : "كرت العائلة / أخرى"}
                            </p>
                            {pf.description && <p className="text-[10px] text-slate-500 truncate">{pf.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => setPendingFiles(p => {
                              const removed = p[idx]
                              if (removed.preview) URL.revokeObjectURL(removed.preview)
                              return p.filter((_, i) => i !== idx)
                            })}
                            className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* قائمة المرفقات المرفوعة مسبقاً */}
                  {isEditMode && existingAttachments.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Separator className="my-2 border-border/40" />
                      <p className="text-xs font-bold text-slate-300">الوثائق الرسمية المرفوعة مسبقاً ({existingAttachments.length})</p>
                      <div className="grid grid-cols-1 gap-2">
                        {existingAttachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-slate-900/40 p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-border">
                                <FileText className="h-4 w-4 text-emerald-400" />
                              </div>
                              <div className="text-right">
                                <a href={att.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-200 hover:underline hover:text-white truncate max-w-[200px] block">
                                  {att.fileName}
                                </a>
                                <p className="text-[10px] text-emerald-400/80">
                                  {att.documentType === "NATIONAL_ID" ? "صورة الهوية" : att.documentType === "MEDICAL_REPORT" ? "تقارير طبية" : "كرت العائلة / أخرى"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              >
                                <a href={att.fileUrl} target="_blank" rel="noreferrer">
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (confirm("هل أنت متأكد من رغبتك في حذف هذا المرفق نهائياً؟")) {
                                    const res = await deleteAttachment(att.id)
                                    if (res.success) {
                                      setExistingAttachments(prev => prev.filter(x => x.id !== att.id))
                                    } else {
                                      alert(res.error || "فشل حذف المرفق")
                                    }
                                  }
                                }}
                                className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lightboxSrc && (
                    <div
                      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                      onClick={() => setLightboxSrc(null)}
                    >
                      <img src={lightboxSrc} alt="Lightbox Preview" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain border border-slate-700 shadow-2xl" />
                    </div>
                  )}
                </TabsContent>

              </fieldset>
            </Tabs>
          </div>

          {/* Actions Footer */}
          <div className="p-4 border-t border-border flex-shrink-0 flex items-center justify-end gap-2 bg-slate-950/80">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
              className="rounded-xl px-5 border-border bg-slate-900/40 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading || userRole === "VIEWER"}
              className="btn-premium px-6 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ ملف الأسرة</span>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
