"use client"

import { useState } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  Printer, 
  QrCode, 
  User, 
  Phone, 
  MapPin, 
  Users, 
  Calendar 
} from "lucide-react"

interface FamilyCardSheetProps {
  family: any
  trigger?: React.ReactNode
}

export function FamilyCardSheet({ family, trigger }: FamilyCardSheetProps) {
  const [open, setOpen] = useState(false)

  // Generate QR Code URL using free secure public API
  // Uses family ID to scan and retrieve the profile
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    family.id
  )}`

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "—"
    return new Date(dateVal).toLocaleDateString("ar-YE-u-nu-latn")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs h-8 border-emerald-500/20 hover:bg-emerald-950/20 hover:text-emerald-400"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>بطاقة الأسرة</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md bg-slate-950 border-l border-border text-white overflow-y-auto">
        <SheetHeader className="text-right">
          <SheetTitle className="text-lg font-bold text-white flex items-center gap-2 justify-start">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            بطاقة التعريف الرقمية للأسرة
          </SheetTitle>
        </SheetHeader>

        <Separator className="my-4 border-border/40" />

        <div className="space-y-6 text-right">
          {/* كرت البطاقة (المعاينة المرئية) */}
          <div 
            id="printable-family-card" 
            className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/30 p-6 shadow-2xl overflow-hidden aspect-[1.586/1]"
            style={{ direction: "rtl" }}
          >
            {/* الخلفية الجمالية */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

            {/* الهيدر */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-white p-0.5 shadow overflow-hidden flex-shrink-0">
                  <img src="/logo.jpg" alt="جمعية اليتامى التنموية" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white leading-tight">جمعية اليتامى التنموية</h3>
                  <p className="text-[9px] text-teal-400 font-bold uppercase tracking-wider">ORPHANS DEVELOPMENT</p>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-left font-bold">
                YT-2026-{family.id.slice(-4).toUpperCase()}
              </div>
            </div>

            <Separator className="border-emerald-500/10 mb-4" />

            {/* جسم الكرت */}
            <div className="grid grid-cols-3 gap-3 items-center">
              {/* التفاصيل */}
              <div className="col-span-2 space-y-2 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block">رب الأسرة</span>
                  <span className="font-bold text-slate-200 block truncate">{family.headFullName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">رقم الهوية الوطنية</span>
                  <span className="font-semibold text-slate-300 font-mono block">{family.headNationalId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-500 block">عدد الأفراد</span>
                    <span className="font-bold text-emerald-400 block">{family.manualMembersCount || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">الهاتف</span>
                    <span className="font-semibold text-slate-300 font-mono block">{family.headPhoneNumber || "—"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">العنوان</span>
                  <span className="font-semibold text-slate-300 text-[11px] block truncate">
                    {family.subDistrict?.district?.governorate?.nameAr} - {family.subDistrict?.district?.nameAr}
                  </span>
                </div>
              </div>

              {/* الـ QR Code */}
              <div className="flex flex-col items-center justify-center p-1 bg-white rounded-xl border border-emerald-500/20 aspect-square">
                <img 
                  src={qrCodeUrl} 
                  alt="Family QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* الفوتر */}
            <div className="absolute bottom-3 left-6 right-6 flex justify-between items-center text-[8px] text-slate-500">
              <span>تاريخ التسجيل: {formatDate(family.createdAt)}</span>
              <span className="text-emerald-400/60 font-bold">معتمدة رقمياً</span>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 active:scale-[0.98] w-full gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة بطاقة الأسرة</span>
            </Button>
          </div>

          <Separator className="border-border/40" />

          {/* تعليمات الطباعة والتحقق */}
          <div className="rounded-xl border border-border/50 bg-slate-900/40 p-4 text-xs leading-relaxed space-y-2 text-slate-300">
            <p className="font-bold text-slate-200">🔍 آلية التحقق والطباعة:</p>
            <ul className="list-disc pr-4 space-y-1">
              <li>عند النقر على "طباعة"، سيقوم المتصفح تلقائياً بتهيئة البطاقة للطباعة على كروت التعريف أو الأوراق المنسقة وتجاهل الأجزاء الأخرى من الصفحة.</li>
              <li>يمكن للباحثين الميدانيين استخدام كاميرا هواتفهم لقراءة رمز الـ QR Code على البطاقة للوصول لملف الأسرة وتسجيل المعونات دون أي بحث يدوي.</li>
            </ul>
          </div>
        </div>

        {/* ستايل الطباعة فقط للبطاقة */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-family-card, #printable-family-card * {
              visibility: visible !important;
            }
            #printable-family-card {
              position: absolute !important;
              left: 50% !important;
              top: 40% !important;
              transform: translate(-50%, -50%) scale(1.4) !important;
              width: 500px !important;
              height: 315px !important;
              margin: 0 !important;
              padding: 24px !important;
              box-shadow: none !important;
              border: 1px solid #10b981 !important;
              background: #020617 !important;
              color: white !important;
              border-radius: 16px !important;
            }
          }
        `}</style>
      </SheetContent>
    </Sheet>
  )
}
