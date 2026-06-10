"use client"

import { useState, useEffect } from "react"
import { getDeletedRecords, restoreRecord, purgeRecord } from "@/app/actions/trash-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, RefreshCw, AlertTriangle, Users, HeartHandshake, FolderHeart, Calendar, Activity } from "lucide-react"

export default function TrashPage() {
  const [data, setData] = useState<any>({
    families: [],
    beneficiaries: [],
    sponsors: [],
    sponsorships: [],
    projects: [],
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const result = await getDeletedRecords()
    if (result.success) {
      setData({
        families: result.families,
        beneficiaries: result.beneficiaries,
        sponsors: result.sponsors,
        sponsorships: result.sponsorships,
        projects: result.projects,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRestore = async (type: string, id: string) => {
    if (!confirm("هل أنت متأكد من استعادة هذا الملف وتنشيطه في النظام؟")) return
    setActionLoading(id)
    const result = await restoreRecord(type, id)
    if (result.success) {
      loadData()
    } else {
      alert(result.error || "فشل استعادة السجل.")
    }
    setActionLoading(null)
  }

  const handlePurge = async (type: string, id: string) => {
    if (
      !confirm(
        "تنبيه هام جداً!\nهذا الخيار سيقوم بحذف هذا السجل نهائياً وبلا رجعة من قاعدة البيانات، بالإضافة لحذف كل البيانات والملفات والارتباطات المالية المتعلقة به!\n\nهل أنت متأكد تماماً وتريد الحذف النهائي؟"
      )
    )
      return
    setActionLoading(id)
    const result = await purgeRecord(type, id)
    if (result.success) {
      loadData()
    } else {
      alert(result.error || "فشل الحذف النهائي.")
    }
    setActionLoading(null)
  }

  const renderEmptyState = (label: string) => (
    <div className="text-center py-12 text-sm text-slate-500 font-semibold border border-dashed border-slate-850 rounded-xl bg-slate-900/10">
      سلة المهملات فارغة، لا توجد سجلات {label} محذوفة حالياً.
    </div>
  )

  const formatDate = (d: any) => {
    return d ? new Date(d).toLocaleDateString("ar-YE") : "-"
  }

  return (
    <div className="space-y-6 text-right">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white md:text-2xl flex items-center justify-start gap-2">
          <Trash2 className="h-6 w-6 text-red-500" />
          سلة المهملات والملفات المحذوفة
        </h2>
        <p className="mt-1 text-sm text-slate-400 font-medium">
          مراجعة الملفات المستبعدة أو المحذوفة مؤقتاً، مع إمكانية استعادتها وتنشيطها أو حذفها نهائياً لتطهير البيانات.
        </p>
      </div>

      {/* ── Warning Banner ──────────────────────────────────────── */}
      <div className="bg-amber-955/20 border border-amber-900/50 rounded-xl p-4 flex items-start justify-start gap-3 backdrop-blur-md">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs text-amber-300 space-y-1">
          <span className="font-bold block text-sm">تنويه معماري هام للمشرفين والمسؤولين:</span>
          <p className="leading-relaxed font-medium">
            جميع السجلات المحذوفة هنا تخضع لنمط "الحذف المؤقت (Soft Delete)" للحماية من الضياع العشوائي.
            عند استعادتك لأسرة أو كفيل، يعود الحساب للعمل بكافة خصائصه. وعند قيامك بـ "الحذف النهائي"، فإنك تقوم بمسحه مع جميع المرفقات المرتبطة به إلى الأبد.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-slate-450 font-semibold">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-500 mx-auto mb-2" />
          جاري تحميل سلة المهملات...
        </div>
      ) : (
        <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="families" className="space-y-6">
              <TabsList className="flex flex-wrap gap-2 justify-start border-b border-slate-800/60 pb-2 bg-transparent h-auto">
                <TabsTrigger
                  value="families"
                  className="rounded-lg px-4 py-2 font-bold text-xs border border-slate-800/60 data-[state=active]:bg-slate-850 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all gap-1.5"
                >
                  <Users className="h-3.5 w-3.5" />
                  الأسر المحذوفة ({data.families.length})
                </TabsTrigger>
                <TabsTrigger
                  value="beneficiaries"
                  className="rounded-lg px-4 py-2 font-bold text-xs border border-slate-800/60 data-[state=active]:bg-slate-850 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all gap-1.5"
                >
                  <Activity className="h-3.5 w-3.5" />
                  الأيتام/المستفيدون ({data.beneficiaries.length})
                </TabsTrigger>
                <TabsTrigger
                  value="sponsors"
                  className="rounded-lg px-4 py-2 font-bold text-xs border border-slate-800/60 data-[state=active]:bg-slate-850 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all gap-1.5"
                >
                  <HeartHandshake className="h-3.5 w-3.5" />
                  الكفلاء ({data.sponsors.length})
                </TabsTrigger>
                <TabsTrigger
                  value="sponsorships"
                  className="rounded-lg px-4 py-2 font-bold text-xs border border-slate-800/60 data-[state=active]:bg-slate-850 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all gap-1.5"
                >
                  <FolderHeart className="h-3.5 w-3.5" />
                  الكفالات ({data.sponsorships.length})
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="rounded-lg px-4 py-2 font-bold text-xs border border-slate-800/60 data-[state=active]:bg-slate-850 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  المشاريع ({data.projects.length})
                </TabsTrigger>
              </TabsList>

              {/* ── Families Tab ── */}
              <TabsContent value="families">
                {data.families.length === 0 ? (
                  renderEmptyState("أسر")
                ) : (
                  <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-900/10">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-slate-950 border-b border-slate-800">
                        <TableRow className="hover:bg-slate-950 border-0">
                          <TableHead className="text-right text-slate-200 font-bold py-3 pr-4">اسم رب الأسرة</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">الرقم الوطني</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">تاريخ الحذف</TableHead>
                          <TableHead className="text-center text-slate-200 font-bold pl-4">التحكم والاستعادة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-800/60 bg-transparent text-slate-300">
                        {data.families.map((f: any) => (
                          <TableRow key={f.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                            <TableCell className="py-3 pr-4 font-bold text-white">{f.headFullName}</TableCell>
                            <TableCell className="py-3 font-mono font-semibold text-slate-200">{f.headNationalId}</TableCell>
                            <TableCell className="py-3 font-mono text-slate-400">{formatDate(f.deletedAt)}</TableCell>
                            <TableCell className="py-3 pl-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  disabled={actionLoading === f.id}
                                  onClick={() => handleRestore("FAMILY", f.id)}
                                  className="bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-455 border border-emerald-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>استعادة</span>
                                </Button>
                                <Button
                                  disabled={actionLoading === f.id}
                                  onClick={() => handlePurge("FAMILY", f.id)}
                                  className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>حذف نهائي</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ── Beneficiaries Tab ── */}
              <TabsContent value="beneficiaries">
                {data.beneficiaries.length === 0 ? (
                  renderEmptyState("أيتام ومستفيدين")
                ) : (
                  <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-900/10">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-slate-950 border-b border-slate-800">
                        <TableRow className="hover:bg-slate-950 border-0">
                          <TableHead className="text-right text-slate-200 font-bold py-3 pr-4">الاسم الكامل</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">الفئة</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">تاريخ الحذف</TableHead>
                          <TableHead className="text-center text-slate-200 font-bold pl-4">التحكم والاستعادة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-800/60 bg-transparent text-slate-300">
                        {data.beneficiaries.map((b: any) => (
                          <TableRow key={b.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                            <TableCell className="py-3 pr-4 font-bold text-white">{b.fullName}</TableCell>
                            <TableCell className="py-3 font-semibold text-slate-350">
                              {b.category === "ORPHAN" ? "يتيم" : b.category === "STUDENT" ? "طالب علم" : b.category === "PATIENT" ? "مريض" : "عام"}
                            </TableCell>
                            <TableCell className="py-3 font-mono text-slate-400">{formatDate(b.deletedAt)}</TableCell>
                            <TableCell className="py-3 pl-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  disabled={actionLoading === b.id}
                                  onClick={() => handleRestore("BENEFICIARY", b.id)}
                                  className="bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-455 border border-emerald-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>استعادة</span>
                                </Button>
                                <Button
                                  disabled={actionLoading === b.id}
                                  onClick={() => handlePurge("BENEFICIARY", b.id)}
                                  className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>حذف نهائي</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ── Sponsors Tab ── */}
              <TabsContent value="sponsors">
                {data.sponsors.length === 0 ? (
                  renderEmptyState("كفلاء")
                ) : (
                  <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-900/10">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-slate-950 border-b border-slate-800">
                        <TableRow className="hover:bg-slate-950 border-0">
                          <TableHead className="text-right text-slate-200 font-bold py-3 pr-4">اسم الكفيل</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">البلد</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">تاريخ الحذف</TableHead>
                          <TableHead className="text-center text-slate-200 font-bold pl-4">التحكم والاستعادة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-800/60 bg-transparent text-slate-300">
                        {data.sponsors.map((s: any) => (
                          <TableRow key={s.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                            <TableCell className="py-3 pr-4 font-bold text-white">{s.fullName}</TableCell>
                            <TableCell className="py-3 font-semibold text-slate-350">{s.country || "-"}</TableCell>
                            <TableCell className="py-3 font-mono text-slate-400">{formatDate(s.deletedAt)}</TableCell>
                            <TableCell className="py-3 pl-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  disabled={actionLoading === s.id}
                                  onClick={() => handleRestore("SPONSOR", s.id)}
                                  className="bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-455 border border-emerald-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>استعادة</span>
                                </Button>
                                <Button
                                  disabled={actionLoading === s.id}
                                  onClick={() => handlePurge("SPONSOR", s.id)}
                                  className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>حذف نهائي</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ── Sponsorships Tab ── */}
              <TabsContent value="sponsorships">
                {data.sponsorships.length === 0 ? (
                  renderEmptyState("كفالات")
                ) : (
                  <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-900/10">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-slate-950 border-b border-slate-800">
                        <TableRow className="hover:bg-slate-950 border-0">
                          <TableHead className="text-right text-slate-200 font-bold py-3 pr-4">قيمة الكفالة</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">دورة الدفع</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">تاريخ الحذف</TableHead>
                          <TableHead className="text-center text-slate-200 font-bold pl-4">التحكم والاستعادة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-800/60 bg-transparent text-slate-300">
                        {data.sponsorships.map((sp: any) => (
                          <TableRow key={sp.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                            <TableCell className="py-3 pr-4 font-mono font-bold text-white">
                              {Number(sp.amount).toLocaleString("en-US")} {sp.currency}
                            </TableCell>
                            <TableCell className="py-3 font-semibold text-slate-350">
                              {sp.paymentCycle === "MONTHLY" ? "شهري" : sp.paymentCycle === "ANNUAL" ? "سنوي" : "أخرى"}
                            </TableCell>
                            <TableCell className="py-3 font-mono text-slate-400">{formatDate(sp.deletedAt)}</TableCell>
                            <TableCell className="py-3 pl-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  disabled={actionLoading === sp.id}
                                  onClick={() => handleRestore("SPONSORSHIP", sp.id)}
                                  className="bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-455 border border-emerald-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>استعادة</span>
                                </Button>
                                <Button
                                  disabled={actionLoading === sp.id}
                                  onClick={() => handlePurge("SPONSORSHIP", sp.id)}
                                  className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>حذف نهائي</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ── Projects Tab ── */}
              <TabsContent value="projects">
                {data.projects.length === 0 ? (
                  renderEmptyState("مشاريع")
                ) : (
                  <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-900/10">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-slate-950 border-b border-slate-800">
                        <TableRow className="hover:bg-slate-950 border-0">
                          <TableHead className="text-right text-slate-200 font-bold py-3 pr-4">اسم المشروع</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">الميزانية</TableHead>
                          <TableHead className="text-right text-slate-200 font-bold">تاريخ الحذف</TableHead>
                          <TableHead className="text-center text-slate-200 font-bold pl-4">التحكم والاستعادة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-800/60 bg-transparent text-slate-300">
                        {data.projects.map((p: any) => (
                          <TableRow key={p.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/50">
                            <TableCell className="py-3 pr-4 font-bold text-white">{p.name}</TableCell>
                            <TableCell className="py-3 font-mono font-semibold text-slate-200">
                              {p.budget ? `${Number(p.budget).toLocaleString("en-US")} ${p.currency}` : "-"}
                            </TableCell>
                            <TableCell className="py-3 font-mono text-slate-400">{formatDate(p.deletedAt)}</TableCell>
                            <TableCell className="py-3 pl-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  disabled={actionLoading === p.id}
                                  onClick={() => handleRestore("PROJECT", p.id)}
                                  className="bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-455 border border-emerald-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>استعادة</span>
                                </Button>
                                <Button
                                  disabled={actionLoading === p.id}
                                  onClick={() => handlePurge("PROJECT", p.id)}
                                  className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 font-bold text-[10px] rounded-lg h-7 px-2.5 gap-1 hover:scale-[1.03] active:scale-[0.97] transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>حذف نهائي</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
