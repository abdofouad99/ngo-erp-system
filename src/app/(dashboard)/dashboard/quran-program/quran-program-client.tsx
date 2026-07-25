"use client"
import { useState, useMemo } from "react"
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Users,
  Search,
  Building2,
  FileSpreadsheet,
  Award,
  BookMarked,
  CheckCircle2,
  Eye,
  X,
  Phone,
  MapPin,
  Calendar,
  Layers,
  HeartHandshake
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Hafiz {
  id: string
  fullName: string
  projectNo?: string
  mumaiyo?: string
  saudiAccount?: string
  gender: string
  nationality: string
  siblingsCount?: string
  birthdate?: string
  country: string
  governorate: string
  district: string
  city: string
  village?: string
  nationalId?: string
  educationalStage?: string
  grade?: string
  gradeEvaluation?: string
  quranMemorized?: string
  quranTo?: string
  memorizationLevel?: string
  psychologicalStatus?: string
  healthStatus?: string
  employmentStatus?: string
  occupation?: string
  schoolOrUniversity?: string
  quranCircle?: string
  quranCenter?: string
  joinDate?: string
  specialization?: string
  phoneNumber?: string
  sponsor: string
}

interface Muhaffiz {
  id: string
  fullName: string
  gender: string
  nationality: string
  birthdate?: string
  country: string
  governorate: string
  city: string
  village?: string
  nationalId?: string
  universityQualification?: string
  quranMemorization?: string
  riwayatCount?: string
  psychologicalStatus?: string
  healthStatus?: string
  educationalQualification?: string
  socialStatus?: string
  monthlyCirclesCount?: string
  circleLocation?: string
  sponsor: string
}

interface Daiyah {
  id: string
  fullName: string
  nationality: string
  birthdate?: string
  governorate: string
  city: string
  nationalId?: string
  qualification?: string
  specialization?: string
  certificates?: string
  quranMemorization?: string
  healthStatus?: string
  notes?: string
  sponsor: string
}

interface ProgramData {
  summary: {
    daiyah_count: number
    huffaz_count: number
    muhaffiz_count: number
    sponsor: string
  }
  huffaz: Hafiz[]
  muhaffiz: Muhaffiz[]
  daiyah: Daiyah[]
}

