"use client"

import { useState, useEffect } from "react"
import { createPaymentReceipt, getReceiptsForSponsor, deletePaymentReceipt } from "@/app/actions/receipt-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Coins, Printer, Plus, Trash2, Calendar, FileText, User, CreditCard } from "lucide-react"

interface ReceiptVoucherSheetProps {
  sponsor: any
}

const PAYMENT_METHODS: Record<string, string> = {
  KURAIMI: "الكريمي للصرافة",
  CASH: "نقداً",
  BANK_TRANSFER: "تحويل بنكي",
  WESTERN_UNION: "ويسترن يونيون",
  OTHER: "أخرى",
}

export function ReceiptVoucherSheet({ sponsor }: ReceiptVoucherSheetProps) {
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Form states
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [paymentMethod, setPaymentMethod] = useState("KURAIMI")
  const [sponsorshipId, setSponsorshipId] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Active print state
  const [activePrintReceipt, setActivePrintReceipt] = useState<any>(null)

  const activeSponsorships = sponsor.sponsorships || []

  const fetchReceipts = async () => {
    setLoading(true)
    const result = await getReceiptsForSponsor(sponsor.id)
    if (result.success) {
      setReceipts(result.receipts)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (sponsor.id) {
      fetchReceipts()
    }
  }, [sponsor.id])

  // Automatically select first sponsorship if available
  useEffect(() => {
    if (activeSponsorships.length > 0 && !sponsorshipId) {
      setSponsorshipId(activeSponsorships[0].id)
      setCurrency(activeSponsorships[0].currency)
      setAmount(activeSponsorships[0].amount.toString())
    }
  }, [activeSponsorships, sponsorshipId])

  const handleSponsorshipChange = (id: string) => {
    setSponsorshipId(id)
    const selected = activeSponsorships.find((s: any) => s.id === id)
    if (selected) {
      setCurrency(selected.currency)
      setAmount(selected.amount.toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0 || !sponsorshipId) {
      setError("يرجى إدخال مبلغ صحيح واختيار الكفالة.")
      return
    }

    setSubmitting(true)
    setError("")

    const result = await createPaymentReceipt({
      amount: Number(amount),
      currency: currency as any,
      paymentMethod,
      notes,
      sponsorshipId,
    })

    if (result.success) {
      setNotes("")
      fetchReceipts()
    } else {
      setError(result.error || "فشل تسجيل سند القبض المالي.")
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف سند القبض المالي هذا؟")) return
    const result = await deletePaymentReceipt(id)
    if (result.success) {
      fetchReceipts()
    }
  }

  const handlePrint = (receipt: any) => {
    setActivePrintReceipt(receipt)
    // Small timeout to let the print frame render, then print
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl gap-2 font-bold text-xs shadow-sm hover:scale-[1.05] active:scale-[0.95] transition-all duration-300">
          <Coins className="h-4 w-4 text-emerald-400" />
          <span>إدارة سندات القبض والمدفوعات</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto text-right bg-slate-950 text-white border-r border-slate-900 shadow-2xl">
        {/* ── Receipt Print Styles ── */}
        <style>{`
          @media print {
            aside, header, nav, .print-hide, button, select, input, [role="dialog"] > :not(.print-container) {
              display: none !important;
            }
            .print-container {
              display: block !important;
              width: 100% !important;
              max-width: 800px !important;
              margin: 20px auto !important;
              padding: 25px !important;
              border: 3px double #333 !important;
              border-radius: 12px !important;
              background: white !important;
              color: black !important;
              direction: rtl !important;
              font-family: 'Outfit', 'Inter', sans-serif !important;
            }
          }
          .print-container {
            display: none;
          }
        `}</style>

        {/* ── Official Receipt Voucher Print Layout (Hidden on Screen, Shown on Print) ── */}
        {activePrintReceipt && (
          <div className="print-container text-right">
            <div className="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-4">
              <div>
                <h1 className="text-xl font-bold">منظمة كفالة ورعاية الأيتام</h1>
                <p className="text-xs text-gray-500">حسابات قسم الرعاية والتسليمات المالية</p>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold bg-slate-100 px-3 py-1 rounded-lg">سند قبض رسمي</h2>
                <p className="text-xs text-mono font-bold mt-1">رقم السند: {activePrintReceipt.receiptNumber}</p>
                <p className="text-xs text-gray-500">التاريخ: {new Date(activePrintReceipt.paymentDate).toLocaleDateString("ar-YE")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border border-gray-300 p-4 rounded-xl mb-4 bg-gray-50/50">
              <div>
                <span className="text-xs text-gray-400 block font-semibold">استلمنا من الكفيل/الجهة:</span>
                <span className="text-sm font-bold text-gray-800">{sponsor.fullName}</span>
              </div>
              <div className="text-left">
                <span className="text-xs text-gray-400 block font-semibold">المبلغ المستلم:</span>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  {Number(activePrintReceipt.amount).toLocaleString("en-US")} {activePrintReceipt.currency}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="border-b border-dashed border-gray-300 pb-2">
                <span className="text-xs text-gray-400 font-semibold ml-2">وذلك لقاء كفالة:</span>
                <span className="text-xs font-bold text-gray-800">
                  {activePrintReceipt.sponsorship?.beneficiary
                    ? `اليتيم: ${activePrintReceipt.sponsorship.beneficiary.fullName}`
                    : `الأسرة الراعية: ${activePrintReceipt.sponsorship?.family?.headFullName}`}
                </span>
              </div>
              <div className="border-b border-dashed border-gray-300 pb-2">
                <span className="text-xs text-gray-400 font-semibold ml-2">طريقة الدفع:</span>
                <span className="text-xs font-bold text-gray-800">{PAYMENT_METHODS[activePrintReceipt.paymentMethod] || activePrintReceipt.paymentMethod}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold ml-2">ملاحظات / تفاصيل إضافية:</span>
                <p className="text-xs text-gray-600 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg mt-1">
                  {activePrintReceipt.notes || "لا توجد ملاحظات."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-900 text-center text-xs">
              <div className="space-y-10">
                <span>المستلم / المحاسب</span>
                <div className="border-b border-gray-400 mx-auto w-32"></div>
              </div>
              <div className="space-y-10">
                <span>مدير الحسابات</span>
                <div className="border-b border-gray-400 mx-auto w-32"></div>
              </div>
              <div className="space-y-10">
                <span>الختم الرسمي للمنظمة</span>
                <div className="h-12 w-12 border-2 border-dashed border-gray-300 rounded-full mx-auto flex items-center justify-center text-gray-300">الختم</div>
              </div>
            </div>
          </div>
        )}

        <SheetHeader className="pb-4 border-b border-slate-900">
          <SheetTitle className="text-right text-lg font-bold text-white">إدارة سندات القبض والمدفوعات</SheetTitle>
          <SheetDescription className="text-right text-slate-400 text-xs">
            تسجيل المدفوعات المستلمة من الكفيل وتوليد طباعة رسمية لسندات القبض المالي.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 print-hide">
          {/* ── Form to add new receipt ── */}
          {activeSponsorships.length === 0 ? (
            <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              لا توجد كفالات نشطة مسجلة لهذا الكفيل لتسجيل دفعات مالية عليها. يرجى إنشاء كفالة أولاً.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="border border-slate-800 p-4 rounded-xl bg-slate-900/40 space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-1">
                <Plus className="h-4 w-4 text-emerald-400" />
                إنشاء سند قبض مالي جديد
              </h4>

              {error && (
                <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Select Sponsorship */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">الكفالة المستهدفة للدفع</label>
                  <select
                    value={sponsorshipId}
                    onChange={(e) => handleSponsorshipChange(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold focus-visible:outline-none text-right text-slate-200 cursor-pointer"
                  >
                    {activeSponsorships.map((s: any) => (
                      <option key={s.id} value={s.id} className="bg-slate-950 text-white">
                        {s.beneficiary
                          ? `يتيم: ${s.beneficiary.fullName}`
                          : `أسرة: ${s.family?.headFullName}`}{" "}
                        ({s.amount} {s.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">المبلغ المقبوض ({currency})</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="أدخل قيمة الدفعة"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-9 text-xs pr-8 font-mono bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                      required
                    />
                    <Coins className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">طريقة الاستلام والقبض</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold focus-visible:outline-none text-right text-slate-200 cursor-pointer"
                  >
                    {Object.entries(PAYMENT_METHODS).map(([val, label]) => (
                      <option key={val} value={val} className="bg-slate-950 text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">ملاحظات السند</label>
                  <Input
                    placeholder="مثل: كفالة شهر مارس وأبريل لعام 2026..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9 text-xs bg-slate-900/60 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl h-9 hover:scale-[1.05] active:scale-[0.95] transition-all duration-350"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ وطباعة السند"}
                </Button>
              </div>
            </form>
          )}

          {/* ── Receipts Log List ── */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white">كشف السندات الصادرة لهذا الكفيل ({receipts.length})</h4>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-500">جاري تحميل كشوف المدفوعات...</div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                لا توجد مدفوعات مسجلة بعد لهذا الكفيل.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xl bg-slate-950/30">
                <Table className="text-right text-xs">
                  <TableHeader className="bg-slate-900/85 border-b border-slate-800">
                    <TableRow className="hover:bg-slate-900 border-0">
                      <TableHead className="text-right text-slate-200 font-bold py-3 pr-4">رقم السند</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold">المستفيد</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold">المبلغ المستلم</TableHead>
                      <TableHead className="text-right text-slate-200 font-bold">طريقة الاستلام</TableHead>
                      <TableHead className="text-center text-slate-200 font-bold pl-4">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800/50 bg-slate-950/20 text-slate-300">
                    {receipts.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-slate-900/40 border-b border-slate-900/50 transition-all duration-200">
                        <TableCell className="py-3 pr-4 font-mono font-bold text-slate-250">
                          {rec.receiptNumber}
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-white">
                          {rec.sponsorship?.beneficiary
                            ? rec.sponsorship.beneficiary.fullName
                            : rec.sponsorship?.family?.headFullName}
                        </TableCell>
                        <TableCell className="py-3 font-mono font-bold text-emerald-400">
                          {Number(rec.amount).toLocaleString("en-US")} {rec.currency}
                        </TableCell>
                        <TableCell className="py-3 font-medium text-slate-400">
                          {PAYMENT_METHODS[rec.paymentMethod] || rec.paymentMethod}
                        </TableCell>
                        <TableCell className="py-3 pl-4 text-center flex items-center justify-center gap-1.5">
                          <Button
                            onClick={() => handlePrint(rec)}
                            className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg h-7 w-7 p-0 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200"
                            title="طباعة السند"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(rec.id)}
                            className="bg-rose-500/15 border border-rose-500/20 text-rose-400 hover:bg-rose-550/25 rounded-lg h-7 w-7 p-0 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200"
                            title="حذف السند"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
