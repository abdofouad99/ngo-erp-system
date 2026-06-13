"use server"

import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function loginAction(email: string, password: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "فشل في العثور على المستخدم" }
    }

    // Check if user exists in the Prisma User database
    const dbUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!dbUser) {
      return { success: false, error: "البريد الإلكتروني غير مسجل في نظام الإدارة الرئيسي" }
    }

    if (!dbUser.isActive) {
      return { success: false, error: "هذا الحساب تم تجميده أو إيقافه مؤقتاً" }
    }

    revalidatePath("/")
    return { success: true, role: dbUser.role }
  } catch (err: any) {
    console.error("Login error:", err)
    return { success: false, error: err.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول" }
  }
}

export async function logoutAction() {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    revalidatePath("/")
    return { success: true }
  } catch (err: any) {
    console.error("Logout error:", err)
    return { success: false, error: err.message || "حدث خطأ أثناء تسجيل الخروج" }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return null

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    return dbUser
  } catch (err) {
    console.error("Get current user error:", err)
    return null
  }
}
