/**
 * Need Score & Vulnerability Calculator
 * -------------------------------------------------------------
 * Computes a weighted score from 0 to 100 representing family need level:
 * - 80 - 100: 🔴 حرج (Critical)
 * - 60 - 79:  🟠 عالي (High)
 * - 40 - 59:  🟡 متوسط (Moderate)
 * - 0 - 39:   🟢 منخفض (Low)
 */

export interface ScoreWeights {
  perCapitaIncomeWeight: number // Max 30 pts
  familySizeWeight: number      // Max 20 pts
  orphansWeight: number         // Max 15 pts
  specialNeedsWeight: number   // Max 15 pts
  housingConditionWeight: number // Max 10 pts
  vulnerableMembersWeight: number // Max 10 pts (elderly + infants + widows)
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  perCapitaIncomeWeight: 30,
  familySizeWeight: 20,
  orphansWeight: 15,
  specialNeedsWeight: 15,
  housingConditionWeight: 10,
  vulnerableMembersWeight: 10,
}

export interface FamilyNeedData {
  familyMembersCount?: number | null
  manualMembersCount?: number | null
  monthlyIncome?: number | null
  orphansCount?: number | null
  hasOrphans?: boolean | null
  hasWidow?: boolean | null
  specialNeedsCount?: number | null
  kidsUnder5Count?: number | null
  elderlyAbove60Count?: number | null
  housingCondition?: string | null
  housingType?: string | null
  isDisplaced?: boolean | null
  povertyLevel?: string | null
}

export function calculateFamilyNeedScore(
  data: FamilyNeedData,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): { score: number; priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; priorityAr: string; badgeColor: string; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  const totalMembers = data.manualMembersCount || data.familyMembersCount || 1
  const income = data.monthlyIncome || 0
  const perCapita = totalMembers > 0 ? income / totalMembers : income

  // 1. Income per capita (Max 30 pts)
  if (income === 0 || perCapita < 10000) {
    score += weights.perCapitaIncomeWeight
    reasons.push("دخل معدوم أو منخفض جداً للفرد")
  } else if (perCapita < 25000) {
    const pts = Math.round(weights.perCapitaIncomeWeight * 0.7)
    score += pts
    reasons.push("نصيب الفرد من الدخل أقل من خط الفقر")
  } else if (perCapita < 50000) {
    const pts = Math.round(weights.perCapitaIncomeWeight * 0.4)
    score += pts
    reasons.push("دخل متوسط محدود")
  }

  // 2. Family Size (Max 20 pts)
  if (totalMembers >= 8) {
    score += weights.familySizeWeight
    reasons.push(`أسرة كبيرة العدد (${totalMembers} أفراد)`)
  } else if (totalMembers >= 5) {
    const pts = Math.round(weights.familySizeWeight * 0.6)
    score += pts
    reasons.push(`أسرة متوسطة العدد (${totalMembers} أفراد)`)
  } else if (totalMembers >= 3) {
    const pts = Math.round(weights.familySizeWeight * 0.3)
    score += pts
  }

  // 3. Orphans (Max 15 pts)
  const orphans = data.orphansCount || (data.hasOrphans ? 1 : 0)
  if (orphans >= 3) {
    score += weights.orphansWeight
    reasons.push(`تعول ${orphans} أيتام`)
  } else if (orphans > 0) {
    const pts = Math.round(weights.orphansWeight * (orphans / 3))
    score += pts
    reasons.push(`تعول ${orphans} يتيم`)
  }

  // 4. Special Needs / Chronic Diseases (Max 15 pts)
  const disabled = data.specialNeedsCount || 0
  if (disabled >= 2) {
    score += weights.specialNeedsWeight
    reasons.push(`وجود ${disabled} حالات إعاقة/أمراض مزمنة`)
  } else if (disabled === 1) {
    const pts = Math.round(weights.specialNeedsWeight * 0.7)
    score += pts
    reasons.push("وجود حالة إعاقة/مرض مزمن")
  }

  // 5. Housing Condition (Max 10 pts)
  const houseCond = (data.housingCondition || data.housingType || "").toLowerCase()
  if (houseCond.includes("متهالك") || houseCond.includes("خيمة") || houseCond.includes("مكشوف") || houseCond.includes("سيء")) {
    score += weights.housingConditionWeight
    reasons.push("سكن متهالك أو غير ملائم")
  } else if (houseCond.includes("إيجار") || houseCond.includes("مقبول")) {
    const pts = Math.round(weights.housingConditionWeight * 0.5)
    score += pts
    reasons.push("سكن بالإيجار")
  }

  // 6. Vulnerable Members (Infants, Elderly, Widows, Displaced) (Max 10 pts)
  let vulnPts = 0
  if (data.hasWidow) {
    vulnPts += 4
    reasons.push("أسرة أرملة")
  }
  if ((data.kidsUnder5Count || 0) > 0) {
    vulnPts += 3
    reasons.push("وجود أطفال دون الخامسة")
  }
  if ((data.elderlyAbove60Count || 0) > 0) {
    vulnPts += 3
    reasons.push("وجود كبار سن فوق 60 سنة")
  }
  if (data.isDisplaced) {
    vulnPts += 3
    reasons.push("أسرة نازحة")
  }
  score += Math.min(weights.vulnerableMembersWeight, vulnPts)

  // Final score normalized to 100
  const finalScore = Math.min(100, Math.max(0, score))

  let priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW"
  let priorityAr = "منخفضة"
  let badgeColor = "bg-slate-700/40 text-slate-300 border-slate-600/40"

  if (finalScore >= 75) {
    priority = "CRITICAL"
    priorityAr = "حرج جداً"
    badgeColor = "bg-rose-900/50 text-rose-300 border-rose-700/60"
  } else if (finalScore >= 55) {
    priority = "HIGH"
    priorityAr = "عالية"
    badgeColor = "bg-amber-900/50 text-amber-300 border-amber-700/60"
  } else if (finalScore >= 35) {
    priority = "MEDIUM"
    priorityAr = "متوسطة"
    badgeColor = "bg-teal-900/50 text-teal-300 border-teal-700/60"
  }

  return {
    score: finalScore,
    priority,
    priorityAr,
    badgeColor,
    reasons,
  }
}
