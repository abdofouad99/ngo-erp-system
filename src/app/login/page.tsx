"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "@/app/actions/auth-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Heart, Lock, Mail, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور")
      return
    }

    setLoading(true)
    const res = await loginAction(email, password)

    if (res.success) {
      if (res.role === "MARKETER") {
        router.push("/dashboard/marketer")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    } else {
      setError(res.error || "فشل تسجيل الدخول. تأكد من البيانات.")
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#090b11] px-4 py-12" dir="rtl">
      {/* ── Background Gradients ─────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* ── Login Card ───────────────────────────────────────────── */}
      <Card className="relative w-full max-w-md border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-2xl p-4 overflow-hidden">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-xl shadow-teal-500/20 ring-2 ring-emerald-500/30 overflow-hidden">
            <img src="/logo.jpg" alt="جمعية اليتامى التنموية" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-xl font-black text-white">جمعية اليتامى التنموية</CardTitle>
          <CardDescription className="text-xs text-teal-400 font-bold uppercase tracking-wider mt-1">
            ORPHANS DEVELOPMENT — بوابة الإدارة الموحدة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-950/40 border border-red-900/50 p-3 text-xs font-bold text-red-400">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-350">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="email"
                  placeholder="name@ngo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 bg-slate-900/60 border-slate-800 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 text-white placeholder-slate-550 text-sm h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-350">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 bg-slate-900/60 border-slate-800 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 text-white placeholder-slate-550 text-sm h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-10 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                "دخول"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