export function QuranProgramClient({ initialData }: { initialData: ProgramData }) {
  const [activeTab, setActiveTab] = useState<"huffaz" | "muhaffiz" | "daiyah">("huffaz")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)

  // Filtered Huffaz
  const filteredHuffaz = useMemo(() => {
    if (!searchQuery.trim()) return initialData.huffaz
    const q = searchQuery.toLowerCase()
    return initialData.huffaz.filter(
      (h) =>
        h.fullName.toLowerCase().includes(q) ||
        (h.mumaiyo && h.mumaiyo.includes(q)) ||
        (h.projectNo && h.projectNo.includes(q)) ||
        (h.quranCenter && h.quranCenter.toLowerCase().includes(q)) ||
        (h.quranCircle && h.quranCircle.toLowerCase().includes(q)) ||
        (h.district && h.district.toLowerCase().includes(q))
    )
  }, [initialData.huffaz, searchQuery])

  // Filtered Muhaffiz
  const filteredMuhaffiz = useMemo(() => {
    if (!searchQuery.trim()) return initialData.muhaffiz
    const q = searchQuery.toLowerCase()
    return initialData.muhaffiz.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.universityQualification && m.universityQualification.toLowerCase().includes(q)) ||
        (m.circleLocation && m.circleLocation.toLowerCase().includes(q))
    )
  }, [initialData.muhaffiz, searchQuery])

  // Filtered Daiyah
  const filteredDaiyah = useMemo(() => {
    if (!searchQuery.trim()) return initialData.daiyah
    const q = searchQuery.toLowerCase()
    return initialData.daiyah.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        (d.specialization && d.specialization.toLowerCase().includes(q)) ||
        (d.qualification && d.qualification.toLowerCase().includes(q))
    )
  }, [initialData.daiyah, searchQuery])

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-[#00B2A9]/10 text-[#00B2A9] border-[#00B2A9]/30 font-medium px-3 py-0.5 text-xs rounded-full">
              الجهة الممولة: جمعية الصفا الخيرية - الكويت 🇰🇼
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C355E] dark:text-white flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-[#00B2A9]" />
            برنامج كفالة ورعاية القرآن الكريم والدعاة
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            منظومة متكاملة لبيانات الحفاظ، المعلمين، والدعاة المكفولين والمسجلين رسمياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 text-[#1C355E] dark:text-slate-200 border-slate-300 dark:border-slate-700"
            onClick={() => alert("جاري تصدير التقرير إلى Excel...")}
          >
            <FileSpreadsheet className="h-4 w-4 text-[#00B2A9]" />
            تصدير كشف الصفا Excel
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Huffaz */}
        <Card
          onClick={() => setActiveTab("huffaz")}
          className={`cursor-pointer transition-all duration-200 border-2 ${
            activeTab === "huffaz"
              ? "border-[#00B2A9] shadow-md bg-white dark:bg-slate-900"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300"
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">حُفّاظ القرآن (الطلاب)</p>
              <div className="text-3xl font-extrabold text-[#1C355E] dark:text-white mt-1">
                {initialData.summary.huffaz_count}
              </div>
              <p className="text-xs text-[#00B2A9] font-medium mt-1">طالب وطالبة مكفولين</p>
            </div>
            <div className="p-3 bg-[#00B2A9]/10 rounded-2xl text-[#00B2A9]">
              <Award className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Muhaffiz */}
        <Card
          onClick={() => setActiveTab("muhaffiz")}
          className={`cursor-pointer transition-all duration-200 border-2 ${
            activeTab === "muhaffiz"
              ? "border-[#00B2A9] shadow-md bg-white dark:bg-slate-900"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300"
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">المحفّظون والمعلمون</p>
              <div className="text-3xl font-extrabold text-[#1C355E] dark:text-white mt-1">
                {initialData.summary.muhaffiz_count}
              </div>
              <p className="text-xs text-[#00B2A9] font-medium mt-1">معلم مجاز بالروايات</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Daiyah */}
        <Card
          onClick={() => setActiveTab("daiyah")}
          className={`cursor-pointer transition-all duration-200 border-2 ${
            activeTab === "daiyah"
              ? "border-[#00B2A9] shadow-md bg-white dark:bg-slate-900"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300"
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">الدعاة والعلماء</p>
              <div className="text-3xl font-extrabold text-[#1C355E] dark:text-white mt-1">
                {initialData.summary.daiyah_count}
              </div>
              <p className="text-xs text-[#00B2A9] font-medium mt-1">حملة ماجستير ودكتوراه</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400">
              <Sparkles className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Centers & Circles */}
        <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">مراكز وحلقات التحفيظ</p>
              <div className="text-3xl font-extrabold text-[#1C355E] dark:text-white mt-1">
                نشط 100%
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                مركز النور - جامع النور
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Filter & Tabs ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Custom Tab Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab("huffaz")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all ${
                activeTab === "huffaz"
                  ? "bg-white dark:bg-slate-900 text-[#1C355E] dark:text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <BookMarked className="h-4 w-4 text-[#00B2A9]" />
              حُفّاظ القرآن الكريم ({initialData.huffaz.length})
            </button>

            <button
              onClick={() => setActiveTab("muhaffiz")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all ${
                activeTab === "muhaffiz"
                  ? "bg-white dark:bg-slate-900 text-[#1C355E] dark:text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-blue-500" />
              المحفّظون ({initialData.muhaffiz.length})
            </button>

            <button
              onClick={() => setActiveTab("daiyah")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all ${
                activeTab === "daiyah"
                  ? "bg-white dark:bg-slate-900 text-[#1C355E] dark:text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              الدعاة والعلماء ({initialData.daiyah.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="بحث بالاسم، الكود، الحلقة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
        </div>

        {/* ── Tab 1: Huffaz (Memorizers) Table ───────────────────── */}
        {activeTab === "huffaz" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-xs md:text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[#1C355E] dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center">#</th>
                  <th className="p-3">اسم الحافظ / الحافظة</th>
                  <th className="p-3">الجنس</th>
                  <th className="p-3">رقم المميز / المشروع</th>
                  <th className="p-3">المحافظة / المديرية</th>
                  <th className="p-3">مستوى الحفظ</th>
                  <th className="p-3">المراكز والحلقة القرآنية</th>
                  <th className="p-3">المرحلة والصف</th>
                  <th className="p-3 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredHuffaz.map((h, index) => (
                  <tr
                    key={h.id || index}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#1C355E] dark:text-white">{h.fullName}</div>
                      {h.phoneNumber && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 dir-ltr justify-end">
                          <span>{h.phoneNumber}</span>
                          <Phone className="h-3 w-3 text-[#00B2A9]" />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={
                          h.gender === "FEMALE"
                            ? "bg-pink-500/10 text-pink-600 border-pink-300 dark:border-pink-800"
                            : "bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-800"
                        }
                      >
                        {h.gender === "FEMALE" ? "أنثى" : "ذكر"}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs text-[#00B2A9] font-bold">
                      {h.mumaiyo || h.projectNo || "—"}
                    </td>
                    <td className="p-3 text-xs">
                      {h.governorate} - {h.district}
                    </td>
                    <td className="p-3">
                      <Badge className="bg-[#00B2A9]/10 text-[#00B2A9] border-[#00B2A9]/30">
                        {h.quranMemorized || "حافظ"}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{h.quranCenter || "—"}</div>
                      <div className="text-slate-400 text-xs">{h.quranCircle}</div>
                    </td>
                    <td className="p-3 text-xs">
                      {h.educationalStage || "—"} {h.grade && `(${h.grade})`}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-[#00B2A9] hover:bg-[#00B2A9]/10"
                        onClick={() => setSelectedRecord({ type: "hafiz", data: h })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 2: Muhaffiz (Teachers) Table ───────────────────── */}
        {activeTab === "muhaffiz" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-xs md:text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[#1C355E] dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center">#</th>
                  <th className="p-3">اسم المحفّظ (المعلم)</th>
                  <th className="p-3">الجنسية</th>
                  <th className="p-3">المؤهل الجامعي</th>
                  <th className="p-3">مقدار الحفظ والقراءات</th>
                  <th className="p-3">عدد الحلقات شهرياً</th>
                  <th className="p-3">عنوان عقد الحلقات</th>
                  <th className="p-3 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredMuhaffiz.map((m, index) => (
                  <tr key={m.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                    <td className="p-3 font-bold text-[#1C355E] dark:text-white">{m.fullName}</td>
                    <td className="p-3">{m.nationality}</td>
                    <td className="p-3 text-blue-600 dark:text-blue-400 font-semibold">
                      {m.universityQualification || "جامعي"}
                    </td>
                    <td className="p-3 text-xs">
                      <div>{m.quranMemorization}</div>
                      {m.riwayatCount && (
                        <span className="text-[#00B2A9] font-medium">({m.riwayatCount} روايات)</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {m.monthlyCirclesCount || "1"} حلقات
                    </td>
                    <td className="p-3 text-xs text-slate-500">{m.circleLocation || "—"}</td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-[#00B2A9] hover:bg-[#00B2A9]/10"
                        onClick={() => setSelectedRecord({ type: "muhaffiz", data: m })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 3: Daiyah (Preachers) Table ────────────────────── */}
        {activeTab === "daiyah" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-xs md:text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[#1C355E] dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center">#</th>
                  <th className="p-3">اسم الداعية / العالم</th>
                  <th className="p-3">المؤهل العلمي</th>
                  <th className="p-3">التخصص الدقيق</th>
                  <th className="p-3">المحافظة والمدينة</th>
                  <th className="p-3">مقدار الحفظ</th>
                  <th className="p-3">الشهادات العلمية والشرعية</th>
                  <th className="p-3 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredDaiyah.map((d, index) => (
                  <tr key={d.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                    <td className="p-3 font-bold text-[#1C355E] dark:text-white">{d.fullName}</td>
                    <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">
                      {d.qualification || "دكتوراه / ماجستير"}
                    </td>
                    <td className="p-3">{d.specialization || "علوم القرآن وأصول الفقه"}</td>
                    <td className="p-3 text-xs">
                      {d.governorate} - {d.city}
                    </td>
                    <td className="p-3">
                      <Badge className="bg-[#00B2A9]/10 text-[#00B2A9] border-[#00B2A9]/30">
                        {d.quranMemorization}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-slate-500 max-w-xs truncate">{d.certificates || "—"}</td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-[#00B2A9] hover:bg-[#00B2A9]/10"
                        onClick={() => setSelectedRecord({ type: "daiyah", data: d })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Record Details Modal / Drawer ───────────────────────── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#00B2A9]/10 text-[#00B2A9] font-bold px-3 py-1">
                  {selectedRecord.type === "hafiz"
                    ? "بطاقة حافظ القرآن"
                    : selectedRecord.type === "muhaffiz"
                    ? "بطاقة محفّظ معلم"
                    : "بطاقة داعية وعالم"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setSelectedRecord(null)}
              >
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            {/* Content Details Grid */}
            <div className="space-y-4 text-right">
              <h2 className="text-xl font-bold text-[#1C355E] dark:text-white">
                {selectedRecord.data.fullName}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm">
                {Object.entries(selectedRecord.data).map(([key, val]) => {
                  if (!val || key === "id") return null
                  const labels: Record<string, string> = {
                    fullName: "الاسم الكامل",
                    projectNo: "رقم المشروع",
                    mumaiyo: "رقم المميز",
                    saudiAccount: "رقم الحساب السعودي",
                    gender: "الجنس",
                    nationality: "الجنسية",
                    birthdate: "تاريخ الميلاد",
                    country: "الدولة",
                    governorate: "المحافظة",
                    district: "المديرية",
                    city: "المدينة",
                    village: "القرية",
                    nationalId: "رقم الهوية",
                    educationalStage: "المرحلة الدراسية",
                    grade: "الصف الدراسي",
                    gradeEvaluation: "التقدير الدراسي",
                    quranMemorized: "مقدار الحفظ",
                    quranTo: "حفظ القرآن إلى سورة",
                    memorizationLevel: "مستوى الحفظ",
                    psychologicalStatus: "الحالة النفسية",
                    healthStatus: "الحالة الصحية",
                    occupation: "المهنة",
                    schoolOrUniversity: "المدرسة / الجامعة",
                    quranCircle: "حلقة التحفيظ",
                    quranCenter: "مركز التحفيظ",
                    joinDate: "تاريخ الالتحاق بالمركز",
                    specialization: "التخصص العلمي",
                    phoneNumber: "رقم الهاتف والتواصل",
                    sponsor: "الجهة الممولة الكافلة",
                    universityQualification: "المؤهل الجامعي",
                    riwayatCount: "عدد الروايات المجاز بها",
                    educationalQualification: "المؤهل الدراسي",
                    socialStatus: "الحالة الاجتماعية",
                    monthlyCirclesCount: "عدد حلقات التحفيظ شهرياً",
                    circleLocation: "عنوان عقد الحلقات",
                    qualification: "المؤهل العلمي العالي",
                    certificates: "الشهادات العلمية والشرعية",
                    quranMemorization: "حفظ القرآن الكريم",
                    notes: "ملاحظات إضافية"
                  }

                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="text-slate-400 text-xs">{labels[key] || key}</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {String(val)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                className="bg-[#1C355E] hover:bg-[#1C355E]/90 text-white font-bold px-6"
                onClick={() => setSelectedRecord(null)}
              >
                إغلاق البطاقة
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
