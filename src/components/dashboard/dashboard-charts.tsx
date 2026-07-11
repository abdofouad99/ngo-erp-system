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
} from "lucide-react"
import Link from "next/link"

interface DashboardChartsProps {
  rawFamilies: any[]
  rawBeneficiaries: any[]
  governorates: any[]
  activeProjectsCount: number
}

const COLORS = ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b", "#8b5cf6", "#6b7280"]

// ============================================================
// Helper Functions for Dynamic Aggregations
// ============================================================

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

  // Hydration guard to prevent Next.js SSR mismatch
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

  // Filter lists based on selected Governorate
  const filteredFamilies = rawFamilies.filter(
    (f) => selectedGov === "ALL" || f.governorateId?.toString() === selectedGov
  )
  const filteredBeneficiaries = rawBeneficiaries.filter(
    (b) => selectedGov === "ALL" || b.governorateId?.toString() === selectedGov
  )

  // Calculate Metrics
  const activeFamiliesCount = filteredFamilies.filter(f => f.isActive).length
  const activeBeneficiariesCount = filteredBeneficiaries.filter(b => b.isActive).length
  const activeSponsorshipsCount = filteredBeneficiaries.filter(b => b.isActive && b.isSponsored).length

  // Generate Sparkline Data
  const familiesSparkline = getSparklineData(filteredFamilies)
  const beneficiariesSparkline = getSparklineData(filteredBeneficiaries)
  const sponsorshipsSparkline = getSparklineData(filteredBeneficiaries, undefined, true)

  // Re-Calculate Chart Data based on filtered lists
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
      description: "أسرة نشطة مسجلة",
      icon: Users,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      strokeColor: "#3b82f6",
      sparklineData: familiesSparkline,
      href: "/dashboard/families",
    },
    {
      title: "المستفيدون",
      value: activeBeneficiariesCount,
      description: "فرد مستفيد",
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      strokeColor: "#10b981",
      sparklineData: beneficiariesSparkline,
      href: "/dashboard/families",
    },
    {
      title: "المشاريع النشطة",
      value: activeProjectsCount,
      description: "مشروع قيد التنفيذ",
      icon: PackageOpen,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      strokeColor: "#f97316",
      sparklineData: null,
      href: "/dashboard/projects",
    },
    {
      title: "الرعايات الفعّالة",
      value: activeSponsorshipsCount,
      description: "كفالة نشطة حالياً",
      icon: HeartHandshake,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      strokeColor: "#f43f5e",
      sparklineData: sponsorshipsSparkline,
      href: "/dashboard/sponsors",
    },
  ]

  const tooltipStyle = {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(51, 65, 85, 0.8)",
    borderRadius: "12px",
    color: "#fff",
    textAlign: "right" as const,
  }

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ────────────────────────────────────────── */}
      <Card className="glass-card border border-white/5 bg-slate-950/20 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-350 font-semibold">
            <Filter className="h-4 w-4 text-emerald-400" />
            <span>تصفية وتحليل لوحة البيانات بالكامل:</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="flex h-9 w-full sm:w-56 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-right text-slate-200 font-semibold cursor-pointer transition-all"
            >
              <option value="ALL" className="bg-slate-950 text-white">كل المحافظات</option>
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
              <Card className="group cursor-pointer glass-card hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/20 duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl ${card.iconBg} p-2.5`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      <ArrowUpRight className="h-3 w-3" />
                      مباشر
                    </span>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                        {card.value.toLocaleString("ar-SA-u-nu-latn")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground/90">
                        {card.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{card.description}</p>
                    </div>

                    {/* Sparkline chart */}
                    {card.sparklineData && (
                      <div className="w-16 h-10 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={card.sparklineData}>
                            <defs>
                              <linearGradient id={`sparkGrad-${card.title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={card.strokeColor} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={card.strokeColor} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={card.strokeColor}
                              fill={`url(#sparkGrad-${card.title})`}
                              strokeWidth={1.5}
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
        {/* ── Chart 0: Monthly Growth Timeline ───────────────────── */}
        <Card className="glass-card md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gradient">معدل نمو التسجيل السنوي (شهرياً)</CardTitle>
            <CardDescription className="text-xs">رصد زيادة تسجيل الأيتام والأسر شهرياً على مدار الـ 12 شهراً الأخيرة.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrphans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFamilies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="الأيتام" stroke="#10b981" fillOpacity={1} fill="url(#colorOrphans)" strokeWidth={2} />
                <Area type="monotone" dataKey="الأسر" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFamilies)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Chart 1: Poverty Levels ────────────────────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">توزيع الأسر حسب مستوى الفقر</CardTitle>
            <CardDescription className="text-xs">توزيع الأسر المستفيدة بين الفقر الشديد، المتوسط، والمنخفض.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={povertyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {povertyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Chart 2: Orphan Genders ───────────────────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">توزيع الأيتام حسب الجنس</CardTitle>
            <CardDescription className="text-xs">النسبة المئوية للأيتام الذكور مقارنة بالإناث المسجلين.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#f43f5e"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Chart 3: Geographical Distribution ────────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">التوزيع الجغرافي للأسر</CardTitle>
            <CardDescription className="text-xs">توزيع الأسر المستفيدة على مستوى المحافظات.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Chart 4: Orphan Sponsorship coverage ──────────────── */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">معدل كفالات الأيتام</CardTitle>
            <CardDescription className="text-xs">نسبة الأيتام المكفولين فعلياً مقارنة بمن هم في قائمة الانتظار.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sponsorshipData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {sponsorshipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#475569"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
