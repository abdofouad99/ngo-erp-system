"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  MapPin,
  Home,
  ShieldAlert,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react"

const BRIGHT_PRIORITY_COLORS = ["#f43f5e", "#f59e0b", "#0d9488", "#64748b"]
const BRIGHT_PALETTE = ["#10b981", "#06b6d4", "#8b5cf6", "#f43f5e", "#f59e0b", "#3b82f6"]

interface AnalyticsProps {
  needDistribution: { name: string; value: number }[]
  districtDistribution: { name: string; count: number }[]
  housingDistribution: { name: string; count: number }[]
  ageDistribution: { name: string; count: number }[]
  monthlyTrends: { month: string; families: number; aidUSD: number }[]
}

export function DashboardAnalyticsCharts({
  needDistribution,
  districtDistribution,
  housingDistribution,
  ageDistribution,
}: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "geography" | "housing">("overview")

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 p-3 rounded-xl shadow-2xl text-right space-y-1">
          <p className="text-xs font-bold text-slate-200 border-b border-border/40 pb-1">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="font-bold font-mono text-emerald-400">{entry.value}</span>
              <span className="text-slate-300 font-medium" style={{ color: entry.color || entry.fill }}>
                {entry.name || "العدد"}
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
      {/* Header & View Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/70 p-4 rounded-2xl border border-emerald-500/20 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/30">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              تحليلات مؤشرات الاحتياج والسكن الحية
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">رؤية بصرية تفاعلية مدعومة بمحرك درجات الفقر والهتزاز</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-border/40">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> مؤشرات الهشاشة
          </button>
          <button
            onClick={() => setActiveTab("geography")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "geography"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" /> التوزيع الجغرافي
          </button>
          <button
            onClick={() => setActiveTab("housing")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "housing"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Home className="h-3.5 w-3.5" /> السكن والعمر
          </button>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === "overview" && (
          <>
            {/* Chart 1: Priority / Need Score Distribution */}
            <div className="bg-slate-900/50 border border-border/60 p-5 rounded-2xl shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  درجة أولوية الأسر (Need Score)
                </h4>
                <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                  تحليل خوارزمي
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={needDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {needDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BRIGHT_PRIORITY_COLORS[index % BRIGHT_PRIORITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Housing Types */}
            <div className="bg-slate-900/50 border border-border/60 p-5 rounded-2xl shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Home className="h-4 w-4 text-amber-400" />
                  حالة ونوع سكن الأسر
                </h4>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={housingDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="عدد الأسر" radius={[8, 8, 0, 0]} maxBarSize={40}>
                      {housingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BRIGHT_PALETTE[index % BRIGHT_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === "geography" && (
          <div className="bg-slate-900/50 border border-border/60 p-5 rounded-2xl shadow-xl backdrop-blur-xl lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-400" />
                توزيع الأسر على المديريات والمناطق
              </h4>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="الأسر المسجلة" fill="#06b6d4" radius={[8, 8, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "housing" && (
          <div className="bg-slate-900/50 border border-border/60 p-5 rounded-2xl shadow-xl backdrop-blur-xl lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                التوزيع العمري لأعضاء الأسر المستفيدة
              </h4>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="عدد الأفراد" fill="#8b5cf6" radius={[8, 8, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
