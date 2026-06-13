"use client"

import { usePathname } from "next/navigation"
import { Bell, ChevronDown, LogOut, Menu, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "./app-sidebar"
import { GlobalSearch } from "./global-search"
import { NotificationBell } from "./notification-bell"

interface AppHeaderProps {
  isMarketer?: boolean
}

export function AppHeader({ isMarketer }: AppHeaderProps) {
  const pathname = usePathname()

  const getPageTitle = (path: string) => {
    if (path === "/dashboard") return "الرئيسية"
    if (path.startsWith("/dashboard/families")) {
      if (path.includes("/new")) return "تسجيل أسرة جديدة"
      if (path.includes("/edit")) return "تعديل بيانات الأسرة"
      return "إدارة الأسر"
    }
    if (path.startsWith("/dashboard/orphans")) {
      if (path.includes("/new")) return "تسجيل يتيم جديد"
      return "إدارة الأيتام"
    }
    if (path.startsWith("/dashboard/sponsors")) {
      if (path.includes("/new")) return "إضافة كفيل جديد"
      return "الكفلاء والكفالات"
    }
    if (path.startsWith("/dashboard/projects")) {
      if (path.includes("/new")) return "إنشاء مشروع جديد"
      return "المشاريع والتوزيعات"
    }
    if (path.startsWith("/dashboard/reports")) return "التقارير والإحصائيات"
    if (path.startsWith("/dashboard/trash")) return "سلة المهملات"
    if (path.startsWith("/dashboard/settings")) return "الإعدادات"
    return "لوحة التحكم"
  }

  const title = getPageTitle(pathname)
  return (
    <header className="relative z-50 flex h-16 flex-shrink-0 items-center gap-4 border-b border-border bg-card/60 backdrop-blur-md px-4 shadow-sm md:px-6">

      {/* ── Mobile: Hamburger Menu (hidden for marketers) ──────── */}
      {!isMarketer && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-muted-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">فتح القائمة الجانبية</span>
            </Button>
          </SheetTrigger>
          {/* side="right" is correct for RTL — sidebar slides from the right */}
          <SheetContent side="right" className="w-64 p-0">
            <AppSidebar className="h-full" />
          </SheetContent>
        </Sheet>
      )}

      {/* ── Page Title ─────────────────────────────────────────── */}
      <div className="hidden sm:block flex-shrink-0">
        <h1 className="text-base font-bold text-gradient md:text-lg">
          {title}
        </h1>
      </div>

      {/* ── Global Search Bar (Middle — hidden for marketers) ───── */}
      {!isMarketer ? (
        <div className="flex-1 flex justify-center px-4">
          <GlobalSearch />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* ── Right Actions ──────────────────────────────────────── */}
      <div className="flex items-center gap-1 md:gap-2">

        {/* Dynamic Notification Bell */}
        <NotificationBell />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full px-2 hover:bg-slate-800/60"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white">
                  م
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-foreground md:block">
                مشرف النظام
              </span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">مشرف النظام</p>
                <p className="text-xs text-muted-foreground">admin@ngo.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}
