"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    })
    const unreadCount = await prisma.notification.count({
      where: { read: false }
    })
    return { success: true, notifications, unreadCount }
  } catch (error: any) {
    console.error("Failed to get notifications:", error)
    return { success: false, error: error.message, notifications: [], unreadCount: 0 }
  }
}

export async function createNotification(data: {
  title: string
  message: string
  type?: string
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || "INFO"
      }
    })
    revalidatePath("/dashboard")
    return { success: true, notification }
  } catch (error: any) {
    console.error("Failed to create notification:", error)
    return { success: false, error: error.message }
  }
}

export async function markAsRead(id: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    })
    revalidatePath("/dashboard")
    return { success: true, notification }
  } catch (error: any) {
    console.error("Failed to mark notification as read:", error)
    return { success: false, error: error.message }
  }
}

export async function markAllAsRead() {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true }
    })
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to mark all notifications as read:", error)
    return { success: false, error: error.message }
  }
}
