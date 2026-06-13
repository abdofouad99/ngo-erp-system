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
      <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-slate-800/60 px-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-900/30">
          <Heart className="h-5 w-5 text-white" fill="white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-wide text-white">
            نظام إدارة المنظمة
          </p>
          <p className="text-xs text-emerald-400/70">NGO ERP System</p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">

        {/* Main Links */}
        <div className="mb-6 space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            القائمة الرئيسية
          </p>
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                )}
              >
                {/* Active indicator bar - perfectly aligned in RTL */}
                <div
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-emerald-400 transition-all",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                />
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-colors mr-1.5",
                    active
                      ? "text-emerald-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                )}
              </Link>
            )
          })}
        </div>

        {/* System Links */}
        <div className="space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            النظام
          </p>
          {systemNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                )}
              >
                {/* Active indicator bar - perfectly aligned in RTL */}
                <div
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-emerald-400 transition-all",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                />
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-colors mr-1.5",
                    active
                      ? "text-emerald-400"
                      : "text-slate-500 group-hover:text-slate-300"
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
