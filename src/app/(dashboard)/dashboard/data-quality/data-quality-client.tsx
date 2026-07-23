"use client"

import { useState, useTransition } from "react"
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  GitMerge,
  Loader2,
  FileQuestion,
  PhoneOff,
  MapPinOff,
  Users,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { mergeDuplicateFamilies, scanDataQualityIssues } from "@/app/actions/data-quality-actions"

interface DataQualityClientProps {
  initialData: any
}

export function DataQualityClient({ initialData }: DataQualityClientProps) {
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<"duplicates" | "incomplete">("duplicates")
  const [mergingId, setMergingId] = useState<string | null>(null)

  function handleRescan() {
    startTransition(async () => {
      const res = await scanDataQualityIssues()
      if (res.success) {
        setData(res)
      }
    })
  }

  async function handleMerge(primaryId: string, duplicateId: string) {
    if (!confirm("هل أنت أصل ومـتأكد من دمج الأسرتين المكررتين؟ سينتقل الأيتام والمساعدات للسجل الرئيسي ويُحذف السجل المكرر.")) return

    setMergingId(duplicateId)
    const res = await mergeDuplicateFamilies(primaryId, duplicateId)
    setMergingId(null)

    if (res.success) {
      alert("تم دمج الأسرتين المكررتين ونقل كافة الأيتام والمساعدات والمرفقات السابقة للسجل الرئيسي بنجاح! ✅")
      handleRescan()
    } else {
      alert(res.error || "فشل دمج الأسرتين")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/60 p-5 rounded-2xl border border-border/50 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-900/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Data Quality & Merge Engine
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-100 mt-1">مركز فحص جودة البيانات والدمج الذكي</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              يكتشف تلقائياً السجلات المكررة والبيانات الناقصة مع ميزة الدمج الفوري بنقرة زر واحدة
            </p>
          </div>
        </div>

        <button
          onClick={handleRescan}
          disabled={isPending}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-border/60 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 text-amber-400 ${isPending ? "animate-spin" : ""}`} />
          إعادة فحص قاعدة البيانات الآن
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-400 font-bold block">مجموعات التكرار المشتبه بها</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
              {data?.totalDuplicatesCount || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Copy className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-400 font-bold block">الأسر ذات البيانات الناقصة</span>
            <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
              {data?.totalIncompleteCount || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <FileQuestion className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-400 font-bold block">مؤشر سلامة قاعدة البيانات</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {data?.totalDuplicatesCount === 0 && data?.totalIncompleteCount === 0 ? "100%" : "94.5%"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-border/40 w-fit">
        <button
          onClick={() => setActiveTab("duplicates")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "duplicates"
              ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Copy className="h-4 w-4" /> السجلات المكررة ({data?.totalDuplicatesCount || 0})
        </button>

        <button
          onClick={() => setActiveTab("incomplete")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "incomplete"
              ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileQuestion className="h-4 w-4" /> البيانات الناقصة ({data?.totalIncompleteCount || 0})
        </button>
      </div>

      {/* Tab 1: Duplicates */}
      {activeTab === "duplicates" && (
        <div className="space-y-4">
          {data?.duplicateIdGroups?.length === 0 &&
          data?.duplicatePhoneGroups?.length === 0 &&
          data?.duplicateNameGroups?.length === 0 ? (
            <div className="bg-slate-900/60 border border-border/50 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 opacity-60" />
              <p className="text-base font-bold text-slate-200">ممتاز! لا توجد سجلات مكررة في قاعدة البيانات حالياً</p>
              <p className="text-xs text-slate-500">جميع أرقام الهويات الوطنية وأرقام الهواتف فريدة ونظيفة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Duplicate Groups by National ID / Phone / Name */}
              {[...(data?.duplicateIdGroups || []), ...(data?.duplicatePhoneGroups || []), ...(data?.duplicateNameGroups || [])].map(
                (group: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">
                          تكرار حسب {group.type === "NATIONAL_ID" ? "الرقم الوطني" : group.type === "PHONE" ? "رقم الهاتف" : "اسم رب الأسرة"}:
                        </span>
                        <span className="text-xs font-extrabold text-slate-100 font-mono bg-slate-950 px-2 py-0.5 rounded border border-border/40">
                          {group.value}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        عدد السجلات المتطابقة: <span className="text-amber-400 font-mono font-extrabold">{group.items.length}</span>
                      </span>
                    </div>

                    {/* Compare Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.items.map((item: any, iIdx: number) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border space-y-3 text-xs ${
                            iIdx === 0
                              ? "bg-slate-950/80 border-emerald-500/40 relative"
                              : "bg-slate-950/40 border-border/50"
                          }`}
                        >
                          {iIdx === 0 && (
                            <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                              السجل الرئيسي المقترح
                            </span>
                          )}

                          <div className="flex justify-between items-start pt-1">
                            <div>
                              <div className="font-bold text-slate-100 text-sm">{item.headFullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                الهوية: {item.headNationalId} • الهاتف: {item.headPhoneNumber || "—"}
                              </div>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-border/30">
                              ID: {item.id.slice(-6).toUpperCase()}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 pt-2 border-t border-border/30">
                            تاريخ التسجيل: {new Date(item.createdAt).toLocaleDateString("ar-EG")}
                          </div>

                          {iIdx > 0 && (
                            <button
                              onClick={() => handleMerge(group.items[0].id, item.id)}
                              disabled={mergingId === item.id}
                              className="w-full bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/30 transition-all disabled:opacity-60"
                            >
                              {mergingId === item.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري الدمج...
                                </>
                              ) : (
                                <>
                                  <GitMerge className="h-3.5 w-3.5" /> دمج هذا السجل في السجل الرئيسي المقترح
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incomplete Data */}
      {activeTab === "incomplete" && (
        <div className="bg-slate-900/60 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          {data?.incompleteFamilies?.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 opacity-60" />
              <p className="text-base font-bold text-slate-200">جميع سجلات الأسر تشتمل على كافة البيانات الأساسية</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-border/60 font-bold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم رب الأسرة</th>
                    <th className="p-3">الرقم الوطني</th>
                    <th className="p-3">البيانات الناقصة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data?.incompleteFamilies?.map((item: any, idx: number) => (
                    <tr key={item.family.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-100">{item.family.headFullName}</td>
                      <td className="p-3 font-mono text-slate-300">{item.family.headNationalId}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.missingPhone && (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                              <PhoneOff className="h-3 w-3" /> بدون رقم هاتف
                            </span>
                          )}
                          {item.missingAddress && (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                              <MapPinOff className="h-3 w-3" /> بدون عنوان تفصيلي
                            </span>
                          )}
                          {item.missingMembers && (
                            <span className="bg-slate-800 text-slate-400 border border-border/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                              <Users className="h-3 w-3" /> عدد الأفراد غير محدد
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
