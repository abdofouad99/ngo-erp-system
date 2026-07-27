"use client"

import { useState, useEffect } from "react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  TrendingUp,
  HeartHandshake,
  PackageOpen,
  ArrowUpRight,
  Filter,
  BarChart2,
  PieChart as PieIcon,
  Sparkles,
  Activity,
  Layers,
  Building2,
  Tag,
  ShieldAlert,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"

interface DashboardChartsProps {
  rawFamilies: any[]
  rawBeneficiaries: any[]
  governorates: any[]
  sponsors?: any[]
  activeProjectsCount: number
}

const BRIGHT_COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f43f5e", "#f59e0b", "#3b82f6"]

const getMonthlyGrowthData = (families: any[], beneficiaries: any[]) => {
  const monthsData: { name: string; "الأسر": number; "الأيتام": number }[] = []
  const now = new Date()
  
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ]

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = `${arabicMonths[month]} ${year}`

    const fCount = families.filter(f => {
      const fDate = new Date(f.createdAt)
      return fDate.getFullYear() === year && fDate.getMonth() === month
    }).length

    const oCount = beneficiaries.filter(b => {
      const bDate = new Date(b.createdAt)
      return b.category === "ORPHAN" && bDate.getFullYear() === year && bDate.getMonth() === month
    }).length

    monthsData.push({
      name: label,
      "الأسر": fCount,
      "الأيتام": oCount
    })
  }

  return monthsData
}

const getSparklineData = (items: any[], categoryFilter?: string, isSponsoredFilter?: boolean) => {
  const now = new Date()
  const weeksData: { value: number }[] = []

  for (let i = 9; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)

    const count = items.filter(item => {
      const date = new Date(item.createdAt)
      const inRange = date >= start && date < end
      if (!inRange) return false

      if (categoryFilter && item.category !== categoryFilter) return false
      if (isSponsoredFilter !== undefined && item.isSponsored !== isSponsoredFilter) return false

      return true
    }).length

    weeksData.push({ value: count })
  }
  return weeksData
}

