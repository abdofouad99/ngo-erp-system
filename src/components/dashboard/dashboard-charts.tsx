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
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface ChartDataItem {
  name: string
  value: number
}

interface DashboardChartsProps {
  povertyData: ChartDataItem[]
  genderData: ChartDataItem[]
  geoData: ChartDataItem[]
  sponsorshipData: ChartDataItem[]
}

const COLORS = ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b", "#8b5cf6", "#6b7280"]

export function DashboardCharts({
  povertyData,
  genderData,
  geoData,
  sponsorshipData,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false)

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

  const tooltipStyle = {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderColor: "rgba(51, 65, 85, 0.8)",
    borderRadius: "12px",
    color: "#fff",
    textAlign: "right" as const,
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              <Legend verticalAlign="bottom" height={36} fontSize={11} />
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
  )
}
