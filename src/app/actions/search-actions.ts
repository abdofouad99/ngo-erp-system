"use server"

import { prisma } from "@/lib/prisma"

export async function globalSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return { success: true, results: [] }
  }

  try {
    const [families, beneficiaries, sponsors] = await Promise.all([
      prisma.family.findMany({
        where: {
          deletedAt: null,
          OR: [
            { headFullName: { contains: query, mode: "insensitive" } },
            { headNationalId: { contains: query } },
          ],
        },
        take: 5,
      }),
      prisma.beneficiary.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { nationalId: { contains: query } },
            { orphanCode: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      prisma.sponsor.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
    ])

    const results = [
      ...families.map((f) => ({
        id: f.id,
        type: "FAMILY",
        title: f.headFullName,
        subtitle: `أسرة - رقم الهوية: ${f.headNationalId}`,
        href: "/dashboard/families",
      })),
      ...beneficiaries.map((b) => ({
        id: b.id,
        type: "BENEFICIARY",
        title: b.fullName,
        subtitle: `مستفيد (${b.category === "ORPHAN" ? "يتيم" : "طالب/آخر"}) - كود: ${b.orphanCode || "-"}`,
        href: b.category === "ORPHAN" ? "/dashboard/orphans" : "/dashboard/families",
      })),
      ...sponsors.map((s) => ({
        id: s.id,
        type: "SPONSOR",
        title: s.fullName,
        subtitle: `كفيل - ${s.country || "البلد غير محدد"}`,
        href: "/dashboard/sponsors",
      })),
    ]

    return { success: true, results }
  } catch (error: any) {
    console.error("Global search failed:", error)
    return { success: false, error: error.message, results: [] }
  }
}
