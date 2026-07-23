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
} from "lucide-react"
import Link from "next/link"

interface DashboardChartsProps {
  rawFamilies: any[]
  rawBeneficiaries: any[]
  governorates: any[]
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
  activeProjectsCount,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedGov, setSelectedGov] = useState("ALL")

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

  const filteredFamilies = rawFamilies.filter(
    (f) => selectedGov === "ALL" || f.governorateId?.toString() === selectedGov
  )
  const filteredBeneficiaries = rawBeneficiaries.filter(
    (b) => selectedGov === "ALL" || b.governorateId?.toString() === selectedGov
  )

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
        <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 p-3 rounded-xl shadow-2xl text-right space-y-1">
          <p className="text-xs font-bold text-slate-200 border-b border-border/40 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="font-bold font-mono text-emerald-400">{entry.value}</span>
              <span className="text-slate-300 font-medium" style={{ color: entry.color }}>
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
      {/* ── Filter Bar ────────────────────────────────────────── */}
      <Card className="bg-slate-900/60 border border-emerald-500/20 backdrop-blur-xl shadow-xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-slate-200 font-bold">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Filter className="h-4 w-4" />
            </div>
            <span>تصفية وتحليل لوحة البيانات بالكامل جغرافياً:</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="flex h-10 w-full sm:w-60 rounded-xl border border-emerald-500/30 bg-slate-950 px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-emerald-300 font-bold cursor-pointer transition-all shadow-inner"
            >
              <option value="ALL" className="bg-slate-950 text-white">كل المحافظات (عرض كلي)</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id.toString()} className="bg-slate-950 text-white">
                  {gov.nameAr}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href}>
              <Card className="group cursor-pointer bg-slate-900/40 border border-border/60 hover:border-emerald-500/40 hover:bg-slate-900/70 transition-all duration-300 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
                <CardContent className="p-5 relative">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl ${card.iconBg} p-2.5 shadow-md`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                      <Activity className="h-3 w-3 animate-pulse" />
                      مباشر
                    </span>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-3xl font-black tabular-nums text-white group-hover:text-emerald-400 transition-colors">
                        {card.value.toLocaleString("ar-YE-u-nu-latn")}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-300">
                        {card.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{card.description}</p>
                    </div>

                    {/* Sparkline chart */}
                    {card.sparklineData && (
                      <div className="w-20 h-11 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={card.sparklineData}>
                            <defs>
                              <linearGradient id={`sparkGrad-${card.title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={card.strokeColor} stopOpacity={0.6}/>
                                <stop offset="95%" stopColor={card.strokeColor} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={card.strokeColor}
                              fill={`url(#sparkGrad-${card.title})`}
                              strokeWidth={2}
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* ── Main Charts Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ── Chart 0: Monthly Bar Chart ─────────────────────────── */}
        <Card className="bg-slate-900/50 border border-border/60 backdrop-blur-xl md:col-span-2 shadow-2xl">
          <CardHeader className="pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-emerald-400" />
                التسجيلات الشهرية للمستفيدين والأسر
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">مقارنة شهرية متدرجة لأعمدة التسجيل الجديد (آخر 6 أشهر).</CardDescription>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded-lg font-bold">
              تحديث تلقائي
            </span>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData.slice(-6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barFamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="barOrphGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#334155" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16, 185, 129, 0.05)" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="الأيتام" fill="url(#barOrphGrad)" radius={[8, 8, 0, 0]} maxBarSize={36} />
                <Bar dataKey="الأسر" fill="url(#barFamGrad)" radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Chart 0b: Monthly Line/Area Chart ──────────────────── */}
        <Card className="bg-slate-900/50 border border-border/60 backdrop-blur-xl md:col-span-2 shadow-2xl">
          <CardHeader className="pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                معدل النمو السنوي التراكمي (مخطط نيون مشع)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">رصد نمو إدراج المستفيدين عبر مسار 12 شهراً متصلة.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaOrphans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="areaFamilies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="الأيتام" stroke="#10b981" fillOpacity={1} fill="url(#areaOrphans)" strokeWidth={3} />
                <Area type="monotone" dataKey="الأسر" stroke="#06b6d4" fillOpacity={1} fill="url(#areaFamilies)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Chart 1: Poverty Levels ────────────────────────────── */}
        <Card className="bg-slate-900/50 border border-border/60 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              توزيع الأسر حسب شريحة الفقر
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">تصنيف الأسر المسجلة حسب نتائج التقييم الاجتماعي.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={povertyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={40}>
                  {povertyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRIGHT_COLORS[index % BRIGHT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Chart 2: Orphan Genders ───────────────────────────── */}
        <Card className="bg-slate-900/50 border border-border/60 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-pink-400" />
              نسبة الأيتام (ذكور / إناث)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">النسبة المئوية الحية لربط كفالات الذكور والإناث.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#06b6d4" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
