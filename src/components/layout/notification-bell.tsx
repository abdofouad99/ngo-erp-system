"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Info, AlertTriangle, ShieldAlert, CheckCircle, Clock } from "lucide-react"
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notification-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    setLoading(true)
    const result = await getNotifications()
    if (result.success) {
      setNotifications(result.notifications || [])
      setUnreadCount(result.unreadCount || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()

    // Poll every 15 seconds to fetch new notifications (simulated real-time)
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    const result = await markAsRead(id)
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
  }

  const handleMarkAllRead = async () => {
    const result = await markAllAsRead()
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return {
          icon: CheckCircle,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        }
      case "WARNING":
        return {
          icon: AlertTriangle,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        }
      case "ALERT":
        return {
          icon: ShieldAlert,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        }
      default:
        return {
          icon: Info,
          color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        }
    }
  }

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-muted-foreground hover:text-foreground hover:bg-slate-800/60 focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute end-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white leading-none">
            {unreadCount}
          </span>
        )}
        <span className="sr-only">الإشعارات</span>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 mt-2.5 w-80 sm:w-96 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden text-right animate-in fade-in-50 slide-in-from-top-1 duration-200 glass-panel">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-slate-900/50 px-4 py-3">
              <h3 className="text-xs font-bold text-foreground">الإشعارات والتنبيهات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>تحديد المقروء</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-border/40">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
                  <Bell className="h-8 w-8 text-slate-800" />
                  <span className="text-xs font-medium">لا توجد إشعارات حالية.</span>
                </div>
              ) : (
                notifications.map((n) => {
                  const style = getTypeStyle(n.type)
                  const Icon = style.icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && handleMarkAsRead(n.id)}
                      className={`flex gap-3 p-3 text-right transition-colors cursor-pointer ${
                        n.read ? "bg-card hover:bg-slate-800/40" : "bg-emerald-500/5 hover:bg-emerald-500/10 border-r-2 border-emerald-500"
                      }`}
                    >
                      {/* Left side: Icon */}
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${style.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      {/* Right side: Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <span className={`text-xs font-bold ${n.read ? "text-foreground/80 font-semibold" : "text-foreground font-bold"}`}>
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(n.createdAt).toLocaleString("ar-YE")}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
