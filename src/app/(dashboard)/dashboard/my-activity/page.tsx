export const dynamic = "force-dynamic"

import { getMyActivityLog } from "@/app/actions/my-activity-actions"
import {
  Activity,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Eye,
  Calendar,
  User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// =============================================================================
// Helpers
// =============================================================================

function getActionLabel(action: string) {
  switch (action) {
    case "CREATE": return { label: "إنشاء", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
    case "UPDATE": return { label: "تعديل", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
    case "DELETE": return { label: "حذف", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" }
    case "RESTORE": return { label: "استعادة", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
    default: return { label: action, color: "bg-slate-500/10 text-slate-400 border-slate-500/20" }
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case "CREATE": return <Plus className="h-3.5 w-3.5" />
    case "UPDATE": return <Edit3 className="h-3.5 w-3.5" />
    case "DELETE": return <Trash2 className="h-3.5 w-3.5" />
    case "RESTORE": return <RotateCcw className="h-3.5 w-3.5" />
    default: return <Eye className="h-3.5 w-3.5" />
  }
}

function getEntityLabel(entityType: string) {
  const map: Record<string, string> = {
    FAMILY: "أسرة",
    BENEFICIARY: "مستفيد",
    ORPHAN: "يتيم",
    SPONSOR: "كفيل",
    SPONSORSHIP: "كفالة",
    PROJECT: "مشروع",
    DISTRIBUTION: "توزيع",
    SETTING: "الإعدادات",
    GOVERNORATE: "محافظة",
    DISTRICT: "مديرية",
    SUB_DISTRICT: "عزلة",
    USER: "مستخدم",
  }
  return map[entityType] || entityType
}

function groupByDate(logs: any[]) {
  const groups: Record<string, any[]> = {}
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  logs.forEach((log) => {
    const date = new Date(log.createdAt)
    const dateStr = date.toLocaleDateString("en-CA") // YYYY-MM-DD
    const todayStr = today.toLocaleDateString("en-CA")
    const yesterdayStr = yesterday.toLocaleDateString("en-CA")

    let label: string
    if (dateStr === todayStr) label = "اليوم"
    else if (dateStr === yesterdayStr) label = "أمس"
    else {
      label = date.toLocaleDateString("ar-SA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    if (!groups[label]) groups[label] = []
    groups[label].push(log)
  })

  return groups
}

// =============================================================================
// Page Component
// =============================================================================

export default async function MyActivityPage() {
  const result = await getMyActivityLog(200)
  const logs = result.success ? result.logs : []
  const currentUser = result.success ? (result as any).currentUser : null
  const grouped = groupByDate(logs)

  const totalToday = grouped["اليوم"]?.length || 0
  const totalActions = logs.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold md:text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6" />
              سجل نشاطي الشخصي
            </h2>
            <p className="mt-1.5 text-sm text-purple-100">
              جميع العمليات التي قمت بها في النظام
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm text-center">
              <p className="text-lg font-bold">{totalToday}</p>
              <p className="text-xs text-purple-100">اليوم</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm text-center">
              <p className="text-lg font-bold">{totalActions}</p>
              <p className="text-xs text-purple-100">إجمالي</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Info */}
      {currentUser && (
        <Card className="glass-card border-violet-500/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-xl font-bold text-white shadow-lg">
              {currentUser.name?.charAt(0) || "م"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{currentUser.name || "المستخدم"}</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
            <Badge className="mr-auto bg-violet-500/10 text-violet-400 border-violet-500/20">
              <User className="h-3 w-3 mr-1" />
              {currentUser.role}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">لا توجد عمليات مسجلة بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, dayLogs]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-violet-400">{dateLabel}</h3>
                <span className="text-xs text-muted-foreground">({dayLogs.length} عملية)</span>
              </div>

              <Card className="glass-card">
                <CardContent className="p-0 divide-y divide-border/30">
                  {dayLogs.map((log, index) => {
                    const { label, color } = getActionLabel(log.action)
                    const icon = getActionIcon(log.action)
                    const time = new Date(log.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    const changesCount = Object.keys(log.changes || {}).length

                    return (
                      <div key={log.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${color}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${color}`}>
                              {label}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {getEntityLabel(log.entityType)}
                            </span>
                            {changesCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({changesCount} تغيير)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            المعرف: {log.entityId}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                          {time}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
