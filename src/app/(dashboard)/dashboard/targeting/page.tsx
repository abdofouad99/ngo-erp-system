export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { TargetingClient } from "./targeting-client"

async function getGeography() {
  return await prisma.governorate.findMany({
    include: {
      districts: {
        include: {
          subDistricts: {
            select: { id: true, nameAr: true },
            orderBy: { nameAr: "asc" },
          },
        },
        orderBy: { nameAr: "asc" },
      },
    },
    orderBy: { nameAr: "asc" },
  })
}

export default async function TargetingPage() {
  const geography = await getGeography()
  return <TargetingClient geography={geography} />
}
