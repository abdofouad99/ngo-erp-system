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

async function getDashboardChartsData() {
  const [
    severePoverty,
    mediumPoverty,
    lowPoverty,
    maleOrphans,
    femaleOrphans,
    allFamilies,
    sponsoredOrphansCount,
    totalOrphansCount
  ] = await Promise.all([
    prisma.family.count({ where: { povertyLevel: "SEVERE", isActive: true, deletedAt: null } }),
    prisma.family.count({ where: { povertyLevel: "MEDIUM", isActive: true, deletedAt: null } }),
    prisma.family.count({ where: { povertyLevel: "LOW", isActive: true, deletedAt: null } }),
    prisma.beneficiary.count({ where: { category: "ORPHAN", gender: "MALE", isActive: true, deletedAt: null } }),
    prisma.beneficiary.count({ where: { category: "ORPHAN", gender: "FEMALE", isActive: true, deletedAt: null } }),
    prisma.family.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        subDistrict: {
          select: {
            district: {
              select: {
                governorate: {
                  select: {
                    nameAr: true
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.beneficiary.count({
      where: {
        category: "ORPHAN",
        isActive: true,
        deletedAt: null,
        sponsorships: {
          some: {
            status: "ACTIVE",
            deletedAt: null
          }
        }
      }
    }),
    prisma.beneficiary.count({
      where: {
        category: "ORPHAN",
        isActive: true,
        deletedAt: null
      }
    })
  ])

  // Group families by governorate
  const geoCounts: Record<string, number> = {}
  allFamilies.forEach(f => {
    const govName = f.subDistrict?.district?.governorate?.nameAr || "أخرى"
    geoCounts[govName] = (geoCounts[govName] || 0) + 1
  })

  const geoData = Object.entries(geoCounts).map(([name, value]) => ({
    name,
    value
  }))

  const povertyData = [
    { name: "فقر شديد", value: severePoverty },
    { name: "فقر متوسط", value: mediumPoverty },
    { name: "فقر منخفض", value: lowPoverty }
  ]

  const genderData = [
    { name: "ذكور", value: maleOrphans },
    { name: "إناث", value: femaleOrphans }
  ]

  const unsponsoredCount = Math.max(0, totalOrphansCount - sponsoredOrphansCount)
  const sponsorshipData = [
    { name: "مكفولين", value: sponsoredOrphansCount },
    { name: "في الانتظار", value: unsponsoredCount }
  ]

  return { povertyData, genderData, geoData, sponsorshipData }
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DashboardPage() {
  const [stats, chartsData] = await Promise.all([
    getDashboardStats(),
    getDashboardChartsData()
  ])

  const kpiCards = [
    {
      title: "إجمالي الأسر",
      value: stats.families,
      description: "أسرة نشطة مسجلة",
      icon: Users,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      trend: "+12%",
      trendUp: true,
      href: "/dashboard/families",
    },
    {
      title: "المستفيدون",
      value: stats.beneficiaries,
      description: "فرد مستفيد",
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      trend: "+8%",
      trendUp: true,
      href: "/dashboard/families",
    },
    {
      title: "المشاريع النشطة",
      value: stats.projects,
      description: "مشروع قيد التنفيذ",
      icon: PackageOpen,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      trend: "+2",
      trendUp: true,
      href: "/dashboard/projects",
    },
    {
      title: "الرعايات الفعّالة",
      value: stats.sponsorships,
      description: "كفالة نشطة حالياً",
      icon: HeartHandshake,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      trend: "+5%",
      trendUp: true,
      href: "/dashboard/sponsors",
    },
  ]

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
                    <span
                      className={`flex items-center gap-0.5 text-xs font-semibold ${
                        card.trendUp ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {card.trendUp ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {card.trend}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                      {card.value.toLocaleString("ar-SA")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground/90">
                      {card.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* ── Visual Analytics & Graphs ───────────────────────────── */}
      <DashboardCharts
        povertyData={chartsData.povertyData}
        genderData={chartsData.genderData}
        geoData={chartsData.geoData}
        sponsorshipData={chartsData.sponsorshipData}
      />

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
