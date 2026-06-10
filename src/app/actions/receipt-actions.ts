"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Currency } from "@prisma/client"
import { createNotification } from "@/app/actions/notification-actions"

export async function createPaymentReceipt(data: {
  amount: number
  currency: Currency
  paymentMethod: string
  notes?: string
  sponsorshipId: string
}) {
  try {
    // Generate sequential auto-incrementing receipt number
    const count = await prisma.paymentReceipt.count()
    const year = new Date().getFullYear()
    const receiptNumber = `REC-${year}-${String(count + 1).padStart(4, "0")}`

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    })

    const receipt = await prisma.paymentReceipt.create({
      data: {
        receiptNumber,
        amount: data.amount,
        currency: data.currency,
        paymentDate: new Date(),
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
        sponsorshipId: data.sponsorshipId,
        recordedById: adminUser?.id || null,
      },
      include: {
        sponsorship: {
          include: {
            sponsor: true,
            beneficiary: true,
            family: true,
          },
        },
      },
    })

    revalidatePath("/dashboard/sponsors")

    await createNotification({
      title: "إصدار سند قبض مالي",
      message: `تم تسجيل سند القبض رقم ${receiptNumber} بمبلغ ${data.amount} ${data.currency} لكفالة اليتيم/الأسرة.`,
      type: "SUCCESS"
    })

    return { success: true, receipt }
  } catch (error: any) {
    console.error("Failed to create payment receipt:", error)
    return { success: false, error: error.message }
  }
}

export async function getReceiptsForSponsor(sponsorId: string) {
  try {
    const receipts = await prisma.paymentReceipt.findMany({
      where: {
        sponsorship: {
          sponsorId,
        },
      },
      include: {
        sponsorship: {
          include: {
            beneficiary: true,
            family: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    })

    return { success: true, receipts }
  } catch (error: any) {
    console.error("Failed to fetch sponsor receipts:", error)
    return { success: false, error: error.message, receipts: [] }
  }
}

export async function getReceiptsForSponsorship(sponsorshipId: string) {
  try {
    const receipts = await prisma.paymentReceipt.findMany({
      where: {
        sponsorshipId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    })

    return { success: true, receipts }
  } catch (error: any) {
    console.error("Failed to fetch sponsorship receipts:", error)
    return { success: false, error: error.message, receipts: [] }
  }
}

export async function deletePaymentReceipt(id: string) {
  try {
    await prisma.paymentReceipt.delete({
      where: { id },
    })

    revalidatePath("/dashboard/sponsors")

    await createNotification({
      title: "حذف سند قبض مالي",
      message: `تم إلغاء وحذف سند القبض المالي من النظام.`,
      type: "WARNING"
    })

    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete receipt:", error)
    return { success: false, error: error.message }
  }
}
