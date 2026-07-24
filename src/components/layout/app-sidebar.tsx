"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Baby,
  HeartHandshake,
  PackageOpen,
  FileText,
  Settings,
  Heart,
  ChevronLeft,
  Trash2,
  ArrowLeftRight,
  FileSpreadsheet,
  RefreshCw,
  ClipboardList,
  Bell,
  Stethoscope,
} from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Navigation Configuration
// =============================================================================

const mainNavItems = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    icon: Home,
    exact: true,
  },
  {
    href: "/dashboard/families",
    label: "إدارة الأسر",
    icon: Users,
    exact: false,
  },
  {
    href: "/dashboard/orphans",
    label: "إدارة الأيتام",
    icon: Baby,
    exact: false,
  },
  {
    href: "/dashboard/patients",
    label: "إدارة المرضى",
    icon: Stethoscope,
    exact: false,
  },
  {
    href: "/dashboard/update-requests",
    label: "طلبات التحديث الذاتي",
    icon: RefreshCw,
    exact: false,
  },
  {
    href: "/dashboard/kanban",
    label: "لوحة الكانبان",
    icon: ArrowLeftRight,
    exact: false,
  },
  {
    href: "/dashboard/sponsors",
    label: "الكفلاء والكفالات",
    icon: HeartHandshake,
    exact: false,
  },
  {
    href: "/dashboard/projects",
    label: "المشاريع والتوزيعات",
    icon: PackageOpen,
    exact: false,
  },
  {
    href: "/dashboard/targeting",
    label: "محرك الاستهداف الذكي",
    icon: ClipboardList,
    exact: false,
  },
  {
    href: "/dashboard/data-quality",
    label: "جودة البيانات والدمج",
    icon: RefreshCw,
    exact: false,
  },
  {
    href: "/dashboard/reports",
    label: "التقارير والإحصائيات",
    icon: FileText,
    exact: false,
  },
  {
    href: "/dashboard/import",
    label: "استيراد البيانات",
    icon: FileSpreadsheet,
    exact: false,
  },
  {
    href: "/dashboard/trash",
    label: "سلة المهملات",
    icon: Trash2,
    exact: false,
  },
  {
    href: "/dashboard/alerts",
    label: "التنبيهات الذكية",
    icon: Bell,
    exact: false,
  },
  {
    href: "/dashboard/my-activity",
    label: "نشاطي",
    icon: ClipboardList,
    exact: false,
  },
]

const systemNavItems = [
  {
    href: "/dashboard/settings",
    label: "الإعدادات",
    icon: Settings,
    exact: false,
  },
]

// =============================================================================
// Sidebar Component
// =============================================================================

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col bg-slate-950",
        className
      )}
    >
      {/* ── Brand / Logo ──────────────────────────────────────────── */}
      <div className="flex h-20 flex-shrink-0 items-center gap-3 border-b border-border/60 px-4 bg-slate-900/40 backdrop-blur-md">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/95 p-1 shadow-lg shadow-teal-900/30 overflow-hidden ring-2 ring-emerald-500/30">
          <img src="/logo.jpg" alt="جمعية اليتامى التنموية" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-wide text-white">
            اليتامى التنموية
          </p>
          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">ORPHANS DEVELOPMENT</p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">

        {/* SECTION 1: الرئيسية والاستهداف */}
        <div className="mb-5 space-y-1">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
            الرئيسية والتحليلات
          </p>
          {[
            { href: "/dashboard", label: "الرئيسية والداشبورد", icon: Home, exact: true, color: "text-emerald-400" },
            { href: "/dashboard/targeting", label: "محرك الاستهداف الذكي", icon: ClipboardList, exact: false, color: "text-teal-400", badge: "جديد" },
            { href: "/dashboard/data-quality", label: "جودة البيانات والدمج", icon: RefreshCw, exact: false, color: "text-cyan-400" },
            { href: "/dashboard/reports", label: "التقارير والإحصائيات", icon: FileText, exact: false, color: "text-sky-400" },
          ].map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200",
                  active
                    ? "sidebar-glow-active text-emerald-400 bg-emerald-500/10 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                )}
              >
                <div
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-full bg-emerald-400 transition-all duration-300",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                />
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    active ? "text-emerald-400" : item.color || "text-slate-400"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* SECTION 2: إدارة الفئات والأسر */}
        <div className="mb-5 space-y-1">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-teal-500/80">
            إدارة المستفيدين
          </p>
          {[
            { href: "/dashboard/families", label: "إدارة الأسر المستفيدة", icon: Users, exact: false, color: "text-blue-400" },
            { href: "/dashboard/orphans", label: "إدارة الأيتام", icon: Baby, exact: false, color: "text-purple-400" },
            { href: "/dashboard/patients", label: "إدارة المرضى", icon: Stethoscope, exact: false, color: "text-rose-400" },
            { href: "/dashboard/update-requests", label: "طلبات التحديث الذاتي", icon: RefreshCw, exact: false, color: "text-amber-400" },
            { href: "/dashboard/kanban", label: "لوحة الكانبان", icon: ArrowLeftRight, exact: false, color: "text-indigo-400" },
          ].map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200",
                  active
                    ? "sidebar-glow-active text-emerald-400 bg-emerald-500/10 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                )}
              >
                <div
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-full bg-emerald-400 transition-all duration-300",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                />
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    active ? "text-emerald-400" : item.color || "text-slate-400"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* SECTION 3: الكفالات والمشاريع */}
        <div className="mb-5 space-y-1">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sky-500/80">
            الكفالات والتوزيعات
          </p>
          {[
            { href: "/dashboard/sponsors", label: "الكفلاء والكفالات", icon: HeartHandshake, exact: false, color: "text-emerald-400" },
            { href: "/dashboard/projects", label: "المشاريع والتوزيعات", icon: PackageOpen, exact: false, color: "text-amber-400" },
            { href: "/dashboard/import", label: "استيراد البيانات Excel", icon: FileSpreadsheet, exact: false, color: "text-teal-400" },
          ].map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200",
                  active
                    ? "sidebar-glow-active text-emerald-400 bg-emerald-500/10 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                )}
              >
                <div
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-full bg-emerald-400 transition-all duration-300",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                />
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    active ? "text-emerald-400" : item.color || "text-slate-400"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* SECTION 4: النظام والتنبيهات */}
        <div className="space-y-1">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            أدوات النظام
          </p>
          {[
            { href: "/dashboard/alerts", label: "التنبيهات الذكية", icon: Bell, exact: false, color: "text-rose-400" },
            { href: "/dashboard/my-activity", label: "سجل نشاطي", icon: ClipboardList, exact: false, color: "text-slate-400" },
            { href: "/dashboard/trash", label: "سلة المهملات", icon: Trash2, exact: false, color: "text-slate-500" },
            { href: "/dashboard/settings", label: "إعدادات النظام", icon: Settings, exact: false, color: "text-slate-400" },
          ].map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200",
                  active
                    ? "sidebar-glow-active text-emerald-400 bg-emerald-500/10 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                )}
              >
                <div
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-full bg-emerald-400 transition-all duration-300",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                />
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    active ? "text-emerald-400" : item.color || "text-slate-400"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── User Footer ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-800/60 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-800/40">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white shadow">
            م
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-200">
              مشرف النظام
            </p>
            <p className="truncate text-xs text-slate-500">admin@ngo.com</p>
          </div>
          <ChevronLeft className="h-4 w-4 flex-shrink-0 text-slate-600" />
        </div>
      </div>
    </aside>
  )
}
