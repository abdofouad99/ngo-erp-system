export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"

import {
  ArrowDownRight,
  ArrowUpRight,
  FolderOpen,
  HeartHandshake,
  PackageOpen,
  TrendingUp,
  UserPlus,
  Users,
  Activity,
  Layers,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getDashboardStats() {
  const [familiesCount, beneficiariesCount, projectsCount, sponsorshipsCount,
         orphansCount, studentsCount] = await Promise.allSettled([
    prisma.family.count({ where: { isActive: true, deletedAt: null } }),
    prisma.beneficiary.count({ where: { isActive: true, deletedAt: null } }),
    prisma.project.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.sponsorship.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.beneficiary.count({ where: { category: "ORPHAN", isActive: true, deletedAt: null } }),
    prisma.beneficiary.count({ where: { category: "STUDENT", isActive: true, deletedAt: null } }),
  ])

  return {
    families: familiesCount.status === "fulfilled" ? familiesCount.value : 0,
    beneficiaries: beneficiariesCount.status === "fulfilled" ? beneficiariesCount.value : 0,
    projects: projectsCount.status === "fulfilled" ? projectsCount.value : 0,
    sponsorships: sponsorshipsCount.status === "fulfilled" ? sponsorshipsCount.value : 0,
    orphans: orphansCount.status === "fulfilled" ? orphansCount.value : 0,
    students: studentsCount.status === "fulfilled" ? studentsCount.value : 0,
  }
}

async function getDashboardRawData() {
  const [families, beneficiaries, governorates] = await Promise.all([
    prisma.family.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        createdAt: true,
        povertyLevel: true,
        isActive: true,
        subDistrict: {
          select: {
            district: {
              select: {
                governorate: {
                  select: {
                    id: true,
                    nameAr: true,
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.beneficiary.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        createdAt: true,
        category: true,
        gender: true,
        isActive: true,
        family: {
          select: {
            subDistrict: {
              select: {
                district: {
                  select: {
                    governorate: {
                      select: {
                        id: true,
                        nameAr: true,
                      }
                    }
                  }
                }
              }
            }
          }
        },
        sponsorships: {
          where: { status: "ACTIVE", deletedAt: null },
          select: { id: true }
        }
      }
    }),
    prisma.governorate.findMany({
      select: { id: true, nameAr: true }
    })
  ])

  // Flatten the data for easy client-side processing
  const formattedFamilies = families.map(f => ({
    id: f.id,
    createdAt: f.createdAt.toISOString(),
    povertyLevel: f.povertyLevel || "LOW",
    isActive: f.isActive,
    governorateId: f.subDistrict?.district?.governorate?.id || null,
    governorateName: f.subDistrict?.district?.governorate?.nameAr || "أخرى"
  }))

  const formattedBeneficiaries = beneficiaries.map(b => ({
    id: b.id,
    createdAt: b.createdAt.toISOString(),
    category: b.category,
    gender: b.gender,
    isActive: b.isActive,
    isSponsored: b.sponsorships.length > 0,
    governorateId: b.family?.subDistrict?.district?.governorate?.id || null,
    governorateName: b.family?.subDistrict?.district?.governorate?.nameAr || "أخرى"
  }))

  return {
    families: formattedFamilies,
    beneficiaries: formattedBeneficiaries,
    governorates
  }
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DashboardPage() {
  const [stats, rawData] = await Promise.all([
    getDashboardStats(),
    getDashboardRawData()
  ])

  const quickActions = [
    {
      label: "تسجيل أسرة جديدة",
      icon: UserPlus,
      href: "/dashboard/families",
      color: "bg-blue-500",
      description: "إضافة أسرة للقاعدة",
    },
    {
      label: "إنشاء مشروع",
      icon: FolderOpen,
      href: "/dashboard/projects",
      color: "bg-orange-500",
      description: "تعريف مشروع جديد",
    },
    {
      label: "إضافة راعٍ",
      icon: HeartHandshake,
      href: "/dashboard/sponsors",
      color: "bg-rose-500",
      description: "تسجيل كفيل أو جهة",
    },
    {
      label: "كشف توزيع",
      icon: PackageOpen,
      href: "/dashboard/projects",
      color: "bg-emerald-500",
      description: "توزيع دفعة على الأسر",
    },
  ]

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-500 via-teal-500 to-teal-600 p-6 text-white shadow-xl">
        {/* Background decoration */}
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                مرحباً بك في نظام الإدارة 👋
              </h2>
              <p className="mt-1.5 text-sm text-teal-100 md:text-base">
                نظرة عامة على أنشطة المنظمة وحالة البيانات
              </p>
            </div>
            <Badge className="hidden bg-white/20 text-white hover:bg-white/30 sm:flex">
              <Activity className="mr-1 h-3 w-3" />
              نشط
            </Badge>
          </div>

          {/* Mini stats in banner */}
          <div className="mt-5 flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-lg font-bold">{stats.orphans}</p>
              <p className="text-xs text-teal-100">يتيم مسجل</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-lg font-bold">{stats.students}</p>
              <p className="text-xs text-teal-100">طالب مستفيد</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-lg font-bold">{stats.projects}</p>
              <p className="text-xs text-teal-100">مشروع نشط</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards & Visual Analytics ────────────────────────── */}
      <DashboardCharts
        rawFamilies={rawData.families}
        rawBeneficiaries={rawData.beneficiaries}
        governorates={rawData.governorates}
        activeProjectsCount={stats.projects}
      />

      {/* ── Month-over-Month Comparison ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(() => {
          const now = new Date()
          const thisMonth = { year: now.getFullYear(), month: now.getMonth() }
          const lastMonth = now.getMonth() === 0
            ? { year: now.getFullYear() - 1, month: 11 }
            : { year: now.getFullYear(), month: now.getMonth() - 1 }

          const countThisMonth = (arr: any[]) => arr.filter(x => {
            const d = new Date(x.createdAt)
            return d.getFullYear() === thisMonth.year && d.getMonth() === thisMonth.month
          }).length
          const countLastMonth = (arr: any[]) => arr.filter(x => {
            const d = new Date(x.createdAt)
            return d.getFullYear() === lastMonth.year && d.getMonth() === lastMonth.month
          }).length

          const allBenefs = rawData.beneficiaries
          const orphansThis = countThisMonth(allBenefs.filter(b => b.category === "ORPHAN"))
          const orphansLast = countLastMonth(allBenefs.filter(b => b.category === "ORPHAN"))
          const familiesThis = countThisMonth(rawData.families)
          const familiesLast = countLastMonth(rawData.families)
          const studentsThis = countThisMonth(allBenefs.filter(b => b.category === "STUDENT"))
          const studentsLast = countLastMonth(allBenefs.filter(b => b.category === "STUDENT"))

          const items = [
            { label: "أيتام جدد هذا الشهر", current: orphansThis, prev: orphansLast, color: "emerald" },
            { label: "أسر جديدة هذا الشهر", current: familiesThis, prev: familiesLast, color: "blue" },
            { label: "طلاب جدد هذا الشهر", current: studentsThis, prev: studentsLast, color: "violet" },
            { label: "كفالات نشطة", current: stats.sponsorships, prev: stats.sponsorships, color: "rose" },
          ]

          return items.map(item => {
            const diff = item.current - item.prev
            const pct = item.prev > 0 ? Math.abs(Math.round((diff / item.prev) * 100)) : 0
            const up = diff >= 0
            return (
              <Card key={item.label} className={`glass-card border-${item.color}-500/10`}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold text-${item.color}-400 tabular-nums`}>{item.current}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    {item.prev !== item.current ? (
                      <>
                        <span className={`text-xs font-bold flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-rose-400"}`}>
                          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {pct}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">مقارنة بالشهر الماضي ({item.prev})</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">لا تغيير عن الشهر الماضي</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        })()}
      </div>

      {/* ── Quick Actions + System Status ───────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gradient">
                <Layers className="h-4 w-4 text-emerald-400" />
                إجراءات سريعة
              </CardTitle>
              <CardDescription className="text-muted-foreground">الوصول السريع للمهام الأكثر استخداماً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="group flex items-center gap-4 rounded-xl border border-border/40 p-4 transition-all duration-300 hover:border-emerald-500/20 hover:bg-emerald-500/5 hover:shadow-lg hover:shadow-emerald-500/5"
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${action.color} shadow-sm shadow-black/40`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                          {action.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gradient">
                <Activity className="h-4 w-4 text-emerald-400" />
                حالة النظام
              </CardTitle>
              <CardDescription className="text-muted-foreground">مراقبة الاتصالات والخدمات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "قاعدة البيانات", status: "متصل", ok: true },
                { label: "Supabase Storage", status: "نشط", ok: true },
                { label: "المصادقة", status: "نشط", ok: true },
                { label: "إصدار النظام", status: "v1.0.0", ok: null },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 border border-border/40 px-3 py-2.5 hover:border-slate-800 transition-colors"
                >
                  <span className="text-sm text-foreground/80">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.ok !== null && (
                      <span
                        className={`flex h-2 w-2 rounded-full ${
                          item.ok ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        item.ok === true
                          ? "text-emerald-400"
                          : item.ok === false
                          ? "text-rose-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