export function DashboardCharts({
  rawFamilies,
  rawBeneficiaries,
  governorates,
  sponsors = [],
  activeProjectsCount,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedGov, setSelectedGov] = useState("ALL")
  const [selectedSponsor, setSelectedSponsor] = useState("ALL")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedPoverty, setSelectedPoverty] = useState("ALL")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card animate-pulse">
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              جاري تحميل الرسوم البيانية...
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // ── Multi-Dimensional Filtering Logic ──
  const filteredFamilies = rawFamilies.filter((f) => {
    if (selectedGov !== "ALL" && f.governorateId?.toString() !== selectedGov) return false
    if (selectedPoverty !== "ALL" && f.povertyLevel !== selectedPoverty) return false
    return true
  })

  const filteredBeneficiaries = rawBeneficiaries.filter((b) => {
    if (selectedGov !== "ALL" && b.governorateId?.toString() !== selectedGov) return false
    if (selectedSponsor !== "ALL" && b.sponsorId !== selectedSponsor) return false
    if (selectedCategory !== "ALL" && b.category !== selectedCategory) return false
    if (selectedPoverty !== "ALL" && b.povertyLevel !== selectedPoverty) return false
    return true
  })

  const activeFamiliesCount = filteredFamilies.filter(f => f.isActive).length
  const activeBeneficiariesCount = filteredBeneficiaries.filter(b => b.isActive).length
  const activeSponsorshipsCount = filteredBeneficiaries.filter(b => b.isActive && b.isSponsored).length

  const familiesSparkline = getSparklineData(filteredFamilies)
  const beneficiariesSparkline = getSparklineData(filteredBeneficiaries)
  const sponsorshipsSparkline = getSparklineData(filteredBeneficiaries, undefined, true)

  const severePoverty = filteredFamilies.filter(f => f.povertyLevel === "SEVERE" && f.isActive).length
  const mediumPoverty = filteredFamilies.filter(f => f.povertyLevel === "MEDIUM" && f.isActive).length
  const lowPoverty = filteredFamilies.filter(f => f.povertyLevel === "LOW" && f.isActive).length

  const povertyData = [
    { name: "فقر شديد", value: severePoverty },
    { name: "فقر متوسط", value: mediumPoverty },
    { name: "فقر منخفض", value: lowPoverty }
  ]

  const maleOrphans = filteredBeneficiaries.filter(b => b.category === "ORPHAN" && b.gender === "MALE" && b.isActive).length
  const femaleOrphans = filteredBeneficiaries.filter(b => b.category === "ORPHAN" && b.gender === "FEMALE" && b.isActive).length

  const genderData = [
    { name: "ذكور", value: maleOrphans },
    { name: "إناث", value: femaleOrphans }
  ]

  const geoCounts: Record<string, number> = {}
  filteredFamilies.forEach(f => {
    const govName = f.governorateName || "أخرى"
    geoCounts[govName] = (geoCounts[govName] || 0) + 1
  })

  const geoData = Object.entries(geoCounts).map(([name, value]) => ({
    name,
    value
  }))

  const totalOrphans = filteredBeneficiaries.filter(b => b.category === "ORPHAN" && b.isActive).length
  const sponsoredOrphans = filteredBeneficiaries.filter(b => b.category === "ORPHAN" && b.isSponsored && b.isActive).length
  const unsponsoredOrphans = Math.max(0, totalOrphans - sponsoredOrphans)

  const sponsorshipData = [
    { name: "مكفولين", value: sponsoredOrphans },
    { name: "في الانتظار", value: unsponsoredOrphans }
  ]

  const growthData = getMonthlyGrowthData(filteredFamilies, filteredBeneficiaries)

  const resetFilters = () => {
    setSelectedGov("ALL")
    setSelectedSponsor("ALL")
    setSelectedCategory("ALL")
    setSelectedPoverty("ALL")
  }

  const kpiCards = [
    {
      title: "إجمالي الأسر",
      value: activeFamiliesCount,
      description: "أسرة مسجلة بالكامل",
      icon: Users,
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      iconBg: "bg-emerald-500/20 text-emerald-400",
      strokeColor: "#10b981",
      sparklineData: familiesSparkline,
      href: "/dashboard/families",
    },
    {
      title: "المستفيدون",
      value: activeBeneficiariesCount,
      description: "فرد تلقى الدعم",
      icon: TrendingUp,
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      iconBg: "bg-cyan-500/20 text-cyan-400",
      strokeColor: "#06b6d4",
      sparklineData: beneficiariesSparkline,
      href: "/dashboard/families",
    },
    {
      title: "المشاريع النشطة",
      value: activeProjectsCount,
      description: "مشروع قيد التوزيع",
      icon: PackageOpen,
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      iconBg: "bg-amber-500/20 text-amber-400",
      strokeColor: "#f59e0b",
      sparklineData: null,
      href: "/dashboard/projects",
    },
    {
      title: "الرعايات الفعّالة",
      value: activeSponsorshipsCount,
      description: "كفالة نشطة قائمة",
      icon: HeartHandshake,
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      iconBg: "bg-rose-500/20 text-rose-400",
      strokeColor: "#f43f5e",
      sparklineData: sponsorshipsSparkline,
      href: "/dashboard/sponsors",
    },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-[#00B2A9]/30 dark:border-emerald-500/30 p-3 rounded-xl shadow-2xl text-right space-y-1">
          <p className="text-xs font-bold text-[#1C355E] dark:text-slate-200 border-b border-[#1C355E]/10 dark:border-border/40 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="font-bold font-mono text-[#00B2A9] dark:text-emerald-400">{entry.value}</span>
              <span className="text-[#1C355E]/70 dark:text-slate-300 font-medium" style={{ color: entry.color }}>
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* ── Multi-Dimensional Filter Bar ────────────────────────── */}
      <Card className="bg-white dark:bg-slate-900/60 border border-[#1C355E]/10 dark:border-emerald-500/20 backdrop-blur-xl shadow-sm dark:shadow-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-[#1C355E] dark:text-slate-200 font-bold">
              <div className="p-1.5 rounded-lg bg-[#00B2A9]/10 dark:bg-emerald-500/20 text-[#00B2A9] dark:text-emerald-400">
                <Filter className="h-4 w-4" />
              </div>
              <span>تصفية وتحليل لوحة البيانات الشامل متعدد الأبعاد:</span>
            </div>
            {(selectedGov !== "ALL" || selectedSponsor !== "ALL" || selectedCategory !== "ALL" || selectedPoverty !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                إعادة ضبط الفلاتر
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Geography Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3 text-emerald-400" />
                المحافظة / النطاق الجغرافي:
              </label>
              <select
                value={selectedGov}
                onChange={(e) => setSelectedGov(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="ALL">كل المحافظات (عرض كلي)</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id.toString()}>
                    {g.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Sponsor Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-cyan-400" />
                الكفيل / الجهة الممولة:
              </label>
              <select
                value={selectedSponsor}
                onChange={(e) => setSelectedSponsor(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="ALL">جميع الجهات الكافلة (كل الكفلاء)</option>
                {sponsors.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Beneficiary Category Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Tag className="h-3 w-3 text-amber-400" />
                نوع / تصنيف المستفيد:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="ALL">جميع التصنيفات (أيتام، حفاظ، أسر)</option>
                <option value="ORPHAN">أيتام ومكفولين (ORPHAN)</option>
                <option value="STUDENT">حفاظ وطلاب قرآن (STUDENT)</option>
                <option value="GENERAL">أسر متعففة (GENERAL)</option>
              </select>
            </div>

            {/* 4. Poverty & Need Score Level Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-rose-400" />
                مستوى الحاجة والفقر:
              </label>
              <select
                value={selectedPoverty}
                onChange={(e) => setSelectedPoverty(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                <option value="ALL">جميع مستويات الفقر والاحتياج</option>
                <option value="SEVERE">فقر شديد / أولوية حرجة (SEVERE)</option>
                <option value="MEDIUM">فقر متوسط / أولوية عالية (MEDIUM)</option>
                <option value="LOW">فقر منخفض (LOW)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.title} href={kpi.href}>
              <Card className="glass-card hover:border-[#00B2A9]/40 dark:hover:border-emerald-500/40 transition-all duration-300 group cursor-pointer overflow-hidden relative">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${kpi.iconBg} transition-transform group-hover:scale-110`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${kpi.badgeColor}`}>
                      مباشر
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#1C355E]/70 dark:text-slate-400">{kpi.title}</p>
                    <p className="text-3xl font-black text-[#1C355E] dark:text-white font-mono tracking-tight">
                      {kpi.value.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#1C355E]/60 dark:text-slate-400 font-medium">{kpi.description}</p>
                  </div>

                  {/* Sparkline chart if available */}
                  {kpi.sparklineData && (
                    <div className="h-10 mt-3 -mx-5 -mb-5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={kpi.sparklineData}>
                          <defs>
                            <linearGradient id={`grad-${kpi.title}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={kpi.strokeColor} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={kpi.strokeColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={kpi.strokeColor}
                            strokeWidth={2}
                            fill={`url(#grad-${kpi.title})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* ── Main Charts Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Growth Over Time */}
        <Card className="glass-card border-[#1C355E]/10 dark:border-emerald-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#1C355E] dark:text-slate-100 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-[#00B2A9] dark:text-emerald-400" />
                  التسجيلات الشهرية للمستفيدين والأسر
                </CardTitle>
                <CardDescription className="text-xs text-[#1C355E]/60 dark:text-slate-400">
                  مقارنة شهرية متدرجة لأعمدة التسجيل الجديد (آخر 12 شهر).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="الأيتام" fill="#00B2A9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="الأسر" fill="#1C355E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Poverty Levels Distribution */}
        <Card className="glass-card border-[#1C355E]/10 dark:border-emerald-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#1C355E] dark:text-slate-100 flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-cyan-400" />
                  توزيع مستويات الفقر والاحتياج للأسر
                </CardTitle>
                <CardDescription className="text-xs text-[#1C355E]/60 dark:text-slate-400">
                  نسب الأسر حسب شدة الاحتياج المعيشي.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={povertyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {povertyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRIGHT_COLORS[index % BRIGHT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sponsorship Status Distribution */}
        <Card className="glass-card border-[#1C355E]/10 dark:border-emerald-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#1C355E] dark:text-slate-100 flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-rose-400" />
                  حالة كفالة الأيتام (المكفولين vs الانتظار)
                </CardTitle>
                <CardDescription className="text-xs text-[#1C355E]/60 dark:text-slate-400">
                  نسبة الأيتام الذين حصلوا على كفالة مالية سارية.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sponsorshipData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="glass-card border-[#1C355E]/10 dark:border-emerald-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#1C355E] dark:text-slate-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  التوزيع الجغرافي للأسر حسب المحافظة
                </CardTitle>
                <CardDescription className="text-xs text-[#1C355E]/60 dark:text-slate-400">
                  تركز الأسر المستفيدة عبر المحافظات المختلفة.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
