"use client"

import React from "react"
import { calculateFamilyNeedScore, FamilyNeedData } from "@/lib/need-score-calculator"

interface NeedScoreBadgeProps {
  score?: number | null
  familyData?: FamilyNeedData
  showBar?: boolean
  size?: "sm" | "md" | "lg"
}

export function NeedScoreBadge({ score: rawScore, familyData, showBar = true, size = "md" }: NeedScoreBadgeProps) {
  let score = rawScore ?? 0

  let priorityAr = "منخفضة"
  let badgeStyle = "from-slate-600 to-slate-700 text-slate-200 border-slate-600/50 shadow-slate-900/20"
  let progressGradient = "from-slate-500 to-slate-400"

  if (familyData && rawScore === undefined) {
    const calc = calculateFamilyNeedScore(familyData)
    score = calc.score
  }

  if (score >= 75) {
    priorityAr = "حرج"
    badgeStyle = "from-rose-600 to-pink-700 text-white border-rose-500/60 shadow-rose-900/40 animate-pulse"
    progressGradient = "from-rose-500 via-pink-500 to-red-400"
  } else if (score >= 55) {
    priorityAr = "عالية"
    badgeStyle = "from-amber-600 to-yellow-600 text-white border-amber-500/60 shadow-amber-900/40"
    progressGradient = "from-amber-500 to-yellow-400"
  } else if (score >= 35) {
    priorityAr = "متوسطة"
    badgeStyle = "from-teal-600 to-emerald-600 text-white border-teal-500/60 shadow-teal-900/40"
    progressGradient = "from-teal-500 to-emerald-400"
  }

  const isSmall = size === "sm"

  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <div className="flex items-center justify-between gap-1.5">
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-lg border bg-gradient-to-r ${badgeStyle} ${
            isSmall ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
          } shadow-sm`}
        >
          <span>{priorityAr}</span>
          <span className="font-extrabold font-mono">({score}%)</span>
        </span>
      </div>

      {showBar && (
        <div className="w-full bg-slate-900/80 rounded-full h-1.5 p-0.5 border border-border/40 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${progressGradient} transition-all duration-700 ease-out`}
            style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
          />
        </div>
      )}
    </div>
  )
}
