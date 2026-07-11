export const dynamic = "force-dynamic"

import { getExpiringSponshorships, getUnvisitedFamilies, checkAndCreateAlerts } from "@/app/actions/alert-actions"
import { Bell, AlertTriangle, Clock, Users, PhoneCall, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AlertsPage() {
  // تشغيل فحص التنبيهات وإرسال WhatsApp تلقائياً عند فتح الصفحة
  await checkAndCreateAlerts()

  const [expiringResult, unvisitedResult] = await Promise.all([
    getExpiringSponshorships(),
    getUnvisitedFamilies(),
  ])

  const expiring = expiringResult.success ? expiringResult.expiring : []
  const unvisited = unvisitedResult.success ? unvisitedResult.families : []

  const totalAlerts = expiring.length + unvisited.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-600 via-orange-500 to-rose-500 p-6 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold md:text-2xl flex items-center gap-2">
              <Bell className="h-6 w-6" />
              التنبيهات الذكية
            </h2>
            <p className="mt-1.5 text-sm text-orange-100">
              متابعة الكفالات المنتهية والأسر غير المزارة
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm text-center">
              <p className="text-lg font-bold">{totalAlerts}</p>
              <p className="text-xs text-orange-100">إجمالي التنبيهات</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="glass-card border-amber-500/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{expiring.length}</p>
              <p className="text-sm font-medium text-foreground">كفالات ستنتهي خلال 30 يوم</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-rose-500/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
              <Users className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-400">{unvisited.length}</p>
              <p className="text-sm font-medium text-foreground">أسر لم تُزَر منذ 90 يوم</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Sponsorships */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            كفالات ستنتهي قريباً
          </CardTitle>
          <CardDescription>الكفالات التي ستنتهي خلال 30 يوماً — يرجى التواصل مع الكفلاء للتجديد</CardDescription>
        </CardHeader>
        <CardContent>
          {expiring.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">لا توجد كفالات ستنتهي خلال 30 يوم 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {expiring.map((sp: any) => {
                const daysLeft = sp.endDate
                  ? Math.ceil((new Date(sp.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0
                const endDate = sp.endDate
                  ? new Date(sp.endDate).toLocaleDateString("en-GB")
                  : "—"
                const urgency = daysLeft <= 7 ? "rose" : daysLeft <= 15 ? "amber" : "yellow"

                return (
                  <div key={sp.id} className="flex items-center gap-4 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-${urgency}-500/10`}>
                      <Clock className={`h-4 w-4 text-${urgency}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {sp.beneficiary?.fullName || sp.beneficiary?.family?.headFullName || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        الكفيل: {sp.sponsor?.fullName || "—"}
                        {sp.sponsor?.phone && ` • ${sp.sponsor.phone}`}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <Badge className={`bg-${urgency}-500/10 text-${urgency}-400 border-${urgency}-500/20 font-bold`}>
                        {daysLeft} يوم
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1 text-center">{endDate}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unvisited Families */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-rose-400">
            <Users className="h-4 w-4" />
            أسر لم تُزَر منذ 90 يوم
          </CardTitle>
          <CardDescription>هذه الأسر تحتاج لزيارة أو متابعة ميدانية</CardDescription>
        </CardHeader>
        <CardContent>
          {unvisited.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">جميع الأسر تمت زيارتها مؤخراً 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {unvisited.map((family: any) => {
                const lastActivity = family.caseActivities?.[0]
                const lastVisitDate = lastActivity
                  ? new Date(lastActivity.createdAt).toLocaleDateString("en-GB")
                  : "لا توجد زيارات"

                return (
                  <div key={family.id} className="flex items-center gap-4 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                      <Users className="h-4 w-4 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{family.headFullName}</p>
                      <p className="text-xs text-muted-foreground">
                        آخر زيارة: {lastVisitDate}
                      </p>
                    </div>
                    {family.headPhoneNumber && (
                      <a
                        href={`tel:${family.headPhoneNumber}`}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        {family.headPhoneNumber}
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
