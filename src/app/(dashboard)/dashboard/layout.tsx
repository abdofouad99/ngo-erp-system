import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { getCurrentUser } from "@/app/actions/auth-actions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const isMarketer = user?.role === "MARKETER"

  return (
    // RTL flex row: sidebar appears on the RIGHT naturally (correct for Arabic UI)
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ── Desktop Sidebar (hidden for MARKETER role) ───────────── */}
      {!isMarketer && (
        <div className="hidden flex-shrink-0 md:flex">
          <AppSidebar />
        </div>
      )}

      {/* ── Main Area ───────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader isMarketer={isMarketer} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
