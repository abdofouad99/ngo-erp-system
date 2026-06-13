"use client"

import { useState, useEffect } from "react"
import { getGeoStructure, createGovernorate, createDistrict, createSubDistrict, getSystemStats, getUsersList, createSystemUser, toggleUserStatus } from "@/app/actions/settings-actions"
import { getAllTagsAdmin, createTag, toggleTag, deleteTag, seedInitialTags } from "@/app/actions/tag-actions"
import { TagCategory, Role } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Settings,
  Map,
  Plus,
  Info,
  Server,
  Users,
  Heart,
  Briefcase,
  Coins,
  FileText,
  Activity,
  CheckCircle,
  Database,
  MapPin,
  Tag,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("geo")
  const [geoStructure, setGeoStructure] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Tags state
  const [allTags, setAllTags] = useState<any[]>([])
  const [newTagName, setNewTagName] = useState("")
  const [newTagCategory, setNewTagCategory] = useState<TagCategory>("ORPHAN_OPERATIONAL_STATUS" as TagCategory)
  const [newTagColor, setNewTagColor] = useState("#6366f1")
  const [seedingTags, setSeedingTags] = useState(false)

  // Users state
  const [usersList, setUsersList] = useState<any[]>([])
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<Role>("MARKETER" as Role)

  // Form states
  const [govName, setGovName] = useState("")
  const [distName, setDistName] = useState("")
  const [distGovId, setDistGovId] = useState("")
  const [subName, setSubName] = useState("")
  const [subGovId, setSubGovId] = useState("")
  const [subDistId, setSubDistId] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  const loadData = async () => {
    setLoading(true)
    const [geoRes, statsRes, tagsRes, usersRes] = await Promise.all([
      getGeoStructure(),
      getSystemStats(),
      getAllTagsAdmin(),
      getUsersList(),
    ])
    if (geoRes.success) setGeoStructure(geoRes.governorates || [])
    if (statsRes.success) setStats(statsRes.stats || null)
    if (tagsRes.success) setAllTags(tagsRes.tags || [])
    if (usersRes.success) setUsersList(usersRes.users || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateGov = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!govName) return
    setSubmitting(true)
    const res = await createGovernorate({ nameAr: govName })
    if (res.success) {
      setGovName("")
      setMessage({ text: "تمت إضافة المحافظة بنجاح!", type: "success" })
      loadData()
    } else {
      setMessage({ text: res.error || "فشل إضافة المحافظة", type: "error" })
    }
    setSubmitting(false)
  }

  const handleCreateDist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!distName || !distGovId) return
    setSubmitting(true)
    const res = await createDistrict({ nameAr: distName, governorateId: Number(distGovId) })
    if (res.success) {
      setDistName("")
      setMessage({ text: "تمت إضافة المديرية بنجاح!", type: "success" })
      loadData()
    } else {
      setMessage({ text: res.error || "فشل إضافة المديرية", type: "error" })
    }
    setSubmitting(false)
  }

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subName || !subDistId) return
    setSubmitting(true)
    const res = await createSubDistrict({ nameAr: subName, districtId: Number(subDistId) })
    if (res.success) {
      setSubName("")
      setMessage({ text: "تمت إضافة العزلة/الحي بنجاح!", type: "success" })
      loadData()
    } else {
      setMessage({ text: res.error || "فشل إضافة العزلة/الحي", type: "error" })
    }
    setSubmitting(false)
  }

  // Selected Districts for the sub-district form based on selected Governorate
  const getDistrictsForGov = (govId: string) => {
    if (!govId) return []
    const gov = geoStructure.find((g) => g.id === Number(govId))
    return gov ? gov.districts : []
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto text-right" dir="rtl">
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-500 animate-spin-slow" />
          إعدادات النظام والإدارة العامة
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          إدارة الملف الشخصي، إضافة وتعديل النطاقات الجغرافية، والتحقق من صحة النظام وإحصائياته.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-lg text-xs font-bold border ${
            message.type === "success"
              ? "bg-emerald-950/40 text-emerald-450 border-emerald-900/50"
              : "bg-red-950/40 text-red-400 border-red-900/50"
          }`}
        >
          {message.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-950 p-1 rounded-xl w-full sm:w-auto flex justify-start gap-1 overflow-x-auto border border-slate-800/80">
          <TabsTrigger value="geo" className="rounded-lg text-xs font-bold gap-1.5 px-4 py-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Map className="h-4 w-4 text-slate-400" />
            إدارة المناطق الجغرافية
          </TabsTrigger>
          <TabsTrigger value="tags" className="rounded-lg text-xs font-bold gap-1.5 px-4 py-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Tag className="h-4 w-4 text-indigo-400" />
            إدارة التصنيفات
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg text-xs font-bold gap-1.5 px-4 py-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Users className="h-4 w-4 text-emerald-400" />
            إدارة المستخدمين والمسوقين
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg text-xs font-bold gap-1.5 px-4 py-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <User className="h-4 w-4 text-slate-400" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg text-xs font-bold gap-1.5 px-4 py-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Server className="h-4 w-4 text-slate-400" />
            تشخيص وإحصائيات النظام
          </TabsTrigger>
        </TabsList>

        {/* ── TABS CONTENT: GEO MANAGEMENT ── */}
        <TabsContent value="geo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create Governorate */}
            <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-emerald-500" />
                  إضافة محافظة جديدة
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-400">إنشاء تقسيم إداري رئيسي (محافظة).</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGov} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350">اسم المحافظة بالعربية</label>
                    <Input
                      placeholder="مثال: صنعاء، عدن، تعز..."
                      value={govName}
                      onChange={(e) => setGovName(e.target.value)}
                      className="h-9 text-xs rounded-lg bg-slate-900/60 border-slate-800/80 text-white placeholder-slate-500 focus-visible:ring-emerald-500 focus-visible:bg-slate-900/90 focus-visible:border-slate-700 transition-all"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || !govName}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs shadow-md shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    حفظ المحافظة
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create District */}
            <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-emerald-500" />
                  إضافة مديرية جديدة
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-400">ربط مديرية جديدة بمحافظة مسجلة.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDist} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350">اختر المحافظة التابعة لها</label>
                    <select
                      value={distGovId}
                      onChange={(e) => setDistGovId(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold focus-visible:outline-none text-right text-slate-200 hover:border-slate-700 transition-all"
                      required
                    >
                      <option className="bg-slate-950 text-white" value="">-- اختر محافظة --</option>
                      {geoStructure.map((g) => (
                        <option className="bg-slate-950 text-white" key={g.id} value={g.id}>{g.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350">اسم المديرية</label>
                    <Input
                      placeholder="مثال: مديرية السبعين، مديرية المعلا..."
                      value={distName}
                      onChange={(e) => setDistName(e.target.value)}
                      className="h-9 text-xs rounded-lg bg-slate-900/60 border-slate-800/80 text-white placeholder-slate-500 focus-visible:ring-emerald-500 focus-visible:bg-slate-900/90 focus-visible:border-slate-700 transition-all"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || !distName || !distGovId}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs shadow-md shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    حفظ المديرية
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create Sub-District / Village */}
            <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-emerald-500" />
                  إضافة عزلة أو حي سكني
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-400">ربط حي أو قرية بمديرية معينة لتسهيل الاختيار.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSub} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-350">اختر المحافظة</label>
                      <select
                        value={subGovId}
                        onChange={(e) => {
                          setSubGovId(e.target.value)
                          setSubDistId("")
                        }}
                        className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] font-semibold focus-visible:outline-none text-right text-slate-200 hover:border-slate-700 transition-all"
                        required
                      >
                        <option className="bg-slate-950 text-white" value="">-- اختر --</option>
                        {geoStructure.map((g) => (
                          <option className="bg-slate-950 text-white" key={g.id} value={g.id}>{g.nameAr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-350">اختر المديرية</label>
                      <select
                        value={subDistId}
                        onChange={(e) => setSubDistId(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] font-semibold focus-visible:outline-none text-right text-slate-200 hover:border-slate-700 transition-all"
                        disabled={!subGovId}
                        required
                      >
                        <option className="bg-slate-950 text-white" value="">-- اختر --</option>
                        {getDistrictsForGov(subGovId).map((d: any) => (
                          <option className="bg-slate-950 text-white" key={d.id} value={d.id}>{d.nameAr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350">اسم الحي / العزلة / القرية</label>
                    <Input
                      placeholder="مثال: حي الأصبحي، قرية الحجر..."
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      className="h-9 text-xs rounded-lg bg-slate-900/60 border-slate-800/80 text-white placeholder-slate-500 focus-visible:ring-emerald-500 focus-visible:bg-slate-900/90 focus-visible:border-slate-700 transition-all"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || !subName || !subDistId}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs shadow-md shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    حفظ الحي/العزلة
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Geographical Tree View */}
          <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <MapPin className="h-4.5 w-4.5 text-emerald-500" />
                هيكل التقسيم الجغرافي النشط ({geoStructure.length} محافظة)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-6 text-xs text-slate-450">جاري تحميل الهيكل الجغرافي...</div>
              ) : geoStructure.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-450 italic">لا توجد مناطق جغرافية مسجلة بعد.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {geoStructure.map((gov) => (
                    <div key={gov.id} className="border border-slate-800 bg-slate-900/30 rounded-xl p-4 space-y-2">
                      <div className="font-bold text-slate-200 border-b border-slate-850 pb-1 flex justify-between items-center text-xs">
                        <span>محافظة {gov.nameAr}</span>
                        <Badge className="bg-slate-800 text-slate-300 border border-slate-700/50 hover:bg-slate-800 text-[9px] font-extrabold">
                          {gov.districts?.length || 0} مديرية
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {gov.districts?.map((d: any) => (
                          <div key={d.id} className="text-[11px] bg-slate-950/40 p-2 rounded-lg border border-slate-850 space-y-1">
                            <div className="font-bold text-slate-200 flex justify-between">
                              <span>مديرية: {d.nameAr}</span>
                              <span className="text-slate-500 text-[9px]">{d.subDistricts?.length || 0} حي</span>
                            </div>
                            {d.subDistricts && d.subDistricts.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1 border-t border-dashed border-slate-850">
                                {d.subDistricts.map((s: any) => (
                                  <span key={s.id} className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] text-slate-400 font-semibold border border-slate-800">
                                    {s.nameAr}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TABS CONTENT: PROFILE ── */}
        <TabsContent value="profile">
          <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <User className="h-4.5 w-4.5 text-emerald-500" />
                بيانات حساب المستخدم النشط
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-800/85 pb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                  م
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">مشرف النظام العام</h4>
                  <Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 font-bold text-[10px]">
                    صلاحية: مسؤول النظام الكامل (ADMIN)
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">البريد الإلكتروني</span>
                  <span className="font-bold text-slate-200">admin@ngo.com</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">حالة الحساب</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> نشط وموثق
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">تاريخ الانضمام</span>
                  <span className="font-bold text-slate-200">10 يونيو 2026</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-semibold">اللغة الافتراضية</span>
                  <span className="font-bold text-slate-200">العربية (RTL)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TABS CONTENT: SYSTEM DIAGNOSTICS ── */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* System Diagnostics Metrics */}
            <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-emerald-500" />
                  حالة قاعدة البيانات ومعدلات التخزين
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-400">
                  ملخص لإحصائيات الجداول المخزنة في Supabase PostgreSQL.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-6 text-xs text-slate-450">جاري تحميل إحصائيات النظام...</div>
                ) : !stats ? (
                  <div className="text-center py-6 text-xs text-slate-450">فشل في الحصول على بيانات التشخيص.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    
                    <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                      <Users className="h-6 w-6 text-slate-500" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">العائلات المسجلة</span>
                        <span className="text-sm font-extrabold text-slate-100">{stats.families}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                      <Heart className="h-6 w-6 text-rose-400 animate-pulse" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">الأيتام والطلاب</span>
                        <span className="text-sm font-extrabold text-slate-100">{stats.orphans}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                      <Briefcase className="h-6 w-6 text-blue-400" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">المشاريع الإغاثية</span>
                        <span className="text-sm font-extrabold text-slate-100">{stats.projects}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                      <Coins className="h-6 w-6 text-amber-400" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">الكفلاء والكفالات</span>
                        <span className="text-sm font-extrabold text-slate-100">{stats.sponsorships}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                      <FileText className="h-6 w-6 text-emerald-400" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">سندات القبض المالي</span>
                        <span className="text-sm font-extrabold text-slate-100">{stats.receipts}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                      <Activity className="h-6 w-6 text-purple-400" />
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">الأنشطة والتدقيق</span>
                        <span className="text-sm font-extrabold text-slate-100">{stats.auditLogs + stats.caseActivities}</span>
                      </div>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection and Version Card */}
            <Card className="border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm bg-gradient-to-br from-slate-950 to-slate-900 text-white animate-fade-in">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                  <Info className="h-4.5 w-4.5 text-emerald-400" />
                  تفاصيل بيئة التشغيل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-medium text-slate-300">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span>خادم قاعدة البيانات:</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Supabase PG</Badge>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span>إطار العمل:</span>
                  <Badge className="bg-slate-800 text-slate-200">Next.js 15.5</Badge>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span>نسخة العميل Prisma:</span>
                  <span className="font-mono text-[10px]">v5.22.0</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span>حالة الاتصال بالخادم:</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    متصل ونشط
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── TAGS MANAGEMENT TAB ── */}
        <TabsContent value="tags" className="space-y-6">
          {/* Header + Seed Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-white">إدارة التصنيفات المرنة</h3>
              <p className="text-xs text-white/50 mt-1">أضف وعدّل التصنيفات التي تظهر على الأيتام والأسر. التغييرات تنعكس فوراً.</p>
            </div>
            <Button
              onClick={async () => {
                setSeedingTags(true)
                const res = await seedInitialTags()
                setMessage({ text: res.message || res.error || "", type: res.success ? "success" : "error" })
                await loadData()
                setSeedingTags(false)
              }}
              disabled={seedingTags}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {seedingTags ? "جاري الإضافة..." : "إضافة التصنيفات الافتراضية"}
            </Button>
          </div>

          {/* Add New Tag Form */}
          <Card className="bg-slate-900/40 border border-indigo-500/20 backdrop-blur-md rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-indigo-400" />
                إضافة تصنيف جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!newTagName) return
                  setSubmitting(true)
                  const fd = new FormData()
                  fd.set("nameAr", newTagName)
                  fd.set("category", newTagCategory)
                  fd.set("color", newTagColor)
                  const res = await createTag(fd)
                  if (res.success) {
                    setNewTagName("")
                    setMessage({ text: res.message || "تم إنشاء التصنيف", type: "success" })
                    await loadData()
                  } else {
                    setMessage({ text: res.error || "فشل", type: "error" })
                  }
                  setSubmitting(false)
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-white/60">اسم التصنيف</label>
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="مثال: تحت المتابعة"
                    className="bg-slate-800 border-slate-700 text-white text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/60">الفئة</label>
                  <select
                    value={newTagCategory}
                    onChange={(e) => setNewTagCategory(e.target.value as TagCategory)}
                    className="w-full h-9 rounded-md border border-slate-700 bg-slate-800 px-3 text-xs text-white"
                  >
                    <option value="ORPHAN_OPERATIONAL_STATUS">الحالة التشغيلية للأيتام</option>
                    <option value="FUNDING_SOURCE">جهة التمويل</option>
                    <option value="FAMILY_NEED">احتياجات الأسرة</option>
                    <option value="MEDICAL_CONDITION">الحالة الطبية</option>
                    <option value="CUSTOM">مخصص</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/60">اللون</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="h-9 w-12 rounded-md border border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <Button type="submit" disabled={submitting} className="flex-1 h-9 text-xs bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-3 w-3 ml-1" /> إضافة
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tags List grouped by category */}
          {([
            { key: "ORPHAN_OPERATIONAL_STATUS", label: "الحالة التشغيلية للأيتام", color: "blue" },
            { key: "FUNDING_SOURCE", label: "جهات التمويل والكفالة", color: "teal" },
            { key: "FAMILY_NEED", label: "احتياجات الأسرة", color: "amber" },
            { key: "MEDICAL_CONDITION", label: "الحالات الطبية", color: "rose" },
            { key: "CUSTOM", label: "تصنيفات مخصصة", color: "purple" },
          ] as const).map(({ key, label }) => {
            const catTags = allTags.filter((t) => t.category === key)
            if (catTags.length === 0) return null
            return (
              <Card key={key} className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-extrabold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-indigo-400" />
                      {label}
                    </span>
                    <span className="text-xs font-normal text-white/40">{catTags.length} تصنيف</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {catTags.map((tag) => (
                      <div
                        key={tag.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all ${
                          tag.isActive
                            ? "bg-white/5 border-white/10"
                            : "bg-white/[0.02] border-white/5 opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3.5 w-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm font-semibold text-white">{tag.nameAr}</span>
                          {!tag.isActive && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">معطّل</span>
                          )}
                          <span className="text-[10px] text-white/30">
                            {tag._count.beneficiaryTags + tag._count.familyTags} استخدام
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const res = await toggleTag(tag.id)
                              setMessage({ text: res.message || res.error || "", type: res.success ? "success" : "error" })
                              await loadData()
                            }}
                            className="text-white/40 hover:text-white transition-colors p-1 rounded"
                            title={tag.isActive ? "تعطيل" : "تفعيل"}
                          >
                            {tag.isActive
                              ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                              : <ToggleLeft className="h-5 w-5 text-slate-500" />}
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`هل أنت متأكد من حذف "${tag.nameAr}"؟`)) return
                              const res = await deleteTag(tag.id)
                              setMessage({ text: res.message || res.error || "", type: res.success ? "success" : "error" })
                              await loadData()
                            }}
                            className="text-white/20 hover:text-red-400 transition-colors p-1 rounded"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* ── TABS CONTENT: USERS MANAGEMENT ── */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create User Form */}
            <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-emerald-500" />
                  إضافة مستخدم / مسوق جديد
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-400">إنشاء حساب جديد وتفويضه بصلاحيات محددة.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!newUserName || !newUserEmail || !newUserPassword) return
                    setSubmitting(true)
                    const res = await createSystemUser({
                      name: newUserName,
                      email: newUserEmail,
                      password: newUserPassword,
                      role: newUserRole
                    })
                    if (res.success) {
                      setNewUserName("")
                      setNewUserEmail("")
                      setNewUserPassword("")
                      setNewUserRole("MARKETER" as Role)
                      setMessage({ text: "تم إنشاء حساب المستخدم بنجاح ومزامنته مع Supabase Auth!", type: "success" })
                      loadData()
                    } else {
                      setMessage({ text: res.error || "فشل إنشاء حساب المستخدم", type: "error" })
                    }
                    setSubmitting(false)
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350">الاسم الكامل</label>
                    <Input
                      placeholder="مثال: محمد أحمد علي"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="h-9 text-xs rounded-lg bg-slate-900/60 border-slate-800/80 text-white placeholder-slate-500 focus-visible:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350">البريد الإلكتروني</label>
                    <Input
                      type="email"
                      placeholder="name@ngo.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="h-9 text-xs rounded-lg bg-slate-900/60 border-slate-800/80 text-white placeholder-slate-500 focus-visible:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350">كلمة المرور</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="h-9 text-xs rounded-lg bg-slate-900/60 border-slate-800/80 text-white placeholder-slate-500 focus-visible:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-350">الدور والصلاحية</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as Role)}
                      className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold focus-visible:outline-none text-right text-slate-200 hover:border-slate-700 transition-all"
                      required
                    >
                      <option className="bg-slate-950 text-white" value="MARKETER">مسوق ميداني (MARKETER)</option>
                      <option className="bg-slate-950 text-white" value="DATA_ENTRY">مدخل بيانات (DATA_ENTRY)</option>
                      <option className="bg-slate-950 text-white" value="MANAGER">مدير عمليات (MANAGER)</option>
                      <option className="bg-slate-950 text-white" value="ADMIN">مشرف نظام كامل (ADMIN)</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || !newUserName || !newUserEmail || !newUserPassword}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 font-bold text-xs shadow-md shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    إنشاء حساب المستخدم
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Users List Table */}
            <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-emerald-500" />
                  المستخدمون والمسوقون النشطون بالنظام ({usersList.length} مستخدم)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold">
                        <th className="pb-2">الاسم</th>
                        <th className="pb-2">البريد الإلكتروني</th>
                        <th className="pb-2">الصلاحية</th>
                        <th className="pb-2 text-center">الحالة</th>
                        <th className="pb-2 text-left">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {usersList.map((user) => (
                        <tr key={user.id} className="text-slate-300 hover:bg-slate-850/20">
                          <td className="py-3 font-semibold text-white">{user.name}</td>
                          <td className="py-3 font-mono text-slate-400">{user.email}</td>
                          <td className="py-3">
                            {user.role === "ADMIN" && (
                              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/10 text-[10px]">مشرف نظام</Badge>
                            )}
                            {user.role === "MANAGER" && (
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/10 text-[10px]">مدير</Badge>
                            )}
                            {user.role === "DATA_ENTRY" && (
                              <Badge className="bg-slate-800 text-slate-350 border-slate-700/30 hover:bg-slate-800 text-[10px]">مدخل بيانات</Badge>
                            )}
                            {user.role === "MARKETER" && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 text-[10px]">مسوق ميداني</Badge>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-450 font-bold bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-900/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> نشط
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-950/20 px-2 py-0.5 rounded-full border border-red-900/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> مجمد
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-left">
                            {user.email !== "admin@ngo.com" && (
                              <button
                                onClick={async () => {
                                  const res = await toggleUserStatus(user.id)
                                  if (res.success) {
                                    setMessage({ text: "تم تحديث حالة المستخدم بنجاح!", type: "success" })
                                    loadData()
                                  } else {
                                    setMessage({ text: res.error || "فشل تعديل حالة المستخدم", type: "error" })
                                  }
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                              >
                                {user.isActive ? (
                                  <ToggleRight className="h-5 w-5 text-emerald-400" />
                                ) : (
                                  <ToggleLeft className="h-5 w-5 text-slate-500" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
