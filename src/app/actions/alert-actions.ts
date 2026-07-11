"use server"

import { prisma } from "@/lib/prisma"
import { createNotification } from "@/app/actions/notification-actions"
import { sendWhatsAppNotification } from "@/lib/whatsapp-notify"

/**
 * جلب الكفالات التي ستنتهي خلال 30 يوم
 */
export async function getExpiringSponshorships() {
  try {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const expiring = await prisma.sponsorship.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        endDate: {
          gte: now,
          lte: in30Days,
        },
      },
      include: {
        sponsor: { select: { fullName: true, phone: true } },
        beneficiary: {
          select: {
            fullName: true,
            family: { select: { headFullName: true } },
          },
        },
      },
      orderBy: { endDate: "asc" },
    })

    return { success: true, expiring }
  } catch (error: any) {
    return { success: false, error: error.message, expiring: [] }
  }
}

/**
 * جلب الأسر التي لم تُزَر منذ أكثر من 90 يوم
 */
export async function getUnvisitedFamilies() {
  try {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // الأسر التي آخر نشاط لها (زيارة/اتصال) أقدم من 90 يوم أو لا يوجد نشاط أصلاً
    const families = await prisma.family.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          {
            caseActivities: {
              none: {},
            },
          },
          {
            caseActivities: {
              every: {
                createdAt: { lt: ninetyDaysAgo },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        headFullName: true,
        headPhoneNumber: true,
        caseActivities: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, type: true },
        },
      },
      take: 50,
    })

    return { success: true, families }
  } catch (error: any) {
    return { success: false, error: error.message, families: [] }
  }
}

/**
 * فحص ومعالجة التنبيهات التلقائية:
 * - إنشاء إشعار داخلي لكل كفالة ستنتهي قريباً
 * - إرسال WhatsApp للمسؤول (أول مستخدم ADMIN)
 */
export async function checkAndCreateAlerts() {
  try {
    const { expiring } = await getExpiringSponshorships()
    if (!expiring || expiring.length === 0) return { success: true, created: 0 }

    // جلب رقم المسؤول الأول
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { phone: true, name: true },
    })

    let created = 0
    for (const sp of expiring) {
      const beneficiaryName =
        sp.beneficiary?.fullName || sp.beneficiary?.family?.headFullName || "—"
      const sponsorName = sp.sponsor?.fullName || "—"
      const endDate = sp.endDate
        ? new Date(sp.endDate).toLocaleDateString("en-GB")
        : "—"

      const daysLeft = sp.endDate
        ? Math.ceil(
            (new Date(sp.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : 0

      // تحقق: هل يوجد إشعار مشابه تم إنشاؤه اليوم؟
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const existingToday = await prisma.notification.findFirst({
        where: {
          title: { contains: "كفالة ستنتهي" },
          message: { contains: sp.id },
          createdAt: { gte: today },
        },
      })
      if (existingToday) continue

      // إنشاء إشعار داخلي
      await createNotification({
        title: `⚠️ كفالة ستنتهي خلال ${daysLeft} يوم`,
        message: `كفالة المستفيد "${beneficiaryName}" من الكفيل "${sponsorName}" ستنتهي بتاريخ ${endDate}. (ID: ${sp.id})`,
        type: "WARNING",
      })
      created++

      // إرسال WhatsApp للمسؤول
      if (adminUser?.phone) {
        await sendWhatsAppNotification(
          adminUser.phone,
          `⚠️ *تنبيه: كفالة ستنتهي قريباً*\n\n` +
            `المستفيد: ${beneficiaryName}\n` +
            `الكفيل: ${sponsorName}\n` +
            `تاريخ الانتهاء: ${endDate}\n` +
            `المتبقي: ${daysLeft} يوم\n\n` +
            `يرجى التواصل مع الكفيل لتجديد الكفالة.`
        )
      }
    }

    return { success: true, created }
  } catch (error: any) {
    console.error("checkAndCreateAlerts error:", error)
    return { success: false, error: error.message, created: 0 }
  }
}

/**
 * جلب إحصائيات التنبيهات للوحة القيادة
 */
export async function getAlertStats() {
  try {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [expiringCount, unvisitedCount] = await Promise.all([
      prisma.sponsorship.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          endDate: { gte: now, lte: in30Days },
        },
      }),
      prisma.family.count({
        where: {
          isActive: true,
          deletedAt: null,
          caseActivities: { none: {} },
        },
      }),
    ])

    return { success: true, expiringCount, unvisitedCount }
  } catch (error: any) {
    return { success: false, error: error.message, expiringCount: 0, unvisitedCount: 0 }
  }
}
