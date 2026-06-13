export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Baby, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { OrphansClient } from "./orphans-client"
import { AddOrphanSheet } from "@/components/orphans/add-orphan-sheet"
import { getAllTags } from "@/app/actions/tag-actions"

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getOrphans() {
  return await prisma.beneficiary.findMany({
    where: {
      category: "ORPHAN",
      deletedAt: null,
    },
    include: {
      family: true,
      sponsorships: {
        include: {
          sponsor: true,
        },
      },
      tags: {
        include: { tag: true },
      },
      guardians: {
        orderBy: { isPrimary: "desc" },
      },
      siblings: {
        orderBy: { siblingOrder: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

async function getFamilies() {
  return await prisma.family.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      headFullName: true,
    },
    orderBy: {
      headFullName: "asc",
    },
  })
}

// =============================================================================
// COMPONENT
// =============================================================================

export default async function OrphansPage() {
  const [orphans, families, tagsResult] = await Promise.all([
    getOrphans(),
    getFamilies(),
    getAllTags(),
  ])
  const allTags = tagsResult.success ? tagsResult.tags || [] : []

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gradient md:text-2xl">إدارة الأيتام</h2>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            استعراض وإدارة بيانات الأيتام المسجلين في النظام وتتبع حالات كفالتهم.
          </p>
        </div>
        <AddOrphanSheet families={families} />
      </div>

      {/* ── Stats Summary ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="glass-card border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.02)] hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-400">إجمالي الأيتام</p>
                <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
                  {orphans.length.toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                <Baby className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.02)] hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-400">الأيتام الذكور</p>
                <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
                  {orphans.filter(o => o.gender === "MALE").length.toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <Baby className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.02)] hover:border-rose-500/40 hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-rose-400">الأيتام الإناث</p>
                <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">
                  {orphans.filter(o => o.gender === "FEMALE").length.toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400">
                <Heart className="h-5 w-5" fill="currentColor" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Interactive Orphans Client (Table, Filters, Detailed View Sheet) ── */}
      <OrphansClient initialOrphans={orphans} allTags={allTags} families={families} />
    </div>
  )
}
